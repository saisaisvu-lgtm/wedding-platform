# 🚀 Wedding Wall 部署指南

## 前置条件

- Node.js v18+
- Cloudflare 账号
- 已安装 Wrangler CLI

```bash
npm install -g wrangler
```

## 部署步骤

### 1. 登录 Cloudflare

```bash
wrangler login
```

### 2. 创建 D1 数据库

```bash
wrangler d1 create wedding-platform-db
```

复制输出的 `database_id`，替换 `wrangler.toml` 中的 `YOUR_D1_DATABASE_ID`。

### 3. 初始化数据库

```bash
wrangler d1 execute wedding-platform-db --file=./schema.sql
```

### 4. 部署到 Cloudflare Pages

```bash
wrangler pages deploy ./public --project-name=wedding-platform
```

### 5. 绑定资源

前往 Cloudflare Dashboard：

1. **Pages 项目** → Settings → Functions
2. **D1 database bindings**：
   - Variable name: `DB`
   - D1 database: `wedding-platform-db`
3. **Environment variables**：
   - `SESSION_SECRET` → 一个随机字符串（用于 session 加密）

### 6. 完成！

访问 `https://wedding-platform.pages.dev`，注册账号，开始使用。

## 本地开发

```bash
wrangler pages dev ./public --d1 DB=wedding-platform-db
```

## 项目结构

```
wedding-platform/
├── public/                 # 静态前端文件
│   ├── index.html         # 首页
│   ├── register.html      # 注册页
│   ├── login.html         # 登录页
│   ├── dashboard.html     # 管理后台
│   ├── w/index.html       # 公开婚礼页面
│   ├── css/style.css
│   └── js/api.js
├── functions/api/          # Cloudflare Pages Functions
│   ├── _auth.js           # 认证工具
│   ├── register.js        # POST 注册
│   ├── login.js           # POST 登录
│   ├── logout.js          # POST 退出
│   ├── me.js              # GET/PUT 个人信息
│   ├── upload.js          # POST 图片上传（存 D1）
│   ├── delete-image.js    # DELETE 删除图片
│   ├── image.js           # GET 读取图片
│   ├── wedding/[slug].js  # GET 公开婚礼数据
│   ├── rsvp.js            # POST 宾客回执
│   └── rsvp-list.js       # GET/DELETE 回执管理
├── schema.sql              # D1 建表 SQL
├── wrangler.toml           # 部署配置
└── DEPLOY.md               # 本文档
```

## API 接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/register | 注册 | ❌ |
| POST | /api/login | 登录 | ❌ |
| POST | /api/logout | 退出 | ❌ |
| GET | /api/me | 获取个人信息+图片 | ✅ |
| PUT | /api/me | 更新设置 | ✅ |
| POST | /api/upload | 上传图片 | ✅ |
| DELETE | /api/delete-image?id=X | 删除图片 | ✅ |
| GET | /api/image?id=X | 读取图片 | ❌ |
| GET | /api/wedding/{slug} | 公开婚礼数据 | ❌ |
| POST | /api/rsvp | 宾客提交回执 | ❌ |
| GET | /api/rsvp-list | 查看回执列表 | ✅ |
| GET | /api/rsvp-list?format=csv | 导出 CSV | ✅ |
| DELETE | /api/rsvp-list?id=X | 删除回执 | ✅ |

## 图片存储说明

图片以 base64 格式存储在 D1 数据库中，单张限制 2MB。适合婚礼站点的图片量级。
