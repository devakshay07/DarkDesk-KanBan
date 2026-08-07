import { Download, Plus, Search, SlidersHorizontal, Upload } from "lucide-react";
import { priorityLabels } from "../../../lib/kanban";
import type { Priority } from "../../../types/kanban";

type BoardToolbarProps = {
  query: string; priority: Priority | "all"; showFilters: boolean; canUndo: boolean;
  onQueryChange: (query: string) => void; onPriorityChange: (priority: Priority | "all") => void;
  onAddTask: () => void; onToggleFilters: () => void; onUndo: () => void; onExport: () => void; onImport: (file?: File) => void;
};

/** Compact action area that wraps rather than relying on a fixed desktop width. */
export function BoardToolbar({ query, priority, showFilters, canUndo, onQueryChange, onPriorityChange, onAddTask, onToggleFilters, onUndo, onExport, onImport }: BoardToolbarProps) {
  return <><div className="toolbar"><label className="search"><Search /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search tasks..." aria-label="Search tasks" /></label>
    <div className="tool-actions"><button aria-expanded={showFilters} className={showFilters ? "pressed" : ""} onClick={onToggleFilters}><SlidersHorizontal /> Filter</button><button className="add-task" onClick={onAddTask}><Plus /> Add task</button></div></div>
    {showFilters && <div aria-label="Task filters" className="filters"><span>Priority</span>{(["all", "urgent", "high", "medium", "low"] as const).map((item) => <button key={item} aria-pressed={priority === item} className={priority === item ? "selected" : ""} onClick={() => onPriorityChange(item)}>{item === "all" ? "All tasks" : priorityLabels[item]}</button>)}
      <span className="filter-spacer" /><button disabled={!canUndo} onClick={onUndo}>Undo</button><button onClick={onExport}><Download /> Export</button><label className="import"><Upload /> Import<input type="file" accept="application/json" onChange={(event) => onImport(event.target.files?.[0])} /></label></div>}
  </>;
}
