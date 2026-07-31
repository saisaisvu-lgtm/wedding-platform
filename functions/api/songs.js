import { requireAuth, corsHeaders } from './_auth.js';

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// GET - 获取当前用户的歌曲列表
export async function onRequestGet(context) {
  const { env } = context;
  const userId = await requireAuth(context);
  if (userId instanceof Response) return userId;

  try {
    const { results } = await env.DB.prepare(
      'SELECT id, song_name, artist, audio_url, audio_data, lyrics, lyrics_offset, sort_order FROM songs WHERE user_id = ? ORDER BY sort_order'
    ).bind(userId).all();

    const songs = results.map(s => ({
      id: s.id,
      song_name: s.song_name,
      artist: s.artist,
      audio_url: s.audio_url,
      audio_data: s.audio_data,
      lyrics: JSON.parse(s.lyrics || '[]'),
      sort_order: s.sort_order,
    }));

    return Response.json({ ok: true, songs }, { headers: corsHeaders });
  } catch (err) {
    console.error('Songs GET error:', err);
    return Response.json({ ok: false, error: '获取失败' }, { status: 500, headers: corsHeaders });
  }
}

// POST - 新增歌曲
export async function onRequestPost(context) {
  const { request, env } = context;
  const userId = await requireAuth(context);
  if (userId instanceof Response) return userId;

  try {
    const body = await request.json();
    const { song_name, artist, audio_url, audio_data, lyrics } = body;

    if (!song_name) {
      return Response.json({ ok: false, error: '请输入歌名' }, { status: 400, headers: corsHeaders });
    }

    // 获取最大排序号
    const maxOrder = await env.DB.prepare(
      'SELECT MAX(sort_order) as m FROM songs WHERE user_id = ?'
    ).bind(userId).first();
    const sortOrder = (maxOrder?.m || 0) + 1;

    const result = await env.DB.prepare(
      'INSERT INTO songs (user_id, song_name, artist, audio_url, audio_data, lyrics, lyrics_offset, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      userId,
      song_name,
      artist || '',
      audio_url || '',
      audio_data || '',
      JSON.stringify(lyrics || []),
      body.lyrics_offset || 0,
      sortOrder
    ).run();

    return Response.json({
      ok: true,
      song: {
        id: result.meta.last_row_id,
        song_name,
        artist: artist || '',
        audio_url: audio_url || '',
        audio_data: audio_data || '',
        lyrics: lyrics || [],
        sort_order: sortOrder,
      },
    }, { headers: corsHeaders });
  } catch (err) {
    console.error('Songs POST error:', err);
    return Response.json({ ok: false, error: '保存失败' }, { status: 500, headers: corsHeaders });
  }
}

// PUT - 更新歌曲
export async function onRequestPut(context) {
  const { request, env } = context;
  const userId = await requireAuth(context);
  if (userId instanceof Response) return userId;

  try {
    const body = await request.json();
    const { id, song_name, artist, audio_url, audio_data, lyrics } = body;

    if (!id) {
      return Response.json({ ok: false, error: '缺少歌曲ID' }, { status: 400, headers: corsHeaders });
    }

    // 验证所有权
    const existing = await env.DB.prepare(
      'SELECT id FROM songs WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();
    if (!existing) {
      return Response.json({ ok: false, error: '歌曲不存在' }, { status: 404, headers: corsHeaders });
    }

    await env.DB.prepare(
      'UPDATE songs SET song_name = ?, artist = ?, audio_url = ?, audio_data = ?, lyrics = ?, lyrics_offset = ? WHERE id = ?'
    ).bind(
      song_name || '',
      artist || '',
      audio_url || '',
      audio_data || '',
      JSON.stringify(lyrics || []),
      body.lyrics_offset || 0,
      id
    ).run();

    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (err) {
    console.error('Songs PUT error:', err);
    return Response.json({ ok: false, error: '更新失败' }, { status: 500, headers: corsHeaders });
  }
}

// DELETE - 删除歌曲
export async function onRequestDelete(context) {
  const { request, env } = context;
  const userId = await requireAuth(context);
  if (userId instanceof Response) return userId;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return Response.json({ ok: false, error: '缺少歌曲ID' }, { status: 400, headers: corsHeaders });
    }

    await env.DB.prepare(
      'DELETE FROM songs WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run();

    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (err) {
    console.error('Songs DELETE error:', err);
    return Response.json({ ok: false, error: '删除失败' }, { status: 500, headers: corsHeaders });
  }
}
