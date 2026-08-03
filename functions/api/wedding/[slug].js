// 公开接口：获取某个婚礼页面的数据（无需登录）
// 包含请帖设置 + 图片 + 歌曲

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://mylove.sairx.cn',
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
      'SELECT id, couple_name, partner1, partner2, partner1_en, partner2_en, wedding_date, wedding_venue, theme_color, bgm_url, bgm_data, arrival_options, transport_options, slug FROM users WHERE slug = ?'
    ).bind(slug).first();

    if (!user) {
      return Response.json({ ok: false, error: '婚礼页面不存在' }, { status: 404, headers: corsHeaders });
    }

    // 获取图片
    const { results: images } = await env.DB.prepare(
      'SELECT id, category, filename, sort_order FROM images WHERE user_id = ? ORDER BY category, sort_order'
    ).bind(user.id).all();

    const imagesWithUrl = images.map(img => ({
      ...img,
      url: `/api/image?id=${img.id}`,
    }));

    // 获取歌曲/歌词
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

    // 获取请帖扩展设置
    let invitationSettings = {};
    try {
      const row = await env.DB.prepare(
        `SELECT * FROM invitation_settings WHERE user_id = ?`
      ).bind(user.id).first();
      if (row) invitationSettings = row;
    } catch {
      // 表可能不存在
    }

    // 获取头像 base64（供请帖直接使用）
    const avatar = await env.DB.prepare(
      'SELECT data, mime_type FROM images WHERE user_id = ? AND category = ? ORDER BY sort_order DESC LIMIT 1'
    ).bind(user.id, 'avatar').first();

    return Response.json({
      ok: true,
      wedding: {
        couple_name: user.couple_name,
        partner1: user.partner1,
        partner2: user.partner2,
        partner1_en: user.partner1_en || '',
        partner2_en: user.partner2_en || '',
        wedding_date: user.wedding_date,
        wedding_venue: user.wedding_venue,
        theme_color: user.theme_color || invitationSettings.theme_color || '#d4af37',
        bgm_url: user.bgm_url || '',
        bgm_data: user.bgm_data || '',
        arrival_options: JSON.parse(user.arrival_options || '[]'),
        transport_options: JSON.parse(user.transport_options || '[]'),
      },
      // 请帖扩展设置
      invitation: {
        call_to_action: invitationSettings.call_to_action || '快来搂席！',
        married_text: invitationSettings.married_text || 'WE ARE MARRIED',
        welcome_title: invitationSettings.welcome_title || 'Welcome',
        welcome_text: invitationSettings.welcome_text || '',
        love_quote: invitationSettings.love_quote || 'Love is life in its fulness',
        invite_text: invitationSettings.invite_text || '敬备喜宴 ❤️ 恭候莅临',
        thank_you: invitationSettings.thank_you || 'Thank you',
        kids_text: invitationSettings.kids_text || 'These two kids are getting married',
        schedule: invitationSettings.schedule
          ? JSON.parse(invitationSettings.schedule)
          : [
              { time: '4:30', label: '签到合影', icon: '📸' },
              { time: '5:38', label: '仪式', icon: '💍' },
              { time: '6:00', label: '干饭', icon: '🍽️' }
            ],
        venue_address: invitationSettings.venue_address || '',
        venue_map_url: invitationSettings.venue_map_url || '',
        default_guest_name: invitationSettings.default_guest_name || '嘉宾',
      },
      // 头像 base64
      avatar_data: avatar ? `data:${avatar.mime_type};base64,${avatar.data}` : '',
      images: {
        avatars: imagesWithUrl.filter(i => i.category === 'avatar'),
        credits: imagesWithUrl.filter(i => i.category === 'credits'),
        gallery: imagesWithUrl.filter(i => i.category === 'gallery'),
      },
      songs: songsData,
      site_url: env.SITE_URL || '',
    }, { headers: corsHeaders });

  } catch (err) {
    console.error('Wedding page error:', err);
    return Response.json({ ok: false, error: '加载失败' }, { status: 500, headers: corsHeaders });
  }
}
