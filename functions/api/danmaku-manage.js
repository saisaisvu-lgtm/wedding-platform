// 用户弹幕管理 API（新人审核自己婚礼的弹幕）
// GET    /api/danmaku-manage                — 列出自己的弹幕
// PUT    /api/danmaku-manage { id, action } — 审核（approve/reject）
// DELETE /api/danmaku-manage?id=X           — 删除弹幕
// GET    /api/danmaku-manage?action=bans    — 查看被封禁的 IP
// PUT    /api/danmaku-manage { unban_id }   — 解封

import { requireAuth, getCorsHeaders } from './_auth.js';

export async function onRequestOptions(context) {
  return new Response(null, { headers: getCorsHeaders(context.env) });
}

// 列出自己的弹幕 / 封禁列表
export async function onRequestGet(context) {
  const { request, env } = context;
  const userId = await requireAuth(context);
  if (userId instanceof Response) return userId;
  const corsHeaders = getCorsHeaders(env);

  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'bans') {
      const { results } = await env.DB.prepare(
        'SELECT id, ip_hash, reason, created_at FROM danmaku_bans WHERE wedding_user_id = ? ORDER BY created_at DESC LIMIT 100'
      ).bind(userId).all();
      return Response.json({ ok: true, bans: results }, { headers: corsHeaders });
    }

    const status = url.searchParams.get('status') || 'pending';
    const { results } = await env.DB.prepare(
      'SELECT id, nickname, content, emoji, color, status, ip_hash, created_at FROM danmaku WHERE wedding_user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 100'
    ).bind(userId, status).all();

    const stats = await env.DB.prepare(
      'SELECT status, COUNT(*) as c FROM danmaku WHERE wedding_user_id = ? GROUP BY status'
    ).bind(userId).all();
    const statsMap = { pending: 0, approved: 0, rejected: 0 };
    if (stats.results) stats.results.forEach(r => { statsMap[r.status] = r.c; });

    return Response.json({ ok: true, messages: results, stats: statsMap }, { headers: corsHeaders });

  } catch (err) {
    console.error('Danmaku manage GET error:', err);
    return Response.json({ ok: false, error: '获取失败' }, { status: 500, headers: getCorsHeaders(env) });
  }
}

// 审核 / 解封
export async function onRequestPut(context) {
  const { request, env } = context;
  const userId = await requireAuth(context);
  if (userId instanceof Response) return userId;
  const corsHeaders = getCorsHeaders(env);

  try {
    const body = await request.json();

    // 解封
    if (body.unban_id) {
      const ban = await env.DB.prepare('SELECT id FROM danmaku_bans WHERE id = ? AND wedding_user_id = ?').bind(body.unban_id, userId).first();
      if (!ban) return Response.json({ ok: false, error: '记录不存在' }, { status: 404, headers: corsHeaders });
      await env.DB.prepare('DELETE FROM danmaku_bans WHERE id = ?').bind(body.unban_id).run();
      return Response.json({ ok: true, message: '已解封' }, { headers: corsHeaders });
    }

    // 审核弹幕
    const { id, action } = body;
    if (!id || !['approve', 'reject'].includes(action)) {
      return Response.json({ ok: false, error: '参数错误' }, { status: 400, headers: corsHeaders });
    }

    // 确保弹幕属于当前用户
    const msg = await env.DB.prepare('SELECT id FROM danmaku WHERE id = ? AND wedding_user_id = ?').bind(id, userId).first();
    if (!msg) return Response.json({ ok: false, error: '弹幕不存在' }, { status: 404, headers: corsHeaders });

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await env.DB.prepare('UPDATE danmaku SET status = ? WHERE id = ?').bind(newStatus, id).run();

    return Response.json({ ok: true, message: action === 'approve' ? '已通过' : '已拒绝' }, { headers: corsHeaders });

  } catch (err) {
    console.error('Danmaku manage PUT error:', err);
    return Response.json({ ok: false, error: '操作失败' }, { status: 500, headers: getCorsHeaders(env) });
  }
}

// 删除弹幕
export async function onRequestDelete(context) {
  const { request, env } = context;
  const userId = await requireAuth(context);
  if (userId instanceof Response) return userId;
  const corsHeaders = getCorsHeaders(env);

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return Response.json({ ok: false, error: '缺少ID' }, { status: 400, headers: corsHeaders });

    const msg = await env.DB.prepare('SELECT id FROM danmaku WHERE id = ? AND wedding_user_id = ?').bind(id, userId).first();
    if (!msg) return Response.json({ ok: false, error: '弹幕不存在' }, { status: 404, headers: corsHeaders });

    await env.DB.prepare('DELETE FROM danmaku WHERE id = ?').bind(id).run();
    return Response.json({ ok: true, message: '已删除' }, { headers: corsHeaders });

  } catch (err) {
    console.error('Danmaku manage DELETE error:', err);
    return Response.json({ ok: false, error: '删除失败' }, { status: 500, headers: getCorsHeaders(env) });
  }
}
