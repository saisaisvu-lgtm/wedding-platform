// 弹幕消息 API
// POST /api/danmaku          — 发送弹幕
// GET  /api/danmaku?slug=xxx — 获取已审核弹幕

import { checkContent, hashIP } from './_filter.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://mylove.sairx.cn',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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

    // 获取 IP
    const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Real-IP') || '0.0.0.0';
    const ipHash = await hashIP(ip);

    // 检查是否被封禁
    const banned = await env.DB.prepare(
      "SELECT id, expires_at FROM danmaku_bans WHERE ip_hash = ? AND wedding_user_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))"
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

    // 限流：同一 IP 每分钟最多 5 条
    const minuteCount = await env.DB.prepare(
      "SELECT COUNT(*) as c FROM danmaku WHERE wedding_user_id = ? AND ip_hash = ? AND created_at > datetime('now', '-1 minute')"
    ).bind(user.id, ipHash).first();
    if (minuteCount && minuteCount.c >= 20) {
      return Response.json({ ok: false, error: '发送太频繁，请稍后再试' }, { status: 429, headers: corsHeaders });
    }

    const safeContent = (content || '').trim().slice(0, 50);
    const safeNickname = (nickname || '匿名').trim().slice(0, 12);
    const safeEmoji = (emoji || '').trim().slice(0, 10);
    const safeColor = (color || '').trim().slice(0, 20);

    // 内容审核
    const result = checkContent(safeContent, safeNickname);

    let status = 'approved';
    let banDuration = null;

    if (result.action === 'reject_ban') {
      // level 3: 直接拒绝 + 永久封禁
      status = 'rejected';
      banDuration = null; // 永久
      await env.DB.prepare(
        "INSERT INTO danmaku_bans (ip_hash, wedding_user_id, reason, expires_at) VALUES (?, ?, ?, NULL)"
      ).bind(ipHash, user.id, '严重违规: ' + result.words.join(',')).run();
    } else if (result.action === 'pending_ban') {
      // level 2: 待审核 + 封禁 1 小时
      status = 'pending';
      banDuration = '1 hour';
      await env.DB.prepare(
        "INSERT INTO danmaku_bans (ip_hash, wedding_user_id, reason, expires_at) VALUES (?, ?, ?, datetime('now', '+1 hour'))"
      ).bind(ipHash, user.id, '敏感词: ' + result.words.join(',')).run();
    } else if (result.action === 'pending') {
      // level 1: 待审核，不封禁
      status = 'pending';
    }

    await env.DB.prepare(
      'INSERT INTO danmaku (wedding_user_id, nickname, content, emoji, color, status, ip_hash) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(user.id, safeNickname, safeContent, safeEmoji, safeColor, status, ipHash).run();

    if (status === 'rejected') {
      return Response.json({ ok: false, error: '内容违规，无法发送' }, { status: 400, headers: corsHeaders });
    }
    if (status === 'pending') {
      return Response.json({ ok: true, message: '已提交，等待审核', pending: true }, { headers: corsHeaders });
    }

    return Response.json({ ok: true, message: '发送成功 🎉' }, { headers: corsHeaders });

  } catch (err) {
    console.error('Danmaku POST error:', err);
    return Response.json({ ok: false, error: '发送失败' }, { status: 500, headers: corsHeaders });
  }
}

// 获取已审核弹幕
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

    return Response.json({ ok: true, messages: results.reverse() }, { headers: corsHeaders });

  } catch (err) {
    console.error('Danmaku GET error:', err);
    return Response.json({ ok: false, error: '获取失败' }, { status: 500, headers: corsHeaders });
  }
}
