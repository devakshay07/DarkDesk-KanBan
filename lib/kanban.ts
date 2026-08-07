import type { Board, Column, Priority, Task, Workspace } from "../types/kanban";

export const priorityLabels: Record<Priority, string> = {
  urgent: "Urgent", high: "High", medium: "Medium", low: "Low",
};

/** Creates browser-safe identifiers for data that has not reached the server yet. */
export const createId = () => crypto.randomUUID();

/** Keeps filtering independent from the rendering components. */
export function filterColumn(column: Column, query: string, priority: Priority | "all") {
  const normalizedQuery = query.trim().toLowerCase();
  return {
    ...column,
    tasks: column.tasks.filter((task) => {
      const matchesPriority = priority === "all" || task.priority === priority;
      const searchableText = `${task.title} ${task.description}`.toLowerCase();
      return matchesPriority && searchableText.includes(normalizedQuery);
    }),
  };
}

/** Moves a card without mutating the current board state. */
export function moveTask(board: Board, taskId: string, destinationId: string): Board {
  let movedTask: Task | undefined;
  const withoutTask = board.columns.map((column) => ({
    ...column,
    tasks: column.tasks.filter((task) => {
      if (task.id === taskId) movedTask = task;
      return task.id !== taskId;
    }),
  }));

  if (!movedTask) return board;
  return {
    ...board,
    columns: withoutTask.map((column) => column.id === destinationId
      ? { ...column, tasks: [...column.tasks, movedTask!] }
      : column),
  };
}

/** Removes a task from any column in the given board. */
export function deleteTask(board: Board, taskId: string): Board {
  return {
    ...board,
    columns: board.columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter((task) => task.id !== taskId),
    })),
  };
}

export function createBoard(title: string): Board {
  return {
    id: createId(), title, emoji: "✦",
    columns: [{ id: createId(), title: "Inbox", color: "#94a3b8", tasks: [] }],
  };
}

export function createColumn(title: string): Column {
  return { id: createId(), title, color: "#94a3b8", tasks: [] };
}

/** Renames a column on a board. */
export function renameColumn(board: Board, columnId: string, title: string): Board {
  return {
    ...board,
    columns: board.columns.map((col) => col.id === columnId ? { ...col, title } : col),
  };
}

/** Deletes a column from a board. */
export function deleteColumn(board: Board, columnId: string): Board {
  return {
    ...board,
    columns: board.columns.filter((col) => col.id !== columnId),
  };
}

/** Deletes a board from the workspace. */
export function deleteBoard(workspace: Workspace, boardId: string): Workspace {
  const remaining = workspace.boards.filter((b) => b.id !== boardId);
  if (remaining.length === 0) return workspace;
  return {
    ...workspace,
    boards: remaining,
    activeBoardId: workspace.activeBoardId === boardId ? remaining[0].id : workspace.activeBoardId,
  };
}

export function createTask(): Task {
  return {
    id: createId(), title: "Untitled task", description: "", priority: "medium",
    labels: [], completed: false, createdAt: new Date().toISOString(),
  };
}

/** A structural guard prevents malformed imports from replacing the local workspace. */
export function isWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Workspace>;
  return Array.isArray(candidate.boards) && Array.isArray(candidate.labels)
    && typeof candidate.activeBoardId === "string";
}
