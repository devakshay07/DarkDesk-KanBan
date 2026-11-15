"use client";

import { ArrowLeft, ArrowRight, CalendarDays, Check, Pencil, Plus, Trash2 } from "lucide-react";
import type { Column, Task, Workspace } from "../../../types/kanban";

type KanbanColumnProps = {
  column: Column;
  labels: Workspace["labels"];
  canMoveBackward: boolean;
  canMoveForward: boolean;
  onAdd: () => void;
  onEdit: (task: Task) => void;
  onDrop: (taskId: string, destinationId: string) => void;
  onMove: (taskId: string, direction: "backward" | "forward") => void;
  onToggle: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onRenameColumn?: (columnId: string, title: string) => void;
  onDeleteColumn?: (columnId: string) => void;
};

/** A column exposes both native drag-and-drop and button alternatives for touch and keyboard users. */
export function KanbanColumn({ column, labels, canMoveBackward, canMoveForward, onAdd, onEdit, onDrop, onMove, onToggle, onDelete, onRenameColumn, onDeleteColumn }: KanbanColumnProps) {
  function handleRename() {
    if (!onRenameColumn) return;
    const name = window.prompt("Rename column", column.title);
    if (name?.trim()) onRenameColumn(column.id, name.trim());
  }

  function handleDelete() {
    if (!onDeleteColumn) return;
    if (window.confirm(`Delete column "${column.title}" and all its tasks?`)) {
      onDeleteColumn(column.id);
    }
  }

  return <section id={`column-${column.id}`} aria-labelledby={`column-title-${column.id}`} className="column" onDragOver={(event) => event.preventDefault()} onDrop={(event) => onDrop(event.dataTransfer.getData("task"), column.id)}>
    <div className="column-head">
      <div>
        <i style={{ background: column.color }} />
        <strong id={`column-title-${column.id}`} className="clickable-title" title="Click to rename" onClick={handleRename}>{column.title}</strong>
        <span>{column.tasks.length}</span>
      </div>
      <div className="column-head-actions">
        {onRenameColumn && <button aria-label={`Rename ${column.title}`} title="Rename column" onClick={handleRename}><Pencil /></button>}
        {onDeleteColumn && <button aria-label={`Delete ${column.title}`} title="Delete column" onClick={handleDelete}><Trash2 /></button>}
        <button aria-label={`Add task to ${column.title}`} title="Add task" onClick={onAdd}><Plus /></button>
      </div>
    </div>
    <div className="task-list" role="list">{column.tasks.map((task) => <TaskCard key={task.id} task={task} labels={labels} canMoveBackward={canMoveBackward} canMoveForward={canMoveForward}
      onEdit={() => onEdit(task)} onMove={(direction) => onMove(task.id, direction)} onToggle={() => onToggle(task)} onDelete={() => onDelete(task.id)} />)}</div>
    <button className="add-card" onClick={onAdd}><Plus /> Add task</button>
  </section>;
}

function TaskCard({ task, labels, canMoveBackward, canMoveForward, onEdit, onMove, onToggle, onDelete }: {
  task: Task; labels: Workspace["labels"]; canMoveBackward: boolean; canMoveForward: boolean;
  onEdit: () => void; onMove: (direction: "backward" | "forward") => void; onToggle: () => void; onDelete: () => void;
}) {
  const dueDateIsPast = task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10);
  return <article aria-label={task.title} className={`task ${task.completed ? "completed" : ""}`} draggable
    onDragStart={(event) => event.dataTransfer.setData("task", task.id)} role="listitem">
    <div className="task-top"><button aria-label={`Mark ${task.title} ${task.completed ? "incomplete" : "complete"}`} className="check" onClick={onToggle}>{task.completed && <Check />}</button><span aria-label={`${task.priority} priority`} className={`priority ${task.priority}`} /></div>
    <button className="task-title" onClick={onEdit}><span>{task.title}</span>{task.description && <small>{task.description}</small>}</button>
    <div className="task-bottom"><div>{task.labels.map((id) => { const label = labels.find((item) => item.id === id); return label && <span key={id} className="label" style={{ color: label.color, background: `${label.color}20` }}>{label.name}</span>; })}</div>
      {task.dueDate && <time className={dueDateIsPast ? "overdue" : ""}><CalendarDays />{task.dueDate.slice(5).replace("-", "/")}</time>}</div>
    <div className="move-actions" aria-label={`Move ${task.title}`}>
      <button aria-label={`Move ${task.title} to previous column`} disabled={!canMoveBackward} onClick={() => onMove("backward")}><ArrowLeft /></button>
      <button aria-label={`Move ${task.title} to next column`} disabled={!canMoveForward} onClick={() => onMove("forward")}><ArrowRight /></button>
      <button aria-label={`Delete ${task.title}`} className="delete-card-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 /></button>
    </div>
  </article>;
}
