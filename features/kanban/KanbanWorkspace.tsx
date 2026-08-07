"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CirclePlus, LogOut, Settings2, Cloud, CloudOff, RefreshCw, AlertCircle } from "lucide-react";
import { BoardToolbar } from "./components/BoardToolbar";
import { KanbanColumn } from "./components/KanbanColumn";
import { TaskModal } from "./components/TaskModal";
import { BoardSelector } from "./components/BoardSelector";
import { SettingsModal } from "./components/SettingsModal";
import { createBoard, createColumn, createTask, deleteBoard, deleteColumn, deleteTask, filterColumn, isWorkspace, moveTask, renameColumn } from "../../lib/kanban";
import { initialWorkspace } from "../../lib/seed";
import { supabase } from "../../lib/supabase";
import { useWorkspace, type SyncStatus } from "../../hooks/useWorkspace";
import { useAuth } from "../../components/AuthProvider";
import type { Board, Priority, Task, Workspace } from "../../types/kanban";
import { Logo } from "../../components/Logo";

type TaskEditor = { columnId: string; task: Task } | null;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Good night";
}

function SyncBadge({ status }: { status: SyncStatus }) {
  if (status === "syncing") {
    return <span className="sync-badge syncing" title="Syncing with cloud"><RefreshCw className="spin-icon" /> Syncing</span>;
  }
  if (status === "synced") {
    return <span className="sync-badge synced" title="Synced with cloud"><Cloud /> Synced</span>;
  }
  if (status === "error") {
    return <span className="sync-badge error" title="Sync error"><AlertCircle /> Sync Error</span>;
  }
  return <span className="sync-badge offline" title="Running in local mode"><CloudOff /> Local</span>;
}

/** Orchestrates independent Kanban components and persistence operations. */
export function KanbanWorkspace() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const { workspace, activeBoard, commit, updateBoard, undo, canUndo, syncStatus } = useWorkspace(user?.id);
  
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [editor, setEditor] = useState<TaskEditor>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [greeting, setGreeting] = useState("Good day");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  // Auth guard: if Supabase is enabled and user is not logged in, send to /login
  useEffect(() => {
    if (supabase && !authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || (supabase && !user)) {
    return <main className="loading"><div className="orb" /> Checking authorization…</main>;
  }

  if (!workspace || !activeBoard) {
    return <main className="loading"><div className="orb" /> Loading your desk…</main>;
  }

  const currentWorkspace = workspace;
  const currentBoard = activeBoard;
  const allTasks = currentBoard.columns.flatMap((column) => column.tasks);
  const completedCount = allTasks.filter((task) => task.completed).length;

  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || (currentWorkspace as Workspace & { userName?: string }).userName || "Akshay";

  function replaceBoard(board: Board) { updateBoard(board); }
  function openNewTask(columnId: string) { setEditor({ columnId, task: createTask() }); }

  function saveTask(task: Task, columnId: string) {
    const alreadyExists = currentBoard.columns.some((column) => column.tasks.some((item) => item.id === task.id));
    replaceBoard({ ...currentBoard, columns: currentBoard.columns.map((column) => column.id !== columnId ? column : {
      ...column, tasks: alreadyExists ? column.tasks.map((item) => item.id === task.id ? task : item) : [...column.tasks, task],
    }) });
    setEditor(null);
  }

  function handleDeleteTask(taskId: string) {
    replaceBoard(deleteTask(currentBoard, taskId));
    setEditor(null);
  }

  function handleRenameColumn(columnId: string, title: string) {
    replaceBoard(renameColumn(currentBoard, columnId, title));
  }

  function handleDeleteColumn(columnId: string) {
    replaceBoard(deleteColumn(currentBoard, columnId));
  }

  function handleRenameBoard(boardId: string, title: string) {
    commit({
      ...currentWorkspace,
      boards: currentWorkspace.boards.map((b) => b.id === boardId ? { ...b, title } : b),
    });
  }

  function handleDeleteBoard(boardId: string) {
    commit(deleteBoard(currentWorkspace, boardId));
  }

  function moveTaskByDirection(taskId: string, currentColumnId: string, direction: "backward" | "forward") {
    const currentIndex = currentBoard.columns.findIndex((column) => column.id === currentColumnId);
    const destination = currentBoard.columns[currentIndex + (direction === "forward" ? 1 : -1)];
    if (destination) replaceBoard(moveTask(currentBoard, taskId, destination.id));
  }

  function createNewBoard() {
    const title = window.prompt("Board name");
    if (!title?.trim()) return;
    const board = createBoard(title.trim());
    commit({ ...currentWorkspace, boards: [...currentWorkspace.boards, board], activeBoardId: board.id });
  }

  function createNewColumn() {
    const title = window.prompt("Column name");
    if (title?.trim()) replaceBoard({ ...currentBoard, columns: [...currentBoard.columns, createColumn(title.trim())] });
  }

  function exportWorkspace() {
    const blob = new Blob([JSON.stringify(currentWorkspace, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const download = document.createElement("a");
    download.href = url; download.download = "darkdesk-backup.json"; download.click();
    URL.revokeObjectURL(url);
  }

  function importWorkspace(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result)) as unknown;
        if (!isWorkspace(imported)) throw new Error("Invalid backup");
        commit(imported);
      } catch { window.alert("That file is not a valid DarkDesk backup."); }
    };
    reader.readAsText(file);
  }

  return <main className="app-shell">
    <section className="workspace">
      <header>
        <div className="header-left">
          <Logo />
          <BoardSelector
            workspace={currentWorkspace}
            activeBoardId={currentBoard.id}
            onSelectBoard={(id) => commit({ ...currentWorkspace, activeBoardId: id })}
            onCreateBoard={createNewBoard}
          />
        </div>
        <div className="header-actions">
          <SyncBadge status={syncStatus} />
          <button aria-label="Workspace Settings" title="Workspace Settings" onClick={() => setShowSettings(true)}>
            <Settings2 />
          </button>
          {user && (
            <button aria-label="Sign out" title={`Sign out (${user.email})`} onClick={() => signOut()} className="signout-btn">
              <LogOut />
            </button>
          )}
        </div>
      </header>
      <div className="content"><div className="title-row"><div><h1>{greeting}, {displayName}</h1></div>
        <div aria-label={`${completedCount} of ${allTasks.length} tasks complete`} className="progress-card"><span>{completedCount}/{allTasks.length} tasks complete</span><div><i style={{ width: allTasks.length ? `${completedCount / allTasks.length * 100}%` : "0%" }} /></div></div></div>
        <BoardToolbar canUndo={canUndo} onAddTask={() => currentBoard.columns[0] && openNewTask(currentBoard.columns[0].id)} onExport={exportWorkspace} onImport={importWorkspace}
          onPriorityChange={setPriority} onQueryChange={setQuery} onToggleFilters={() => setShowFilters((visible) => !visible)} onUndo={undo} priority={priority} query={query} showFilters={showFilters} />
        <div aria-label={`${currentBoard.title} board`} className="board">{currentBoard.columns.map((column, index) => <KanbanColumn key={column.id} column={filterColumn(column, query, priority)} labels={currentWorkspace.labels}
          canMoveBackward={index > 0} canMoveForward={index < currentBoard.columns.length - 1} onAdd={() => openNewTask(column.id)} onEdit={(task) => setEditor({ columnId: column.id, task })}
          onDrop={(taskId, destinationId) => replaceBoard(moveTask(currentBoard, taskId, destinationId))} onMove={(taskId, direction) => moveTaskByDirection(taskId, column.id, direction)} onToggle={(task) => saveTask({ ...task, completed: !task.completed }, column.id)} onDelete={handleDeleteTask} onRenameColumn={handleRenameColumn} onDeleteColumn={handleDeleteColumn} />)}
          <button className="add-column" onClick={createNewColumn}><CirclePlus /> Add column</button></div>
      </div>
    </section>
    {editor && <TaskModal labels={currentWorkspace.labels} task={editor.task} onClose={() => setEditor(null)} onSave={(task) => saveTask(task, editor.columnId)} onDelete={currentBoard.columns.some((col) => col.tasks.some((t) => t.id === editor.task.id)) ? handleDeleteTask : undefined} />}
    {showSettings && (
      <SettingsModal
        workspace={currentWorkspace}
        activeBoard={currentBoard}
        onClose={() => setShowSettings(false)}
        onExport={exportWorkspace}
        onImport={importWorkspace}
        onRenameBoard={handleRenameBoard}
        onDeleteBoard={handleDeleteBoard}
        onResetWorkspace={() => commit(initialWorkspace)}
      />
    )}
  </main>;
}
