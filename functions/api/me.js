import { requireAuth, corsHeaders } from './_auth.js';

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { env } = context;
  const userId = await requireAuth(context);
  if (userId instanceof Response) return userId;

  try {
    const user = await env.DB.prepare(
      'SELECT id, username, couple_name, partner1, partner2, wedding_date, wedding_venue, bgm_url, bgm_data, arrival_options, transport_options, slug FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return Response.json({ ok: false, error: '用户不存在' }, { status: 404, headers: corsHeaders });
    }

    // 获取图片列表
    const { results: images } = await env.DB.prepare(
      'SELECT id, category, filename, sort_order FROM images WHERE user_id = ? ORDER BY category, sort_order'
    ).bind(userId).all();

    // 生成 URL
    const imagesWithUrl = images.map(img => ({
      ...img,
      url: `/api/image?id=${img.id}`,
    }));

    // 获取歌曲/歌词（容错：表可能不存在）
    let songsData = [];
    try {
      const { results: songs } = await env.DB.prepare(
        'SELECT id, song_name, artist, audio_url, audio_data, lyrics, sort_order FROM songs WHERE user_id = ? ORDER BY sort_order'
      ).bind(userId).all();
      songsData = songs.map(s => ({
        id: s.id,
        song_name: s.song_name,
        artist: s.artist,
        audio_url: s.audio_url,
        audio_data: s.audio_data,
        lyrics: JSON.parse(s.lyrics || '[]'),
        sort_order: s.sort_order,
      }));
    } catch (e) {
      // songs table may not exist yet
    }

    return Response.json({ ok: true, user, images: imagesWithUrl, songs: songsData }, { headers: corsHeaders });

  } catch (err) {
    console.error('Me error:', err);
    return Response.json({ ok: false, error: '获取信息失败' }, { status: 500, headers: corsHeaders });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  const userId = await requireAuth(context);
  if (userId instanceof Response) return userId;

  try {
    const body = await request.json();
    const { partner1, partner2, wedding_date, wedding_venue, bgm_url, bgm_data, arrival_options, transport_options } = body;

    if (!partner1 || !partner2) {
      return Response.json({ ok: false, error: '请填写双方姓名' }, { status: 400, headers: corsHeaders });
    }

    const coupleName = `${partner1} & ${partner2}`;
    const arrivalJson = JSON.stringify(arrival_options || []);
    const transportJson = JSON.stringify(transport_options || []);

    // bgm_url: 直链URL / bgm_data: base64数据，优先使用URL
    const finalBgmUrl = bgm_url || '';
    const finalBgmData = bgm_url ? '' : (bgm_data || '');

    await env.DB.prepare(
      `UPDATE users SET partner1 = ?, partner2 = ?, couple_name = ?, wedding_date = ?, wedding_venue = ?, bgm_url = ?, bgm_data = ?, arrival_options = ?, transport_options = ? WHERE id = ?`
    ).bind(
      partner1, partner2, coupleName,
      wedding_date || '', wedding_venue || '',
      finalBgmUrl, finalBgmData,
      arrivalJson, transportJson,
      userId
    ).run();

    return Response.json({ ok: true, message: '保存成功' }, { headers: corsHeaders });

  } catch (err) {
    console.error('Update settings error:', err);
    return Response.json({ ok: false, error: '保存失败' }, { status: 500, headers: corsHeaders });
  }
}
