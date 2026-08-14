export const migration001 = `
CREATE TABLE IF NOT EXISTS local_user (
  id TEXT PRIMARY KEY,
  teacher_language_id TEXT NOT NULL,
  onboarding_completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS user_languages (
  user_id TEXT NOT NULL,
  language_id TEXT NOT NULL,
  pronunciation_variant_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  priority INTEGER NOT NULL DEFAULT 0,
  current_level_id TEXT,
  added_at TEXT NOT NULL,
  PRIMARY KEY (user_id, language_id),
  FOREIGN KEY (user_id) REFERENCES local_user(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS unit_mastery (
  user_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  recognition INTEGER NOT NULL DEFAULT 0 CHECK(recognition BETWEEN 0 AND 100),
  listening INTEGER NOT NULL DEFAULT 0 CHECK(listening BETWEEN 0 AND 100),
  pronunciation INTEGER NOT NULL DEFAULT 0 CHECK(pronunciation BETWEEN 0 AND 100),
  writing INTEGER NOT NULL DEFAULT 0 CHECK(writing BETWEEN 0 AND 100),
  recall INTEGER NOT NULL DEFAULT 0 CHECK(recall BETWEEN 0 AND 100),
  total_attempts INTEGER NOT NULL DEFAULT 0,
  correct_attempts INTEGER NOT NULL DEFAULT 0,
  streak_correct INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TEXT,
  next_review_at TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, unit_id),
  FOREIGN KEY (user_id) REFERENCES local_user(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  language_id TEXT NOT NULL,
  unit_id TEXT,
  skill TEXT NOT NULL,
  correct INTEGER NOT NULL,
  score REAL,
  user_answer TEXT,
  expected_answer TEXT,
  duration_ms INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES local_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_attempts_user_created ON attempts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_attempts_unit ON attempts(user_id, unit_id);
CREATE INDEX IF NOT EXISTS idx_mastery_review ON unit_mastery(user_id, next_review_at);
`;
