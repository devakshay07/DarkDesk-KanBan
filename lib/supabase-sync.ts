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

// ── Full workspace sync (upload local state to Supabase) ───────────────

export async function uploadWorkspace(
  client: SupabaseClient,
  workspace: Workspace,
  userId: string,
) {
  for (let bi = 0; bi < workspace.boards.length; bi++) {
    const board = workspace.boards[bi];
    await syncBoard(client, board, userId, bi, workspace.labels);
    for (let ci = 0; ci < board.columns.length; ci++) {
      const column = board.columns[ci];
      await syncColumn(client, column, board.id, ci);
      for (let ti = 0; ti < column.tasks.length; ti++) {
        await syncCard(client, column.tasks[ti], column.id, ti);
      }
    }
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
