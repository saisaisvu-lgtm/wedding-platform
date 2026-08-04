-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  couple_name TEXT NOT NULL DEFAULT '',
  partner1 TEXT NOT NULL DEFAULT '',
  partner2 TEXT NOT NULL DEFAULT '',
  wedding_date TEXT NOT NULL DEFAULT '',
  wedding_venue TEXT NOT NULL DEFAULT '',
  theme_color TEXT NOT NULL DEFAULT '#d4af37',
  bgm_url TEXT NOT NULL DEFAULT '',
  bgm_data TEXT NOT NULL DEFAULT '',
  arrival_options TEXT NOT NULL DEFAULT '[]',
  transport_options TEXT NOT NULL DEFAULT '[]',
  slug TEXT NOT NULL UNIQUE,
  participation_code TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

-- 图片表
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'gallery', -- avatar / credits / gallery
  r2_key TEXT NOT NULL DEFAULT '',
  filename TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
  data TEXT NOT NULL DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- RSVP 回执表（每个婚礼页面独立的回执）
CREATE TABLE IF NOT EXISTS rsvp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wedding_user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  guests INTEGER DEFAULT 1,
  arrival_time TEXT DEFAULT '',
  transport TEXT DEFAULT '',
  message TEXT DEFAULT '',
  participation_code TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (wedding_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 邀请码表
CREATE TABLE IF NOT EXISTS invite_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  used_by INTEGER DEFAULT NULL,
  used_at TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 付款设置表（超级管理后台维护）
CREATE TABLE IF NOT EXISTS payment_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  price REAL NOT NULL DEFAULT 9.9,
  price_desc TEXT NOT NULL DEFAULT '注册码单价',
  wechat_qr TEXT NOT NULL DEFAULT '',     -- 微信收款码 base64
  alipay_qr TEXT NOT NULL DEFAULT '',     -- 支付宝收款码 base64
  contact_info TEXT NOT NULL DEFAULT '',  -- 联系方式（付款备注/加微信等）
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 购买订单表
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact TEXT NOT NULL DEFAULT '',
  contact_type TEXT NOT NULL DEFAULT 'wechat',
  amount REAL NOT NULL DEFAULT 0,
  invite_code TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 歌曲/歌词表
CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  song_name TEXT NOT NULL DEFAULT '',
  artist TEXT NOT NULL DEFAULT '',
  audio_url TEXT NOT NULL DEFAULT '',
  audio_data TEXT NOT NULL DEFAULT '',
  lyrics TEXT NOT NULL DEFAULT '[]',
  lyrics_offset REAL NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_slug ON users(slug);
CREATE INDEX IF NOT EXISTS idx_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_images_user ON images(user_id, category);
CREATE INDEX IF NOT EXISTS idx_rsvp_wedding ON rsvp(wedding_user_id);
CREATE INDEX IF NOT EXISTS idx_songs_user ON songs(user_id);
CREATE INDEX IF NOT EXISTS idx_users_participation_code ON users(participation_code);

-- 弹幕消息表
CREATE TABLE IF NOT EXISTS danmaku (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wedding_user_id INTEGER NOT NULL,
  nickname TEXT NOT NULL DEFAULT '匿名',
  content TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'approved',
  ip_hash TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (wedding_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_danmaku_wedding ON danmaku(wedding_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_danmaku_status ON danmaku(status);

-- 弹幕封禁表（按 IP hash 封禁）
CREATE TABLE IF NOT EXISTS danmaku_bans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash TEXT NOT NULL,
  wedding_user_id INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_danmaku_bans_ip ON danmaku_bans(ip_hash, wedding_user_id);
