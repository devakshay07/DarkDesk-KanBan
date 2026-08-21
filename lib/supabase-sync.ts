import type { SupabaseClient } from "@supabase/supabase-js";
import type { Board, Column, Label, Task, Workspace } from "../types/kanban";
import { boardToDbBoard, columnToDbColumn, dbToWorkspace, taskToDbCard } from "./supabase-types";

// ── Fetch entire workspace ─────────────────────────────────────────────

export async function fetchWorkspace(
  client: SupabaseClient,
  userId: string,
  activeBoardId?: string,
): Promise<Workspace | null> {
  const { data: boards, error: boardsErr } = await client
    .from("boards")
    .select("*")
    .eq("user_id", userId)
    .order("position");

  if (boardsErr) { console.error("[Sync] fetch boards:", boardsErr); return null; }
  if (!boards || boards.length === 0) return null;

  const boardIds = boards.map((b) => b.id);

  const { data: columns, error: colErr } = await client
    .from("columns")
    .select("*")
    .in("board_id", boardIds)
    .order("position");

  if (colErr) { console.error("[Sync] fetch columns:", colErr); return null; }

  const columnIds = (columns ?? []).map((c) => c.id);

  const { data: cards, error: cardErr } = columnIds.length > 0
    ? await client.from("cards").select("*").in("column_id", columnIds).order("position")
    : { data: [], error: null };

  if (cardErr) { console.error("[Sync] fetch cards:", cardErr); return null; }

  return dbToWorkspace(boards, columns ?? [], cards ?? [], activeBoardId);
}

// ── Board operations ───────────────────────────────────────────────────

export async function syncBoard(
  client: SupabaseClient,
  board: Board,
  userId: string,
  position: number,
  labels: Label[],
) {
  const row = boardToDbBoard(board, userId, position, labels);
  const { error } = await client.from("boards").upsert(row, { onConflict: "id" });
  if (error) console.error("[Sync] upsert board:", error);
}

export async function syncDeleteBoard(client: SupabaseClient, boardId: string) {
  const { error } = await client.from("boards").delete().eq("id", boardId);
  if (error) console.error("[Sync] delete board:", error);
}

// ── Column operations ──────────────────────────────────────────────────

export async function syncColumn(
  client: SupabaseClient,
  column: Column,
  boardId: string,
  position: number,
) {
  const row = columnToDbColumn(column, boardId, position);
  const { error } = await client.from("columns").upsert(row, { onConflict: "id" });
  if (error) console.error("[Sync] upsert column:", error);
}

export async function syncDeleteColumn(client: SupabaseClient, columnId: string) {
  const { error } = await client.from("columns").delete().eq("id", columnId);
  if (error) console.error("[Sync] delete column:", error);
}

export async function syncAllColumns(
  client: SupabaseClient,
  columns: Column[],
  boardId: string,
) {
  const rows = columns.map((col, i) => columnToDbColumn(col, boardId, i));
  const { error } = await client.from("columns").upsert(rows, { onConflict: "id" });
  if (error) console.error("[Sync] upsert columns:", error);
}

// ── Card operations ────────────────────────────────────────────────────

export async function syncCard(
  client: SupabaseClient,
  task: Task,
  columnId: string,
  position: number,
) {
  const row = taskToDbCard(task, columnId, position);
  const { error } = await client.from("cards").upsert(row, { onConflict: "id" });
  if (error) console.error("[Sync] upsert card:", error);
}

export async function syncDeleteCard(client: SupabaseClient, cardId: string) {
  const { error } = await client.from("cards").delete().eq("id", cardId);
  if (error) console.error("[Sync] delete card:", error);
}

export async function syncAllCards(
  client: SupabaseClient,
  tasks: Task[],
  columnId: string,
) {
  const rows = tasks.map((t, i) => taskToDbCard(t, columnId, i));
  if (rows.length === 0) return;
  const { error } = await client.from("cards").upsert(rows, { onConflict: "id" });
  if (error) console.error("[Sync] upsert cards:", error);
}

// ── Full workspace sync with batch operations & reconciliation ──────────

export async function uploadWorkspace(
  client: SupabaseClient,
  workspace: Workspace,
  userId: string,
) {
  // Collect active IDs from current state
  const activeBoardIds = new Set(workspace.boards.map((b) => b.id));
  const activeColumnIds = new Set(workspace.boards.flatMap((b) => b.columns.map((c) => c.id)));
  const activeCardIds = new Set(workspace.boards.flatMap((b) => b.columns.flatMap((c) => c.tasks.map((t) => t.id))));

  // Fetch existing IDs from DB to detect deletions
  const { data: existingBoards } = await client.from("boards").select("id").eq("user_id", userId);
  const existingBoardIds = (existingBoards ?? []).map((b) => b.id);

  let existingColIds: string[] = [];
  if (existingBoardIds.length > 0) {
    const { data: cols } = await client.from("columns").select("id").in("board_id", existingBoardIds);
    existingColIds = (cols ?? []).map((c) => c.id);
  }

  let existingCardIds: string[] = [];
  if (existingColIds.length > 0) {
    const { data: cards } = await client.from("cards").select("id").in("column_id", existingColIds);
    existingCardIds = (cards ?? []).map((c) => c.id);
  }

  // 1. Delete removed cards
  const cardsToDelete = existingCardIds.filter((id) => !activeCardIds.has(id));
  if (cardsToDelete.length > 0) {
    await client.from("cards").delete().in("id", cardsToDelete);
  }

  // 2. Delete removed columns
  const colsToDelete = existingColIds.filter((id) => !activeColumnIds.has(id));
  if (colsToDelete.length > 0) {
    await client.from("columns").delete().in("id", colsToDelete);
  }

  // 3. Delete removed boards
  const boardsToDelete = existingBoardIds.filter((id) => !activeBoardIds.has(id));
  if (boardsToDelete.length > 0) {
    await client.from("boards").delete().in("id", boardsToDelete);
  }

  // 4. Batch upsert active boards
  const boardRows = workspace.boards.map((b, bi) => boardToDbBoard(b, userId, bi, workspace.labels));
  if (boardRows.length > 0) {
    const { error } = await client.from("boards").upsert(boardRows, { onConflict: "id" });
    if (error) console.error("[Sync] batch upsert boards error:", error);
  }

  // 5. Batch upsert active columns
  const colRows = workspace.boards.flatMap((b) =>
    b.columns.map((c, ci) => columnToDbColumn(c, b.id, ci))
  );
  if (colRows.length > 0) {
    const { error } = await client.from("columns").upsert(colRows, { onConflict: "id" });
    if (error) console.error("[Sync] batch upsert columns error:", error);
  }

  // 6. Batch upsert active cards
  const cardRows = workspace.boards.flatMap((b) =>
    b.columns.flatMap((c) =>
      c.tasks.map((t, ti) => taskToDbCard(t, c.id, ti))
    )
  );
  if (cardRows.length > 0) {
    const { error } = await client.from("cards").upsert(cardRows, { onConflict: "id" });
    if (error) console.error("[Sync] batch upsert cards error:", error);
  }
}

// ── Sync a single board update (columns + cards) ───────────────────────

export async function syncBoardUpdate(
  client: SupabaseClient,
  board: Board,
  userId: string,
  position: number,
  labels: Label[],
) {
  await syncBoard(client, board, userId, position, labels);
  await syncAllColumns(client, board.columns, board.id);
  for (const column of board.columns) {
    await syncAllCards(client, column.tasks, column.id);
  }
}
