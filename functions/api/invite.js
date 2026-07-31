// 邀请码管理接口（超级管理员）
// GET    /api/invite?key=***              — 列出所有邀请码
// POST   /api/invite { key, count }       — 批量生成邀请码
// DELETE /api/invite?key=***&id=X         — 删除邀请码

import { corsHeaders } from './_auth.js';

function checkAdmin(request, env) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key || key !== env.ADMIN_KEY) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }
  return null;
}

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// 列出邀请码
export async function onRequestGet(context) {
  const { request, env } = context;
  const authErr = checkAdmin(request, env);
  if (authErr) return authErr;

  try {
    const { results } = await env.DB.prepare(
      `SELECT ic.id, ic.code, ic.used_by, ic.used_at, ic.created_at, u.username
       FROM invite_codes ic
       LEFT JOIN users u ON ic.used_by = u.id
       ORDER BY ic.created_at DESC`
    ).all();

    const stats = {
      total: results.length,
      unused: results.filter(r => !r.used_by).length,
      used: results.filter(r => r.used_by).length,
    };

    return Response.json({ ok: true, codes: results, stats }, { headers: corsHeaders });
  } catch (err) {
    console.error('Invite list error:', err);
    return Response.json({ ok: false, error: '获取失败' }, { status: 500, headers: corsHeaders });
  }
}

// 生成邀请码
export async function onRequestPost(context) {
  const { request, env } = context;
  const authErr = checkAdmin(request, env);
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const count = Math.min(Math.max(parseInt(body.count) || 1, 1), 100);
    const codes = [];

    for (let i = 0; i < count; i++) {
      let code;
      let attempts = 0;
      // 确保不重复
      do {
        code = genCode();
        attempts++;
      } while (attempts < 10 && await env.DB.prepare('SELECT id FROM invite_codes WHERE code = ?').bind(code).first());

      await env.DB.prepare('INSERT INTO invite_codes (code) VALUES (?)').bind(code).run();
      codes.push(code);
    }

    return Response.json({ ok: true, message: `已生成 ${codes.length} 个邀请码`, codes }, { headers: corsHeaders });
  } catch (err) {
    console.error('Invite create error:', err);
    return Response.json({ ok: false, error: '生成失败' }, { status: 500, headers: corsHeaders });
  }
}

// 删除邀请码
export async function onRequestDelete(context) {
  const { request, env } = context;
  const authErr = checkAdmin(request, env);
  if (authErr) return authErr;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return Response.json({ ok: false, error: '缺少ID' }, { status: 400, headers: corsHeaders });

    await env.DB.prepare('DELETE FROM invite_codes WHERE id = ?').bind(id).run();
    return Response.json({ ok: true, message: '删除成功' }, { headers: corsHeaders });
  } catch (err) {
    console.error('Invite delete error:', err);
    return Response.json({ ok: false, error: '删除失败' }, { status: 500, headers: corsHeaders });
  }
}
