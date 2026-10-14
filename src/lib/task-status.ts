export function isCompletedColumn(title: string) {
  return ["done", "complete", "completed"].includes(title.trim().toLowerCase());
}
