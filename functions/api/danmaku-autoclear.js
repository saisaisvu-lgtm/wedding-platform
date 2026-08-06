// 弹幕自动清理端点（婚礼页面定时调用，无需 ADMIN_KEY）
// DELETE /api/danmaku-autoclear?slug=xxx
// 仅允许清除指定婚礼的弹幕，防止滥用

import { getCorsHeaders } from './_auth.js';

export async function onRequestOptions(context) {
  return new Response(null, { headers: getCorsHeaders(context.env) });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  const corsHeaders = getCorsHeaders(env);

  if (!slug) {
    return Response.json({ ok: false, error: 'Missing slug' }, { status: 400, headers: corsHeaders });
  }

  try {
    // 验证婚礼页面存在
    const user = await env.DB.prepare('SELECT id FROM users WHERE slug = ?').bind(slug).first();
    if (!user) {
      return Response.json({ ok: false, error: 'Not found' }, { status: 404, headers: corsHeaders });
    }

    // 清除该婚礼的所有弹幕和封禁记录
    const r1 = await env.DB.prepare('DELETE FROM danmaku WHERE wedding_user_id = ?').bind(user.id).run();
    const r2 = await env.DB.prepare('DELETE FROM danmaku_bans WHERE wedding_user_id = ?').bind(user.id).run();

    return Response.json({
      ok: true,
      cleared: r1.meta?.changes || 0,
    }, { headers: corsHeaders });

  } catch (err) {
    console.error('Danmaku autoclear error:', err);
    return Response.json({ ok: false, error: 'Failed' }, { status: 500, headers: corsHeaders });
  }
}
