// 弹幕消息 API
// POST /api/danmaku          — 发送弹幕（无需登录，通过 slug 关联）
// GET  /api/danmaku?slug=xxx — 获取已审核弹幕（轮询）

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://mylove.sairx.cn',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// 敏感词库（命中自动设为 pending 待审核）
const BAD_WORDS = [
  '傻逼','操你','妈的','去死','垃圾','废物','狗屎','混蛋','王八蛋',
  '贱人','婊子','畜生','白痴','脑残','弱智','智障','煞笔','草泥马',
  '尼玛','卧槽','我靠','fuck','shit','bitch','asshole','dick',
  '色情','约炮','裸聊','赌博','代开发票','加微信','加QQ',
];

function containsBadWord(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BAD_WORDS.some(w => lower.includes(w));
}

async function hashIP(ip) {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + 'danmaku-salt-2026');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).slice(0, 16);
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// 发送弹幕
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { slug, nickname, content, emoji, color } = body;

    if (!slug) {
      return Response.json({ ok: false, error: '缺少婚礼标识' }, { status: 400, headers: corsHeaders });
    }

    if ((!content || !content.trim()) && (!emoji || !emoji.trim())) {
      return Response.json({ ok: false, error: '请输入祝福语或选择表情' }, { status: 400, headers: corsHeaders });
    }

    const user = await env.DB.prepare('SELECT id FROM users WHERE slug = ?').bind(slug).first();
    if (!user) {
      return Response.json({ ok: false, error: '婚礼页面不存在' }, { status: 404, headers: corsHeaders });
    }

    // 获取 IP 并 hash
    const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Real-IP') || '0.0.0.0';
    const ipHash = await hashIP(ip);

    // 检查是否被封禁
    const banned = await env.DB.prepare(
      'SELECT id FROM danmaku_bans WHERE ip_hash = ? AND wedding_user_id = ?'
    ).bind(ipHash, user.id).first();
    if (banned) {
      return Response.json({ ok: false, error: '您已被限制发送消息' }, { status: 403, headers: corsHeaders });
    }

    // 限流：同一 IP 每 3 秒最多 1 条
    const recent = await env.DB.prepare(
      "SELECT id FROM danmaku WHERE wedding_user_id = ? AND ip_hash = ? AND created_at > datetime('now', '-3 seconds') LIMIT 1"
    ).bind(user.id, ipHash).first();
    if (recent) {
      return Response.json({ ok: false, error: '发送太快了，请稍后再试' }, { status: 429, headers: corsHeaders });
    }

    const safeContent = (content || '').trim().slice(0, 50);
    const safeNickname = (nickname || '匿名').trim().slice(0, 12);
    const safeEmoji = (emoji || '').trim().slice(0, 10);
    const safeColor = (color || '').trim().slice(0, 20);

    // 敏感词检测：命中 → pending 待审核，不命中 → 直接 approved
    const hasBadWord = containsBadWord(safeContent) || containsBadWord(safeNickname);
    const status = hasBadWord ? 'pending' : 'approved';

    // 如果命中敏感词，同时记录到 ban 表（自动封禁）
    if (hasBadWord) {
      await env.DB.prepare(
        "INSERT OR IGNORE INTO danmaku_bans (ip_hash, wedding_user_id, reason) VALUES (?, ?, ?)"
      ).bind(ipHash, user.id, '敏感词: ' + safeContent.slice(0, 30)).run();
    }

    await env.DB.prepare(
      'INSERT INTO danmaku (wedding_user_id, nickname, content, emoji, color, status, ip_hash) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(user.id, safeNickname, safeContent, safeEmoji, safeColor, status, ipHash).run();

    if (hasBadWord) {
      return Response.json({ ok: true, message: '已提交，等待审核', pending: true }, { headers: corsHeaders });
    }

    return Response.json({ ok: true, message: '发送成功 🎉' }, { headers: corsHeaders });

  } catch (err) {
    console.error('Danmaku POST error:', err);
    return Response.json({ ok: false, error: '发送失败' }, { status: 500, headers: corsHeaders });
  }
}

// 获取已审核弹幕（轮询）
export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    const after = url.searchParams.get('after');

    if (!slug) {
      return Response.json({ ok: false, error: '缺少婚礼标识' }, { status: 400, headers: corsHeaders });
    }

    const user = await env.DB.prepare('SELECT id FROM users WHERE slug = ?').bind(slug).first();
    if (!user) {
      return Response.json({ ok: false, error: '婚礼页面不存在' }, { status: 404, headers: corsHeaders });
    }

    let query = "SELECT id, nickname, content, emoji, color, created_at FROM danmaku WHERE wedding_user_id = ? AND status = 'approved'";
    const params = [user.id];

    if (after) {
      query += ' AND id > ?';
      params.push(parseInt(after));
    }

    query += ' ORDER BY id DESC LIMIT 50';

    const { results } = await env.DB.prepare(query).bind(...params).all();

    return Response.json({
      ok: true,
      messages: results.reverse(),
    }, { headers: corsHeaders });

  } catch (err) {
    console.error('Danmaku GET error:', err);
    return Response.json({ ok: false, error: '获取失败' }, { status: 500, headers: corsHeaders });
  }
}
