export const migration002 = `
CREATE TABLE IF NOT EXISTS lesson_completions (
  user_id TEXT NOT NULL,
  level_id TEXT NOT NULL,
  completion_count INTEGER NOT NULL DEFAULT 1,
  best_score REAL NOT NULL DEFAULT 0,
  first_completed_at TEXT NOT NULL,
  last_completed_at TEXT NOT NULL,
  PRIMARY KEY (user_id, level_id),
  FOREIGN KEY (user_id) REFERENCES local_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_user
  ON lesson_completions(user_id, last_completed_at);
`;
