import { requireAuth, corsHeaders } from './_auth.js';

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const userId = await requireAuth(context);
  if (userId instanceof Response) return userId;

  try {
    const url = new URL(request.url);
    const imageId = url.searchParams.get('id');

    if (!imageId) {
      return Response.json({ ok: false, error: '缺少图片 ID' }, { status: 400, headers: corsHeaders });
    }

    // 查找图片（确保属于当前用户）
    const image = await env.DB.prepare(
      'SELECT * FROM images WHERE id = ? AND user_id = ?'
    ).bind(imageId, userId).first();

    if (!image) {
      return Response.json({ ok: false, error: '图片不存在' }, { status: 404, headers: corsHeaders });
    }

    // 从数据库删除（数据存在 D1 里，删记录就行）
    await env.DB.prepare('DELETE FROM images WHERE id = ?').bind(imageId).run();

    return Response.json({ ok: true, message: '删除成功' }, { headers: corsHeaders });

  } catch (err) {
    console.error('Delete image error:', err);
    return Response.json({ ok: false, error: '删除失败' }, { status: 500, headers: corsHeaders });
  }
}
