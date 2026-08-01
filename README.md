# 💍 Wedding Wall — 多用户婚礼邀请平台

一键创建专属婚礼页面，在线收集宾客回执，邀请码购买，让幸福更简单。

![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-f6821f?logo=cloudflare)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-f7df1e?logo=javascript)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ 功能一览

### 🎉 新人端

| 功能 | 说明 |
|------|------|
| 📝 快速注册 | 注册即生成独立婚礼页面，专属 slug 链接 |
| ⚙️ 婚礼信息 | 自定义新人姓名、婚礼日期、举办地点 |
| 🎵 背景音乐 | 支持上传 MP3 或填入在线链接 |
| 🖼️ 相册管理 | 上传头像/婚纱照，自动压缩大图 |
| 💌 请帖设置 | 自定义请帖文案、主题色、流程安排 |
| 📊 回执统计 | 实时查看出席人数、出行方式，支持 CSV 导出 |

### 💌 宾客端

| 功能 | 说明 |
|------|------|
| 📱 响应式页面 | 手机/平板/桌面完美适配，扫码即看 |
| 🧱 照片墙模式 | 全屏滚动照片墙，沉浸式体验 |
| 📖 杂志翻页 | 杂志风格逐页浏览，支持手势/键盘翻页 |
| 💌 在线回执 | 一键提交出席信息、随行人数、到达方式 |
| 🎵 背景音乐 | 自动播放新人设置的浪漫 BGM |
| ⏰ 倒计时 | 实时倒计时，显示距婚礼的天/时/分/秒 |

### 🎟️ 邀请码购买系统

| 功能 | 说明 |
|------|------|
| 💰 在线购买 | 注册页直接跳转购买页面，扫码付款 |
| 📱 微信/支付宝 | 支持上传微信和支付宝收款码 |
| ⏳ 实时等待 | 用户付款后页面自动轮询等待确认 |
| 🔔 Bark 推送 | 新订单自动推送到管理员手机 |
| ✅ 一键确认 | 管理员点击 Bark 通知即可确认发放邀请码 |

### 👑 超级管理后台

| 功能 | 说明 |
|------|------|
| 👥 用户管理 | 查看/删除所有注册用户及其数据 |
| 🎟️ 邀请码管理 | 批量生成、查看、删除邀请码 |
| 💰 付款设置 | 设置价格、上传微信/支付宝收款码 |
| 📋 订单管理 | 查看/确认/拒绝购买订单，支持筛选 |
| 🧹 过期清理 | 自动清理婚礼结束超过 3 天的用户数据 |

---

## 🏗️ 技术架构

```
┌──────────────────────────────────────────────────────┐
│                    浏览器客户端                        │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │   首页    │  │ 管理后台  │  │   公开婚礼页面     │  │
│  │  购买页   │  │ 订单管理  │  │  照片墙/杂志/请帖  │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       └──────────────┼─────────────────┘             │
│                      │ REST API                      │
└──────────────────────┼───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│              Cloudflare Pages (边缘)                  │
│  ┌───────────────────────────────────────────────┐   │
│  │        Pages Functions (Serverless)            │   │
│  │   认证 / 用户 / 图片 / 婚礼 / RSVP / 订单     │   │
│  └───────────────────┬───────────────────────────┘   │
│                      │                               │
│  ┌───────────────────▼───────────────────────────┐   │
│  │           Cloudflare D1 (SQLite)              │   │
│  │  users / images / rsvp / invite_codes /       │   │
│  │  payment_settings / purchase_orders /          │   │
│  │  invitation_settings / songs                   │   │
│  └────────────────────────────────────────────────┘   │
│                      │                               │
│  ┌────────────────────────────────────────────────┐   │
│  │          Bark Push Notification                │   │
│  │     新订单通知 → 管理员手机一键确认             │   │
│  └────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────┘
```

### 技术栈

| 层 | 技术 |
|----|------|
| **前端** | 原生 HTML5 + CSS3 + JavaScript（零框架依赖） |
| **后端** | Cloudflare Pages Functions（边缘 Serverless） |
| **数据库** | Cloudflare D1（SQLite） |
| **部署** | Cloudflare Pages |
| **通知** | Bark（iOS 推送通知） |
| **认证** | Cookie + HMAC-SHA256 Session |
| **图片** | Canvas 压缩 + Base64 存储 |

---

## 📁 项目结构

```
wedding-platform/
├── public/                          # 前端静态文件
│   ├── index.html                   # 首页
│   ├── register.html                # 注册页（支持 ?code= 自动填充邀请码）
│   ├── login.html                   # 登录页
│   ├── dashboard.html               # 新人管理后台
│   ├── invitation-settings.html     # 请帖设置页
│   ├── invite.html                  # 请帖展示页（三栏卡片 + 二维码）
│   ├── buy.html                     # 购买邀请码
│   ├── admin.html                   # 超级管理后台
│   ├── poster.html                  # 海报生成
│   ├── w/                           # 婚礼现场页（SSR）
│   │   └── index.html               # 照片墙 + 杂志 + RSVP
│   ├── css/style.css                # 全局样式
│   ├── js/api.js                    # API 请求封装
│   └── illustration.jpg             # 请帖默认插画
│
├── functions/                       # 后端 Cloudflare Pages Functions
│   ├── api/                         # REST API 端点
│   │   ├── _auth.js                 # 认证中间件
│   │   ├── register.js              # 用户注册
│   │   ├── login.js                 # 用户登录
│   │   ├── logout.js                # 退出登录
│   │   ├── me.js                    # 个人信息 CRUD
│   │   ├── upload.js                # 图片上传
│   │   ├── delete-image.js          # 删除图片
│   │   ├── image.js                 # 读取图片
│   │   ├── invitation-settings.js   # 请帖设置 CRUD
│   │   ├── wedding/[slug].js        # 公开婚礼数据 API
│   │   ├── rsvp.js                  # 宾客提交回执
│   │   ├── rsvp-list.js             # 回执管理
│   │   ├── order.js                 # 购买订单 CRUD + Bark 推送
│   │   ├── confirm-order.js         # Bark 确认页面
│   │   ├── bark-action.js           # Bark 回调接口
│   │   ├── admin.js                 # 超级管理员
│   │   ├── invite.js                # 邀请码管理
│   │   ├── payment.js               # 付款设置
│   │   ├── payment-image.js         # 收款码图片
│   │   ├── poster.js                # 海报生成
│   │   ├── songs.js                 # 歌曲管理
│   │   ├── music.js                 # 音乐接口
│   │   ├── lyrics-search.js         # 歌词搜索
│   │   └── cleanup.js               # 过期清理
│   └── w/
│       └── [slug].js                # 婚礼展示页（照片墙+杂志+RSVP+倒计时）
│
├── schema.sql                       # 主数据库建表脚本
├── schema-add-english-names.sql     # 英文名列迁移
├── schema-invitation-settings.sql   # 请帖设置表迁移
├── wrangler.toml                    # Cloudflare 部署配置
├── DEPLOY.md                        # 部署文档
└── README.md                        # 本文件
```

---

## 🔌 API 接口

### 用户 & 婚礼

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/register` | 注册（需邀请码） | ❌ |
| POST | `/api/login` | 登录 | ❌ |
| POST | `/api/logout` | 退出 | ✅ |
| GET/PUT | `/api/me` | 个人信息 | ✅ |
| GET | `/api/wedding/{slug}` | 公开婚礼数据 | ❌ |

### 图片

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/upload` | 上传图片 | ✅ |
| GET | `/api/image?id={id}` | 读取图片 | ❌ |
| DELETE | `/api/delete-image?id={id}` | 删除图片 | ✅ |

### 请帖设置

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/invitation-settings` | 读取请帖设置 | ✅ |
| PUT | `/api/invitation-settings` | 保存请帖设置 | ✅ |

### RSVP 回执

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/rsvp` | 提交回执 | ❌ |
| GET | `/api/rsvp-list` | 回执列表 | ✅ |
| GET | `/api/rsvp-list?format=csv` | 导出 CSV | ✅ |
| DELETE | `/api/rsvp-list?id={id}` | 删除回执 | ✅ |

### 购买订单

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/order` | 提交订单 + Bark 推送 | ❌ |
| GET | `/api/order?id={id}` | 查询订单状态 | ❌ |
| GET/PUT/DELETE | `/api/order?key=***` | 管理订单 | 🔑 ADMIN_KEY |

### 管理

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET/DELETE | `/api/admin?key=***` | 用户管理 | 🔑 |
| GET/POST/DELETE | `/api/invite?key=***` | 邀请码管理 | 🔑 |
| GET/PUT | `/api/payment?key=***` | 付款设置 | 🔑 |
| GET/POST | `/api/cleanup?key=***` | 过期清理 | 🔑 |

---

## 🗄️ 数据库

```sql
-- 用户表
users (id, username, password_hash, couple_name, partner1, partner2,
       partner1_en, partner2_en, wedding_date, wedding_venue, theme_color,
       bgm_url, bgm_data, arrival_options, transport_options, slug, created_at)

-- 图片表
images (id, user_id, category, r2_key, filename, mime_type, data,
        sort_order, created_at)

-- 回执表
rsvp (id, wedding_user_id, name, phone, guests, arrival_time,
      transport, message, created_at)

-- 邀请码表
invite_codes (id, code, used_by, used_at, created_at)

-- 付款设置表
payment_settings (id, price, price_desc, wechat_qr, alipay_qr,
                  contact_info, updated_at)

-- 购买订单表
purchase_orders (id, contact, contact_type, amount, invite_code,
                 status, note, created_at, updated_at)

-- 请帖设置表
invitation_settings (id, user_id, call_to_action, married_text,
                     welcome_title, welcome_text, love_quote, invite_text,
                     thank_you, kids_text, schedule, venue_address,
                     venue_map_url, default_guest_name, bgm_url,
                     theme_color, updated_at)

-- 歌曲表
songs (id, user_id, song_name, artist, audio_url, audio_data,
       lyrics, lyrics_offset, sort_order)
```

---

## 🚀 部署

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建 D1 数据库
wrangler d1 create wedding-platform-db

# 初始化数据库
wrangler d1 execute wedding-platform-db --file=./schema.sql

# 部署
wrangler pages deploy ./public --project-name=wedding-platform
```

### 环境变量

在 `wrangler.toml` 中配置：

```toml
[vars]
SESSION_SECRET = "你的密钥"
ADMIN_KEY = "管理员密钥"
BARK_KEY = "Bark 推送 Key"
SITE_URL = "https://你的域名"
```

### 本地开发

```bash
wrangler pages dev ./public --d1 DB=wedding-platform-db
```

---

## 📱 核心流程

### 新人注册 → 创建婚礼页面

```
访问首页 → 输入邀请码 → 注册账号 → 进入控制台
→ 设置婚礼信息 → 上传照片 → 设置请帖 → 分享链接
```

### 宾客访问 → 提交回执

```
扫码/打开链接 → 看到倒计时页面 → 进入婚礼现场
→ 浏览照片墙/杂志 → 提交 RSVP 回执 → 查看个性化请帖
```

### 邀请码购买流程

```
用户扫码付款 → 填写联系方式 → 点「我已付款」
         ↓
  管理员手机收到 Bark 推送
         ↓
  点击通知 → 打开确认页面
         ↓
  点「确认发放」→ 自动生成邀请码
         ↓
  用户页面自动显示邀请码 → 跳转注册页
```

---

## 🎨 请帖功能

- **三栏卡片布局**：左卡（邀请+插画+二维码）、中卡（新人信息+日期+地点）、右卡（欢迎语+流程）
- **自定义主题色**：支持预设色彩或自定义颜色
- **个性化宾客名**：URL 参数 `?guest=姓名` 或 RSVP 自动填充
- **双二维码**：邀请函二维码 + 婚礼现场二维码
- **保存为图片**：自动添加纪念相框（金色边框+角落花朵+囍字）
- **透明背景二维码**：嵌入卡片无白色背景

---

## 📄 许可证

[MIT License](./LICENSE)
