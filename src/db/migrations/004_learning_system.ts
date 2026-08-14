export const migration004 = `
ALTER TABLE local_user ADD COLUMN display_name TEXT NOT NULL DEFAULT 'Learner';
ALTER TABLE local_user ADD COLUMN avatar_emoji TEXT NOT NULL DEFAULT '🌱';

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO app_settings (key, value, updated_at)
SELECT 'active_user_id', id, datetime('now') FROM local_user ORDER BY created_at LIMIT 1;

CREATE TABLE IF NOT EXISTS review_cards (
  user_id TEXT NOT NULL,
  language_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  skill TEXT NOT NULL,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  repetition_count INTEGER NOT NULL DEFAULT 0,
  due_at TEXT NOT NULL,
  last_score REAL,
  last_reviewed_at TEXT,
  PRIMARY KEY (user_id, unit_id, skill),
  FOREIGN KEY (user_id) REFERENCES local_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_review_cards_due ON review_cards(user_id, due_at);

CREATE TABLE IF NOT EXISTS pronunciation_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  language_id TEXT NOT NULL,
  unit_id TEXT,
  target_text TEXT NOT NULL,
  recording_uri TEXT,
  duration_ms INTEGER,
  self_score INTEGER,
  ai_score REAL,
  transcript TEXT,
  feedback TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES local_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_pronunciation_user_created ON pronunciation_attempts(user_id, created_at);

CREATE TABLE IF NOT EXISTS tutor_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  language_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('learner', 'tutor')),
  message TEXT NOT NULL,
  romanization TEXT,
  translation TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES local_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_tutor_messages_user_created ON tutor_messages(user_id, language_id, created_at);

CREATE TABLE IF NOT EXISTS sync_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('upload', 'download')),
  status TEXT NOT NULL CHECK(status IN ('success', 'failed')),
  detail TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES local_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sync_history_user_created ON sync_history(user_id, created_at);
`;
