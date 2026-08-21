"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clearWorkspaceCache, loadWorkspace, saveWorkspace } from "../lib/storage";
import { supabase } from "../lib/supabase";
import { fetchWorkspace, uploadWorkspace } from "../lib/supabase-sync";
import { normalizeWorkspaceUUIDs } from "../lib/kanban";
import { initialWorkspace } from "../lib/seed";
import type { Board, Workspace } from "../types/kanban";

export type SyncStatus = "synced" | "syncing" | "offline" | "error";

/** Database-first workspace state with auto cache clearing and real-time multi-device sync. */
export function useWorkspace(userId?: string) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [history, setHistory] = useState<Workspace[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(supabase ? "synced" : "offline");

  // Guard: skip Realtime/poll pulls while this device is uploading
  const isSyncingRef = useRef(false);
  // Debounce timer for cloud sync
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Helper to pull fresh remote data from database only
  const pullRemoteWorkspace = useCallback(async (client: NonNullable<typeof supabase>, uid: string) => {
    if (isSyncingRef.current) return false; // Skip self-echo
    try {
      const remote = await fetchWorkspace(client, uid);
      if (remote && remote.boards.length > 0) {
        const normalized = normalizeWorkspaceUUIDs(remote);
        setWorkspace(normalized);
        setSyncStatus("synced");
        return true;
      }
    } catch (err) {
      console.error("[Workspace] Pull remote failed:", err);
      setSyncStatus("error");
    }
    return false;
  }, []);

  // Fetch from database & handle account switching
  useEffect(() => {
    const client = supabase;
    if (!client || !userId) {
      // Offline / Local mode
      setWorkspace(normalizeWorkspaceUUIDs(loadWorkspace()));
      setSyncStatus("offline");
      return;
    }

    let isMounted = true;
    
    // Auto clear cache on account switch / mount
    clearWorkspaceCache();
    setWorkspace(null);
    setHistory([]);
    setSyncStatus("syncing");

    // 1. Fetch remote workspace directly from Supabase database
    fetchWorkspace(client, userId).then(async (remote) => {
      if (!isMounted) return;

      if (remote && remote.boards.length > 0) {
        // Valid user data returned from database
        const normalized = normalizeWorkspaceUUIDs(remote);
        setWorkspace(normalized);
        setSyncStatus("synced");
      } else {
        // New user with no data in database yet - initialize default workspace in DB
        const defaultWorkspace = normalizeWorkspaceUUIDs(initialWorkspace);
        try {
          isSyncingRef.current = true;
          await uploadWorkspace(client, defaultWorkspace, userId);
          if (isMounted) {
            setWorkspace(defaultWorkspace);
            setSyncStatus("synced");
          }
        } catch (err) {
          console.error("[Workspace] Database initialization failed:", err);
          if (isMounted) setSyncStatus("error");
        } finally {
          setTimeout(() => { isSyncingRef.current = false; }, 1500);
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

    // 4. Instant sync on tab focus
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

  // Save to local storage ONLY in offline mode (when userId is absent)
  useEffect(() => {
    if (!userId && workspace) {
      saveWorkspace(workspace);
    }
  }, [workspace, userId]);

  const activeBoard = useMemo(
    () => workspace?.boards.find((board) => board.id === workspace.activeBoardId) || workspace?.boards[0],
    [workspace],
  );

  // Debounced cloud sync for interactive user actions (add/move/edit task)
  const syncToCloud = useCallback((nextWorkspace: Workspace) => {
    const client = supabase;
    if (!client || !userId) return;

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
        setTimeout(() => { isSyncingRef.current = false; }, 1500);
      }
    }, 500);
  }, [userId]);

  // Synchronous immediate cloud upload for file imports & task file uploads
  const uploadAndSyncWorkspace = useCallback(async (importedWorkspace: Workspace) => {
    const normalized = normalizeWorkspaceUUIDs(importedWorkspace);
    setWorkspace(normalized);
    
    const client = supabase;
    if (!client || !userId) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    setSyncStatus("syncing");
    isSyncingRef.current = true;

    try {
      await uploadWorkspace(client, normalized, userId);
      setSyncStatus("synced");
    } catch (err) {
      console.error("[Workspace] Direct file sync to database failed:", err);
      setSyncStatus("error");
    } finally {
      setTimeout(() => { isSyncingRef.current = false; }, 1500);
    }
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
    uploadAndSyncWorkspace,
  };
}
