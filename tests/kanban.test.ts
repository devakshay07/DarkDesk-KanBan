import { describe, expect, it } from "vitest";
import { initialWorkspace } from "../lib/seed";
import { deleteColumn, deleteTask, renameColumn } from "../lib/kanban";

describe("kanban operations", () => {
  it("deletes a task from the board correctly", () => {
    const board = initialWorkspace.boards[0];
    const initialTaskCount = board.columns.flatMap((col) => col.tasks).length;
    const targetTaskId = board.columns[0].tasks[0].id;

    const updatedBoard = deleteTask(board, targetTaskId);
    const updatedTaskCount = updatedBoard.columns.flatMap((col) => col.tasks).length;

    expect(updatedTaskCount).toBe(initialTaskCount - 1);
    expect(updatedBoard.columns[0].tasks.some((t) => t.id === targetTaskId)).toBe(false);
  });

  it("renames a column correctly", () => {
    const board = initialWorkspace.boards[0];
    const targetColId = board.columns[0].id;
    const updatedBoard = renameColumn(board, targetColId, "Backlog");

    expect(updatedBoard.columns[0].title).toBe("Backlog");
  });

  it("deletes a column correctly", () => {
    const board = initialWorkspace.boards[0];
    const initialColCount = board.columns.length;
    const targetColId = board.columns[0].id;

    const updatedBoard = deleteColumn(board, targetColId);

    expect(updatedBoard.columns.length).toBe(initialColCount - 1);
    expect(updatedBoard.columns.some((c) => c.id === targetColId)).toBe(false);
  });
});
