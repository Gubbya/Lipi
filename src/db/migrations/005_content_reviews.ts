export const migration005 = `
CREATE TABLE IF NOT EXISTS content_reviews (
  user_id TEXT NOT NULL,
  language_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'needs-review' CHECK(status IN ('needs-review', 'in-review', 'approved')),
  notes TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, language_id),
  FOREIGN KEY (user_id) REFERENCES local_user(id) ON DELETE CASCADE
);
`;
