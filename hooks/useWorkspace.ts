"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadWorkspace, saveWorkspace } from "../lib/storage";
import { supabase } from "../lib/supabase";
import { fetchWorkspace, uploadWorkspace } from "../lib/supabase-sync";
import { normalizeWorkspaceUUIDs } from "../lib/kanban";
import type { Board, Workspace } from "../types/kanban";

export type SyncStatus = "synced" | "syncing" | "offline" | "error";

/** Local-first workspace state with optional Supabase cloud synchronization & realtime multi-device sync. */
export function useWorkspace(userId?: string) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [history, setHistory] = useState<Workspace[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(supabase ? "synced" : "offline");

  // Guard: skip Realtime/poll pulls while this device is uploading
  const isSyncingRef = useRef(false);
  // Debounce timer for cloud sync
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Helper to pull fresh remote data (skipped when this device is uploading)
  const pullRemoteWorkspace = useCallback(async (client: NonNullable<typeof supabase>, uid: string) => {
    if (isSyncingRef.current) return false; // Skip self-echo
    try {
      const remote = await fetchWorkspace(client, uid);
      if (remote && remote.boards.length > 0) {
        const normalized = normalizeWorkspaceUUIDs(remote);
        setWorkspace(normalized);
        saveWorkspace(normalized);
        setSyncStatus("synced");
        return true;
      }
    } catch (err) {
      console.error("[Workspace] Pull remote failed:", err);
      setSyncStatus("error");
    }
    return false;
  }, []);

  // Fetch or migrate remote workspace when userId is present
  useEffect(() => {
    const client = supabase;
    if (!client || !userId) {
      // Offline / Local mode
      setWorkspace(normalizeWorkspaceUUIDs(loadWorkspace()));
      setSyncStatus("offline");
      return;
    }

    let isMounted = true;
    setSyncStatus("syncing");

    // 1. Fetch remote workspace from Supabase
    fetchWorkspace(client, userId).then(async (remote) => {
      if (!isMounted) return;

      if (remote && remote.boards.length > 0) {
        const normalized = normalizeWorkspaceUUIDs(remote);
        setWorkspace(normalized);
        saveWorkspace(normalized);
        setSyncStatus("synced");
      } else {
        const local = normalizeWorkspaceUUIDs(loadWorkspace());
        if (local && local.boards.length > 0) {
          try {
            isSyncingRef.current = true;
            await uploadWorkspace(client, local, userId);
            if (isMounted) {
              setWorkspace(local);
              saveWorkspace(local);
              setSyncStatus("synced");
            }
          } catch (err) {
            console.error("[Workspace] Migration failed:", err);
            if (isMounted) setSyncStatus("error");
          } finally {
            // Allow pulls again after a cooldown so Realtime self-echoes settle
            setTimeout(() => { isSyncingRef.current = false; }, 2000);
          }
        }
      }
    }).catch((err) => {
      console.error("[Workspace] Fetch remote failed:", err);
      if (isMounted) setSyncStatus("error");
    });

    // 2. Realtime Multi-Device Sync Subscription
    const channel = client
      .channel(`user-sync-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "boards" }, () => {
        pullRemoteWorkspace(client, userId);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "columns" }, () => {
        pullRemoteWorkspace(client, userId);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "cards" }, () => {
        pullRemoteWorkspace(client, userId);
      })
      .subscribe();

    // 3. Background Polling (every 30s when tab is visible) as fallback
    let timerId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (isMounted && typeof document !== "undefined" && !document.hidden) {
        await pullRemoteWorkspace(client, userId);
      }
      if (isMounted) {
        timerId = setTimeout(poll, 30000);
      }
    };

    timerId = setTimeout(poll, 30000);

    // 4. Instant sync on tab focus (user returns to the app)
    const handleFocusOrVisibility = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        pullRemoteWorkspace(client, userId);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleFocusOrVisibility);
      document.addEventListener("visibilitychange", handleFocusOrVisibility);
    }

    return () => {
      isMounted = false;
      client.removeChannel(channel);
      clearTimeout(timerId);
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleFocusOrVisibility);
        document.removeEventListener("visibilitychange", handleFocusOrVisibility);
      }
    };
  }, [userId, pullRemoteWorkspace]);

  // Persist to local storage whenever workspace changes
  useEffect(() => {
    if (workspace) saveWorkspace(workspace);
  }, [workspace]);

  const activeBoard = useMemo(
    () => workspace?.boards.find((board) => board.id === workspace.activeBoardId) || workspace?.boards[0],
    [workspace],
  );

  // Debounced cloud sync: waits 500ms after the last call before uploading
  const syncToCloud = useCallback((nextWorkspace: Workspace) => {
    const client = supabase;
    if (!client || !userId) return;

    // Clear any pending debounce
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

    setSyncStatus("syncing");
    syncTimerRef.current = setTimeout(async () => {
      isSyncingRef.current = true;
      try {
        await uploadWorkspace(client, nextWorkspace, userId);
        setSyncStatus("synced");
      } catch (err) {
        console.error("[Workspace] Cloud sync failed:", err);
        setSyncStatus("error");
      } finally {
        // Allow pulls again after Realtime self-echoes settle
        setTimeout(() => { isSyncingRef.current = false; }, 2000);
      }
    }, 500);
  }, [userId]);

  function commit(rawNext: Workspace) {
    const next = normalizeWorkspaceUUIDs(rawNext);
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
