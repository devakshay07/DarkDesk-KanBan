"use client";

import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { priorityLabels } from "../../../lib/kanban";
import type { Priority, Task, Workspace } from "../../../types/kanban";

type TaskModalProps = {
  task: Task;
  labels: Workspace["labels"];
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
};

/** Accessible dialog used for both creating and editing a task. */
export function TaskModal({ task, labels, onClose, onSave, onDelete }: TaskModalProps) {
  const [draft, setDraft] = useState(task);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <form aria-labelledby="task-dialog-title" aria-modal="true" className="task-modal" role="dialog"
      onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
      <div className="modal-title"><h2 id="task-dialog-title">{task.title === "Untitled task" ? "New task" : "Edit task"}</h2>
        <button aria-label="Close task editor" type="button" onClick={onClose}><X /></button></div>
      <label>Title<input autoFocus value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required /></label>
      <label>Description<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="What needs to happen?" /></label>
      <div className="form-grid"><label>Priority<select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as Priority })}>
        {Object.entries(priorityLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label>Due date<input type="date" value={draft.dueDate ?? ""} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value || undefined })} /></label></div>
      <fieldset><legend>Labels</legend>{labels.map((label) => <button type="button" key={label.id}
        aria-pressed={draft.labels.includes(label.id)} className={draft.labels.includes(label.id) ? "label-choice active" : "label-choice"}
        style={{ borderColor: label.color }} onClick={() => setDraft({ ...draft, labels: draft.labels.includes(label.id) ? draft.labels.filter((id) => id !== label.id) : [...draft.labels, label.id] })}>{label.name}</button>)}</fieldset>
      <div className="modal-actions">
        {onDelete && <button type="button" className="delete-btn" onClick={() => onDelete(task.id)}><Trash2 /> Delete</button>}
        <div className="spacer" />
        <button type="button" onClick={onClose}>Cancel</button>
        <button className="save" type="submit">Save task</button>
      </div>
    </form>
  </div>;
}
