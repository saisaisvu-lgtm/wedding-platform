// 网易云音乐代理：/api/music?id=***

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id || !/^\d+$/.test(id)) {
    return Response.json({ ok: false, error: '缺少歌曲ID' }, { status: 400 });
  }

  try {
    // 调用网易云公开接口获取播放链接
    const apiUrl = `https://music.163.com/api/song/enhance/player/url?ids=[${id}]&br=320000`;
    const res = await fetch(apiUrl, {
      headers: {
        'Referer': 'https://music.163.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    const data = await res.json();

    if (data.data && data.data[0] && data.data[0].url) {
      return Response.json({
        ok: true,
        url: data.data[0].url,
        type: data.data[0].type || 'mp3',
      });
    }

    return Response.json({ ok: false, error: '无法获取播放链接，可能需要VIP或地区限制' }, { status: 404 });

  } catch (err) {
    console.error('Music proxy error:', err);
    return Response.json({ ok: false, error: '获取失败' }, { status: 500 });
  }
}
