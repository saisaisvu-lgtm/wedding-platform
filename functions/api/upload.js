import {requireAuth, getCorsHeaders} from './_auth.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB（D1 存 base64 限制）

export async function onRequestOptions(context) {
  return new Response(null, { headers: getCorsHeaders(env) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const userId = await requireAuth(context);
  if (userId instanceof Response) return userId;

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const category = formData.get('category') || 'gallery'; // avatar / avatar_groom / avatar_bride / credits / gallery

    if (!file || !(file instanceof File)) {
      return Response.json({ ok: false, error: '请选择文件' }, { status: 400, headers: getCorsHeaders(env) });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ ok: false, error: '仅支持 JPG/PNG/WebP/GIF 格式' }, { status: 400, headers: getCorsHeaders(env) });
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ ok: false, error: '文件大小不能超过 2MB' }, { status: 400, headers: getCorsHeaders(env) });
    }

    if (!['avatar', 'avatar_groom', 'avatar_bride', 'credits', 'gallery'].includes(category)) {
      return Response.json({ ok: false, error: '无效的图片分类' }, { status: 400, headers: getCorsHeaders(env) });
    }

    // 转 base64（分块处理，避免栈溢出）
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    const base64 = btoa(binary);

    // 获取当前分类的最大排序号
    const maxOrder = await env.DB.prepare(
      'SELECT MAX(sort_order) as max_order FROM images WHERE user_id = ? AND category = ?'
    ).bind(userId, category).first();
    const sortOrder = (maxOrder?.max_order || 0) + 1;

    // 存入 D1
    const result = await env.DB.prepare(
      'INSERT INTO images (user_id, category, r2_key, filename, mime_type, data, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(userId, category, '', file.name, file.type, base64, sortOrder).run();

    return Response.json({
      ok: true,
      message: '上传成功',
      image: {
        id: result.meta.last_row_id,
        category,
        filename: file.name,
        url: `/api/image?id=${result.meta.last_row_id}`,
      }
    }, { headers: getCorsHeaders(env) });

  } catch (err) {
    console.error('Upload error:', err);
    return Response.json({ ok: false, error: '上传失败' }, { status: 500, headers: getCorsHeaders(env) });
  }
}
