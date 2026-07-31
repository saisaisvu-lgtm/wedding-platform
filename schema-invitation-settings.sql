-- 请帖扩展设置表
CREATE TABLE IF NOT EXISTS invitation_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  call_to_action TEXT NOT NULL DEFAULT '快来搂席！',
  married_text TEXT NOT NULL DEFAULT 'WE ARE MARRIED',
  welcome_title TEXT NOT NULL DEFAULT 'Welcome',
  welcome_text TEXT NOT NULL DEFAULT '',
  love_quote TEXT NOT NULL DEFAULT 'Love is life in its fulness',
  invite_text TEXT NOT NULL DEFAULT '敬备喜宴 ❤️ 恭候莅临',
  thank_you TEXT NOT NULL DEFAULT 'Thank you',
  kids_text TEXT NOT NULL DEFAULT 'These two kids are getting married',
  schedule TEXT NOT NULL DEFAULT '[]',
  venue_address TEXT NOT NULL DEFAULT '',
  venue_map_url TEXT NOT NULL DEFAULT '',
  default_guest_name TEXT NOT NULL DEFAULT '嘉宾',
  bgm_url TEXT NOT NULL DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invitation_settings_user ON invitation_settings(user_id);
