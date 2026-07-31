// GET  /api/rsvp-list          — 查看回执列表
// DELETE /api/rsvp-list?id=X   — 删除一条回执
// GET  /api/rsvp-list?format=csv — 导出 CSV

import { requireAuth, corsHeaders } from './_auth.js';

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const userId = await requireAuth(context);
  if (userId instanceof Response) return userId;

  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format');

    const { results } = await env.DB.prepare(
      'SELECT id, name, phone, guests, arrival_time, transport, message, created_at FROM rsvp WHERE wedding_user_id = ? ORDER BY created_at DESC'
    ).bind(userId).all();

    // 统计
    const totalGuests = results.reduce((sum, r) => sum + (r.guests || 1), 0);

    if (format === 'csv') {
      const header = '姓名,联系电话,人数,到达时间,出行方式,留言,提交时间';
      const rows = results.map(r =>
        [r.name, r.phone, r.guests, r.arrival_time, r.transport, r.message, r.created_at]
          .map(v => `"${String(v || '').replace(/"/g, '""')}"`)
          .join(',')
      );
      const csv = '\uFEFF' + header + '\n' + rows.join('\n');
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="rsvp-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    return Response.json({
      ok: true,
      data: results,
      stats: {
        total: results.length,
        totalGuests,
      }
    }, { headers: corsHeaders });

  } catch (err) {
    console.error('RSVP list error:', err);
    return Response.json({ ok: false, error: '获取失败' }, { status: 500, headers: corsHeaders });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const userId = await requireAuth(context);
  if (userId instanceof Response) return userId;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return Response.json({ ok: false, error: '缺少 ID' }, { status: 400, headers: corsHeaders });
    }

    // 确保属于当前用户
    const record = await env.DB.prepare(
      'SELECT id FROM rsvp WHERE id = ? AND wedding_user_id = ?'
    ).bind(id, userId).first();

    if (!record) {
      return Response.json({ ok: false, error: '记录不存在' }, { status: 404, headers: corsHeaders });
    }

    await env.DB.prepare('DELETE FROM rsvp WHERE id = ?').bind(id).run();

    return Response.json({ ok: true, message: '删除成功' }, { headers: corsHeaders });

  } catch (err) {
    console.error('RSVP delete error:', err);
    return Response.json({ ok: false, error: '删除失败' }, { status: 500, headers: corsHeaders });
  }
}
