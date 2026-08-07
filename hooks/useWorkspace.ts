"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadWorkspace, saveWorkspace } from "../lib/storage";
import { supabase } from "../lib/supabase";
import { fetchWorkspace, syncBoardUpdate, uploadWorkspace } from "../lib/supabase-sync";
import type { Board, Workspace } from "../types/kanban";

export type SyncStatus = "synced" | "syncing" | "offline" | "error";

/** Local-first workspace state with optional Supabase cloud synchronization. */
export function useWorkspace(userId?: string) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [history, setHistory] = useState<Workspace[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(supabase ? "synced" : "offline");

  // Load initial local workspace
  useEffect(() => {
    const local = loadWorkspace();
    setWorkspace(local);
  }, []);

  // Fetch or migrate remote workspace when userId is present
  useEffect(() => {
    const client = supabase;
    if (!client || !userId) return;

    let isMounted = true;
    setSyncStatus("syncing");

    fetchWorkspace(client, userId).then(async (remote) => {
      if (!isMounted) return;
      if (remote && remote.boards.length > 0) {
        setWorkspace(remote);
        saveWorkspace(remote);
        setSyncStatus("synced");
      } else {
        // Migration: upload local workspace to Supabase for the new user
        const local = loadWorkspace();
        if (local && local.boards.length > 0) {
          try {
            await uploadWorkspace(client, local, userId);
            if (isMounted) setSyncStatus("synced");
          } catch (err) {
            console.error("[Workspace] Migration failed:", err);
            if (isMounted) setSyncStatus("error");
          }
        } else {
          if (isMounted) setSyncStatus("synced");
        }
      }
    }).catch((err) => {
      console.error("[Workspace] Fetch remote failed:", err);
      if (isMounted) setSyncStatus("error");
    });

    return () => { isMounted = false; };
  }, [userId]);

  // Persist to local storage whenever workspace changes
  useEffect(() => {
    if (workspace) saveWorkspace(workspace);
  }, [workspace]);

  const activeBoard = useMemo(
    () => workspace?.boards.find((board) => board.id === workspace.activeBoardId) || workspace?.boards[0],
    [workspace],
  );

  const syncToCloud = useCallback(async (nextWorkspace: Workspace) => {
    const client = supabase;
    if (!client || !userId) return;
    setSyncStatus("syncing");
    try {
      await uploadWorkspace(client, nextWorkspace, userId);
      setSyncStatus("synced");
    } catch (err) {
      console.error("[Workspace] Cloud sync failed:", err);
      setSyncStatus("error");
    }
  }, [userId]);

  function commit(next: Workspace) {
    if (workspace) setHistory((items) => [...items.slice(-19), workspace]);
    setWorkspace(next);
    if (userId) syncToCloud(next);
  }

  function updateBoard(updatedBoard: Board) {
    if (!workspace) return;
    const next: Workspace = {
      ...workspace,
      boards: workspace.boards.map((board) => board.id === updatedBoard.id ? updatedBoard : board),
    };
    commit(next);
  }

  function undo() {
    if (!workspace || history.length === 0) return;
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((items) => items.slice(0, -1));
    setWorkspace(previous);
    if (userId) syncToCloud(previous);
  }

  return {
    workspace,
    setWorkspace,
    activeBoard,
    commit,
    updateBoard,
    undo,
    canUndo: history.length > 0,
    syncStatus,
  };
}
