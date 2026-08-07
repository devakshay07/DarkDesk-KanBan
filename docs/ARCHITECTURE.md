# Architecture

DarkDesk has a compact feature boundary: the Kanban workspace owns view state and operations; its `Workspace` model is the contract between UI and persistence. `lib/storage.ts` is an adapter seam—currently browser storage for offline-first use, and the intended insertion point for Supabase sync.

For realtime production operation, publish changes to the `boards`, `columns`, and `cards` tables through Supabase Realtime. Use `updated_at` plus `version` to resolve competing writes: accept a higher version, then use the newer timestamp as a tie breaker. Persist outgoing mutations in IndexedDB and replay them once the connection resumes.
