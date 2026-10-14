UPDATE tasks AS task
SET completed_at = task.updated_at
FROM kanban_columns AS col
WHERE task.column_id = col.id
  AND lower(trim(col.title)) IN ('done', 'complete', 'completed')
  AND task.completed_at IS NULL;
