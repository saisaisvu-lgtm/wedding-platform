// 弹幕审核管理 API（管理员）
// GET    /api/danmaku-admin?key=***                    — 列出待审核弹幕
// PUT    /api/danmaku-admin?key=***  { id, action }    — 审核（approve/reject）
// DELETE /api/danmaku-admin?key=***&id=X               — 删除弹幕
// GET    /api/danmaku-admin?key=***&action=bans        — 查看封禁列表
// PUT    /api/danmaku-admin?key=***  { unban_id }      — 解封

import { getCorsHeaders } from './_auth.js';

function checkAdmin(request, env) {
  const key = request.headers.get('X-Admin-Key') || new URL(request.url).searchParams.get('key');
  if (!key || key !== env.ADMIN_KEY) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(env) });
  }
  return null;
}

export async function onRequestOptions(context) {
  return new Response(null, { headers: getCorsHeaders(context.env) });
}

// 列出待审核弹幕 / 查看封禁列表
export async function onRequestGet(context) {
  const { request, env } = context;
  const authErr = checkAdmin(request, env);
  if (authErr) return authErr;
  const corsHeaders = getCorsHeaders(env);

  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'bans') {
      const { results } = await env.DB.prepare(
        `SELECT db.id, db.ip_hash, db.reason, db.created_at, u.username, u.couple_name
         FROM danmaku_bans db
         LEFT JOIN users u ON db.wedding_user_id = u.id
         ORDER BY db.created_at DESC LIMIT 100`
      ).all();
      return Response.json({ ok: true, bans: results }, { headers: corsHeaders });
    }

    // 默认：列出待审核弹幕
    const status = url.searchParams.get('status') || 'pending';
    const { results } = await env.DB.prepare(
      `SELECT d.id, d.nickname, d.content, d.emoji, d.color, d.status, d.ip_hash, d.created_at,
              u.username, u.couple_name
       FROM danmaku d
       LEFT JOIN users u ON d.wedding_user_id = u.id
       WHERE d.status = ?
       ORDER BY d.created_at DESC LIMIT 100`
    ).bind(status).all();

    const stats = await env.DB.prepare(
      "SELECT status, COUNT(*) as c FROM danmaku GROUP BY status"
    ).all();
    const statsMap = { pending: 0, approved: 0, rejected: 0 };
    if (stats.results) stats.results.forEach(r => { statsMap[r.status] = r.c; });

    return Response.json({ ok: true, messages: results, stats: statsMap }, { headers: corsHeaders });

  } catch (err) {
    console.error('Danmaku admin GET error:', err);
    return Response.json({ ok: false, error: '获取失败' }, { status: 500, headers: getCorsHeaders(env) });
  }
}

// 审核 / 解封
export async function onRequestPut(context) {
  const { request, env } = context;
  const authErr = checkAdmin(request, env);
  if (authErr) return authErr;
  const corsHeaders = getCorsHeaders(env);

  try {
    const body = await request.json();

    // 解封
    if (body.unban_id) {
      await env.DB.prepare('DELETE FROM danmaku_bans WHERE id = ?').bind(body.unban_id).run();
      return Response.json({ ok: true, message: '已解封' }, { headers: corsHeaders });
    }

    // 审核弹幕
    const { id, action } = body;
    if (!id || !['approve', 'reject'].includes(action)) {
      return Response.json({ ok: false, error: '参数错误' }, { status: 400, headers: corsHeaders });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await env.DB.prepare('UPDATE danmaku SET status = ? WHERE id = ?').bind(newStatus, id).run();

    return Response.json({ ok: true, message: action === 'approve' ? '已通过' : '已拒绝' }, { headers: corsHeaders });

  } catch (err) {
    console.error('Danmaku admin PUT error:', err);
    return Response.json({ ok: false, error: '操作失败' }, { status: 500, headers: getCorsHeaders(env) });
  }
}

// 删除弹幕
export async function onRequestDelete(context) {
  const { request, env } = context;
  const authErr = checkAdmin(request, env);
  if (authErr) return authErr;
  const corsHeaders = getCorsHeaders(env);

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return Response.json({ ok: false, error: '缺少ID' }, { status: 400, headers: corsHeaders });

    await env.DB.prepare('DELETE FROM danmaku WHERE id = ?').bind(id).run();
    return Response.json({ ok: true, message: '已删除' }, { headers: corsHeaders });

  } catch (err) {
    console.error('Danmaku admin DELETE error:', err);
    return Response.json({ ok: false, error: '删除失败' }, { status: 500, headers: getCorsHeaders(env) });
  }
}
