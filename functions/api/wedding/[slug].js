// 公开接口：获取某个婚礼页面的数据（无需登录）

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { params, env } = context;
  const { slug } = params;

  try {
    const user = await env.DB.prepare(
      'SELECT id, couple_name, partner1, partner2, wedding_date, wedding_venue, bgm_url, bgm_data, arrival_options, transport_options, slug, participation_code FROM users WHERE slug = ?'
    ).bind(slug).first();

    if (!user) {
      return Response.json({ ok: false, error: '婚礼页面不存在' }, { status: 404, headers: corsHeaders });
    }

    // 获取图片
    const { results: images } = await env.DB.prepare(
      'SELECT id, category, filename, sort_order FROM images WHERE user_id = ? ORDER BY category, sort_order'
    ).bind(user.id).all();

    // 为图片生成访问 URL
    const imagesWithUrl = images.map(img => ({
      ...img,
      url: `/api/image?id=${img.id}`,
    }));

    // 获取歌曲/歌词（容错：表可能不存在）
    let songsData = [];
    try {
      const { results: songs } = await env.DB.prepare(
        'SELECT id, song_name, artist, audio_url, audio_data, lyrics, lyrics_offset, sort_order FROM songs WHERE user_id = ? ORDER BY sort_order'
      ).bind(user.id).all();
      songsData = songs.map(s => ({
        id: s.id,
        song_name: s.song_name,
        artist: s.artist,
        audio_url: s.audio_url,
        audio_data: s.audio_data,
        lyrics: JSON.parse(s.lyrics || '[]'),
        lyrics_offset: s.lyrics_offset || 0,
        sort_order: s.sort_order,
      }));
    } catch (e) {}

    return Response.json({
      ok: true,
      wedding: {
        couple_name: user.couple_name,
        partner1: user.partner1,
        partner2: user.partner2,
        wedding_date: user.wedding_date,
        wedding_venue: user.wedding_venue,
        bgm_url: user.bgm_url || '',
        bgm_data: user.bgm_data || '',
        arrival_options: JSON.parse(user.arrival_options || '[]'),
        transport_options: JSON.parse(user.transport_options || '[]'),
        participation_code: user.participation_code || '',
      },
      images: {
        avatars: imagesWithUrl.filter(i => i.category === 'avatar'),
        credits: imagesWithUrl.filter(i => i.category === 'credits'),
        gallery: imagesWithUrl.filter(i => i.category === 'gallery'),
      },
      songs: songsData,
    }, { headers: corsHeaders });

  } catch (err) {
    console.error('Wedding page error:', err);
    return Response.json({ ok: false, error: '加载失败' }, { status: 500, headers: corsHeaders });
  }
}
