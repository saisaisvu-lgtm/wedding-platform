// 自动清理过期用户（婚礼结束3天后）
// GET /api/cleanup?key=***         — 预览将被删除的用户
// POST /api/cleanup?key=***&dry=0 — 执行删除

import { getCorsHeaders } from './_auth.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = request.headers.get('X-Admin-Key') || url.searchParams.get('key');

  // 支持 ADMIN_KEY 或专用 CLEANUP_KEY
  if (!key || (key !== env.ADMIN_KEY && key !== env.CLEANUP_KEY)) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(env) });
  }

  if (request.method !== 'GET' && request.method !== 'POST') {
    return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405, headers: getCorsHeaders(env) });
  }

  try {
    // 查找婚礼日期已过3天的用户
    // wedding_date 格式: YYYY-MM-DD
    const { results: expiredUsers } = await env.DB.prepare(
      `SELECT id, username, couple_name, wedding_date, slug FROM users
       WHERE wedding_date != ''
       AND date(wedding_date, '+3 days') < date('now')`
    ).all();

    if (request.method === 'GET') {
      // 预览模式
      return Response.json({
        ok: true,
        message: `找到 ${expiredUsers.length} 个过期用户`,
        users: expiredUsers,
      }, { headers: getCorsHeaders(env) });
    }

    // POST — 执行删除
    const dry = url.searchParams.get('dry');
    if (dry === '1') {
      return Response.json({
        ok: true,
        message: `预览模式，将删除 ${expiredUsers.length} 个用户`,
        users: expiredUsers,
      }, { headers: getCorsHeaders(env) });
    }

    let deleted = 0;
    const deletedList = [];
    for (const user of expiredUsers) {
      await env.DB.prepare('DELETE FROM images WHERE user_id = ?').bind(user.id).run();
      await env.DB.prepare('DELETE FROM rsvp WHERE wedding_user_id = ?').bind(user.id).run();
      await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();
      deletedList.push(user.couple_name);
      deleted++;
    }

    // Bark 推送
    const barkKey = env.BARK_KEY || '';
    if (barkKey) {
      const barkUrl = `https://api.day.app/${barkKey}/婚礼平台过期清理/${encodeURIComponent('已清理 ' + deleted + ' 个用户：' + (deletedList.join('、') || '无'))}/?sound=minuet&group=wedding-cleanup`;
      try { await fetch(barkUrl); } catch (e) { console.error('Bark push failed:', e); }
    }

    return Response.json({
      ok: true,
      message: `已删除 ${deleted} 个过期用户及其所有数据`,
      deleted: expiredUsers.map(u => ({ username: u.username, couple: u.couple_name, date: u.wedding_date })),
    }, { headers: getCorsHeaders(env) });

  } catch (err) {
    console.error('Cleanup error:', err);
    return Response.json({ ok: false, error: '清理失败' }, { status: 500, headers: getCorsHeaders(env) });
  }
}
