import { describe, expect, it } from "vitest";
import { initialWorkspace } from "../lib/seed";
describe("initial workspace", () => { it("contains a board with columns", () => { expect(initialWorkspace.boards[0].columns.length).toBeGreaterThan(0); }); });
