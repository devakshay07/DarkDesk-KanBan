import type { Board, Column, Label, Task, Workspace } from "../types/kanban";

// ── Database row types (match schema.sql exactly) ──────────────────────

export type DbBoard = {
  id: string;
  user_id: string;
  title: string;
  emoji: string;
  labels: Label[];
  position: number;
  created_at: string;
  updated_at: string;
};

export type DbColumn = {
  id: string;
  board_id: string;
  title: string;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
};

export type DbCard = {
  id: string;
  column_id: string;
  title: string;
  description: string;
  priority: string;
  labels: string[];
  due_date: string | null;
  completed: boolean;
  position: number;
  version: number;
  created_at: string;
  updated_at: string;
};

// ── Transform: DB → Frontend ───────────────────────────────────────────

export function dbCardToTask(row: DbCard): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority as Task["priority"],
    labels: row.labels ?? [],
    dueDate: row.due_date ?? undefined,
    completed: row.completed,
    createdAt: row.created_at,
  };
}

export function dbColumnsToColumn(row: DbColumn, cards: DbCard[]): Column {
  return {
    id: row.id,
    title: row.title,
    color: row.color,
    tasks: cards
      .filter((c) => c.column_id === row.id)
      .sort((a, b) => a.position - b.position)
      .map(dbCardToTask),
  };
}

export function dbToWorkspace(
  boards: DbBoard[],
  columns: DbColumn[],
  cards: DbCard[],
  activeBoardId?: string,
): Workspace {
  const sortedBoards = [...boards].sort((a, b) => a.position - b.position);
  const assembledBoards: Board[] = sortedBoards.map((b) => {
    const boardColumns = columns
      .filter((c) => c.board_id === b.id)
      .sort((a, c) => a.position - c.position);
    return {
      id: b.id,
      title: b.title,
      emoji: b.emoji,
      columns: boardColumns.map((col) => dbColumnsToColumn(col, cards)),
    };
  });

  // Merge all labels from all boards (dedup by id)
  const labelMap = new Map<string, Label>();
  for (const b of boards) {
    for (const label of (b.labels ?? []) as Label[]) {
      labelMap.set(label.id, label);
    }
  }

  return {
    activeBoardId: activeBoardId ?? assembledBoards[0]?.id ?? "",
    labels: Array.from(labelMap.values()),
    boards: assembledBoards,
  };
}

// ── Transform: Frontend → DB ───────────────────────────────────────────

export function boardToDbBoard(board: Board, userId: string, position: number, labels: Label[]): Omit<DbBoard, "created_at" | "updated_at"> {
  return {
    id: board.id,
    user_id: userId,
    title: board.title,
    emoji: board.emoji,
    labels,
    position,
  };
}

export function columnToDbColumn(column: Column, boardId: string, position: number): Omit<DbColumn, "created_at" | "updated_at"> {
  return {
    id: column.id,
    board_id: boardId,
    title: column.title,
    color: column.color,
    position,
  };
}

export function taskToDbCard(task: Task, columnId: string, position: number): Omit<DbCard, "created_at" | "updated_at" | "version"> {
  return {
    id: task.id,
    column_id: columnId,
    title: task.title,
    description: task.description,
    priority: task.priority,
    labels: task.labels,
    due_date: task.dueDate ?? null,
    completed: task.completed,
    position,
  };
}
