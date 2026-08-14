export const migration003 = `
CREATE TABLE IF NOT EXISTS practice_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  language_ids TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES local_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_created
  ON practice_sessions(user_id, created_at);
`;
