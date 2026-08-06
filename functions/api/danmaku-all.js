// 弹幕全量清理 API
// DELETE /api/danmaku-all?key=***  — 清除所有弹幕记录
// DELETE /api/danmaku-all?key=***&slug=xxx  — 清除指定婚礼的弹幕

import { getCorsHeaders } from './_auth.js';

export async function onRequestOptions(context) {
  return new Response(null, { headers: getCorsHeaders(context.env) });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = request.headers.get('X-Admin-Key') || url.searchParams.get('key');

  if (!key || key !== env.ADMIN_KEY) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: getCorsHeaders(env) });
  }

  try {
    const slug = url.searchParams.get('slug');

    let deletedDanmaku = 0;
    let deletedBans = 0;

    if (slug) {
      // 清除指定婚礼的弹幕
      const user = await env.DB.prepare('SELECT id FROM users WHERE slug = ?').bind(slug).first();
      if (user) {
        const r1 = await env.DB.prepare('DELETE FROM danmaku WHERE wedding_user_id = ?').bind(user.id).run();
        const r2 = await env.DB.prepare('DELETE FROM danmaku_bans WHERE wedding_user_id = ?').bind(user.id).run();
        deletedDanmaku = r1.meta?.changes || 0;
        deletedBans = r2.meta?.changes || 0;
      }
    } else {
      // 清除所有弹幕
      const r1 = await env.DB.prepare('DELETE FROM danmaku').run();
      const r2 = await env.DB.prepare('DELETE FROM danmaku_bans').run();
      deletedDanmaku = r1.meta?.changes || 0;
      deletedBans = r2.meta?.changes || 0;
    }

    return Response.json({
      ok: true,
      message: `已清除 ${deletedDanmaku} 条弹幕、${deletedBans} 条封禁记录`,
      deletedDanmaku,
      deletedBans,
    }, { headers: getCorsHeaders(env) });

  } catch (err) {
    console.error('Danmaku cleanup error:', err);
    return Response.json({ ok: false, error: '清理失败' }, { status: 500, headers: getCorsHeaders(env) });
  }
}
