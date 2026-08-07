export type Priority = "urgent" | "high" | "medium" | "low";
export type Label = { id: string; name: string; color: string };
export type Task = { id: string; title: string; description: string; priority: Priority; labels: string[]; dueDate?: string; completed: boolean; createdAt: string };
export type Column = { id: string; title: string; color: string; tasks: Task[] };
export type Board = { id: string; title: string; emoji: string; columns: Column[] };
export type Workspace = { boards: Board[]; labels: Label[]; activeBoardId: string };
