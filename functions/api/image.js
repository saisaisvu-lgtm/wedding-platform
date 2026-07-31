// 从 D1 读取图片：/api/image?id=***

export async function onRequest(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response('Missing id', { status: 400 });
    }

    const image = await env.DB.prepare(
      'SELECT mime_type, data FROM images WHERE id = ?'
    ).bind(id).first();

    if (!image || !image.data) {
      return new Response('Image not found', { status: 404 });
    }

    // base64 解码
    const binary = atob(image.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const headers = new Headers();
    headers.set('Content-Type', image.mime_type || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=86400');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(bytes, { headers });

  } catch (err) {
    console.error('Image serve error:', err);
    return new Response('Error', { status: 500 });
  }
}
