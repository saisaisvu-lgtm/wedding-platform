// 超级管理接口
// GET    /api/admin?key=***                — 列出所有用户
// DELETE /api/admin?key=***&userId=X       — 删除指定用户及其所有数据
// DELETE /api/admin?key=***&username=X     — 按用户名删除

import { getCorsHeaders } from './_auth.js';

function checkAdmin(request, env) {
  // 优先读 X-Admin-Key 请求头，兼容 URL 参数
  const key = request.headers.get('X-Admin-Key') || new URL(request.url).searchParams.get('key');
  if (!key || key !== env.ADMIN_KEY) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(env) });
  }
  return null;
}

export async function onRequestOptions(context) {
  return new Response(null, { headers: getCorsHeaders(context.env) });
}

// 列出所有用户
export async function onRequestGet(context) {
  const { request, env } = context;
  const authErr = checkAdmin(request, env);
  if (authErr) return authErr;

  try {
    const { results: users } = await env.DB.prepare(
      'SELECT id, username, couple_name, partner1, partner2, wedding_date, slug, created_at FROM users ORDER BY created_at DESC'
    ).all();

    // 统计每个用户的图片和回执数量
    const usersWithStats = [];
    for (const u of users) {
      const imgCount = await env.DB.prepare('SELECT COUNT(*) as c FROM images WHERE user_id = ?').bind(u.id).first();
      const rsvpCount = await env.DB.prepare('SELECT COUNT(*) as c FROM rsvp WHERE wedding_user_id = ?').bind(u.id).first();
      usersWithStats.push({
        ...u,
        image_count: imgCount?.c || 0,
        rsvp_count: rsvpCount?.c || 0,
      });
    }

    return Response.json({ ok: true, users: usersWithStats }, { headers: getCorsHeaders(env) });

  } catch (err) {
    console.error('Admin list error:', err);
    return Response.json({ ok: false, error: '获取失败' }, { status: 500, headers: getCorsHeaders(env) });
  }
}

// 删除用户及其所有数据
export async function onRequestDelete(context) {
  const { request, env } = context;
  const authErr = checkAdmin(request, env);
  if (authErr) return authErr;

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const username = url.searchParams.get('username');

    let user;
    if (userId) {
      user = await env.DB.prepare('SELECT id, username, couple_name FROM users WHERE id = ?').bind(userId).first();
    } else if (username) {
      user = await env.DB.prepare('SELECT id, username, couple_name FROM users WHERE username = ?').bind(username).first();
    } else {
      return Response.json({ ok: false, error: '请提供 userId 或 username' }, { status: 400, headers: getCorsHeaders(env) });
    }

    if (!user) {
      return Response.json({ ok: false, error: '用户不存在' }, { status: 404, headers: getCorsHeaders(env) });
    }

    // 删除关联数据（顺序：images → rsvp → user）
    await env.DB.prepare('DELETE FROM images WHERE user_id = ?').bind(user.id).run();
    await env.DB.prepare('DELETE FROM rsvp WHERE wedding_user_id = ?').bind(user.id).run();
    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();

    return Response.json({
      ok: true,
      message: `已删除用户 "${user.username}"（${user.couple_name}）及其所有数据`,
    }, { headers: getCorsHeaders(env) });

  } catch (err) {
    console.error('Admin delete error:', err);
    return Response.json({ ok: false, error: '删除失败' }, { status: 500, headers: getCorsHeaders(env) });
  }
}
