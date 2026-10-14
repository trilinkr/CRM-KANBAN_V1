import { describe, expect, it } from "vitest";
import { isCompletedColumn } from "../src/lib/task-status";
describe("completed board columns", () => {
  it("recognises completion names regardless of case or spaces", () => {
    for (const title of ["Done", "Complete", "Completed", " COMPLETED "]) expect(isCompletedColumn(title)).toBe(true);
  });
  it("keeps other columns open", () => {
    for (const title of ["To Do", "In Progress", "Waiting", "Incomplete"]) expect(isCompletedColumn(title)).toBe(false);
  });
});
