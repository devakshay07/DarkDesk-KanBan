"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import type { Workspace } from "../../../types/kanban";

type BoardSelectorProps = {
  workspace: Workspace;
  activeBoardId: string;
  onSelectBoard: (id: string) => void;
  onCreateBoard: () => void;
};

export function BoardSelector({ workspace, activeBoardId, onSelectBoard, onCreateBoard }: BoardSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeBoard = workspace.boards.find((b) => b.id === activeBoardId) || workspace.boards[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="board-selector-container" ref={containerRef}>
      <button
        type="button"
        className="board-selector-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="Select board"
      >
        <span className="board-emoji">{activeBoard.emoji}</span>
        <span className="board-title-text">{activeBoard.title}</span>
        <ChevronDown className={`chevron ${open ? "open" : ""}`} />
      </button>

      {open && (
        <div className="board-dropdown" role="menu">
          <div className="dropdown-header">Your Boards</div>
          <div className="dropdown-list">
            {workspace.boards.map((board) => (
              <button
                key={board.id}
                type="button"
                className={`dropdown-item ${board.id === activeBoardId ? "active" : ""}`}
                onClick={() => {
                  onSelectBoard(board.id);
                  setOpen(false);
                }}
              >
                <span className="emoji">{board.emoji}</span>
                <span className="title">{board.title}</span>
                {board.id === activeBoardId && <Check className="check-icon" />}
              </button>
            ))}
          </div>
          <div className="dropdown-divider" />
          <button
            type="button"
            className="dropdown-item new-board-btn"
            onClick={() => {
              setOpen(false);
              onCreateBoard();
            }}
          >
            <Plus className="icon" /> New board
          </button>
        </div>
      )}
    </div>
  );
}
