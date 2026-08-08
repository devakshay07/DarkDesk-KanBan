"use client";

import { useEffect } from "react";
import { Download, RefreshCw, Trash2, Upload, User as UserIcon, X } from "lucide-react";
import type { Board, Workspace } from "../../../types/kanban";

type SettingsModalProps = {
  workspace: Workspace;
  activeBoard: Board;
  userName?: string;
  userEmail?: string;
  onClose: () => void;
  onExport: () => void;
  onImport: (file?: File) => void;
  onRenameBoard: (boardId: string, newTitle: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onResetWorkspace: () => void;
  onUpdateName?: (newName: string) => void;
};

export function SettingsModal({
  workspace,
  activeBoard,
  userName,
  userEmail,
  onClose,
  onExport,
  onImport,
  onRenameBoard,
  onDeleteBoard,
  onResetWorkspace,
  onUpdateName,
}: SettingsModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const totalTasks = activeBoard.columns.flatMap((c) => c.tasks).length;
  const completedTasks = activeBoard.columns.flatMap((c) => c.tasks).filter((t) => t.completed).length;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="task-modal settings-modal"
        role="dialog"
        aria-labelledby="settings-dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-title">
          <h2 id="settings-dialog-title">Workspace Settings</h2>
          <button type="button" aria-label="Close settings" onClick={onClose}>
            <X />
          </button>
        </div>

        {userEmail && (
          <section className="settings-section">
            <h3>Profile</h3>
            <div className="settings-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <UserIcon style={{ opacity: 0.7 }} />
                <div>
                  <strong>{userName || "No name set"}</strong>
                  <span style={{ display: "block", fontSize: "0.82rem", opacity: 0.7 }}>{userEmail}</span>
                </div>
              </div>
              {onUpdateName && (
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => {
                    const name = window.prompt("Update your name", userName || "");
                    if (name !== null && name.trim()) onUpdateName(name.trim());
                  }}
                >
                  Edit Name
                </button>
              )}
            </div>
          </section>
        )}

        <section className="settings-section">
          <h3>Current Board: {activeBoard.title}</h3>
          <div className="settings-row">
            <button
              type="button"
              className="action-btn"
              onClick={() => {
                const name = window.prompt("Rename board", activeBoard.title);
                if (name?.trim()) onRenameBoard(activeBoard.id, name.trim());
              }}
            >
              Rename Board
            </button>
            {workspace.boards.length > 1 && (
              <button
                type="button"
                className="action-btn danger"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete board "${activeBoard.title}"?`)) {
                    onDeleteBoard(activeBoard.id);
                    onClose();
                  }
                }}
              >
                <Trash2 /> Delete Board
              </button>
            )}
          </div>
        </section>

        <section className="settings-section">
          <h3>Board Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span>Columns</span>
              <strong>{activeBoard.columns.length}</strong>
            </div>
            <div className="stat-card">
              <span>Total Tasks</span>
              <strong>{totalTasks}</strong>
            </div>
            <div className="stat-card">
              <span>Completed</span>
              <strong>{completedTasks}</strong>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h3>Data & Sync</h3>
          <div className="settings-row">
            <button type="button" className="action-btn" onClick={onExport}>
              <Download /> Export Backup
            </button>
            <label className="import action-btn">
              <Upload /> Import Backup
              <input
                type="file"
                accept="application/json"
                onChange={(e) => {
                  onImport(e.target.files?.[0]);
                  onClose();
                }}
              />
            </label>
            <button
              type="button"
              className="action-btn danger"
              onClick={() => {
                if (window.confirm("Reset workspace to initial defaults? All custom tasks will be reset.")) {
                  onResetWorkspace();
                  onClose();
                }
              }}
            >
              <RefreshCw /> Reset Defaults
            </button>
          </div>
        </section>

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
