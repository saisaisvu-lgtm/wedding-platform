// 歌词搜索API - 通过网易云音乐获取歌词
import {requireAuth, getCorsHeaders} from './_auth.js';

export async function onRequestOptions(context) {
  return new Response(null, { headers: getCorsHeaders(env) });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const userId = await requireAuth(context);
  if (userId instanceof Response) return userId;

  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const trackName = url.searchParams.get('track');
  const artistName = url.searchParams.get('artist');

  try {
    let results = [];
    const searchTerm = trackName ? (trackName + (artistName ? ' ' + artistName : '')) : query;
    if (!searchTerm) {
      return Response.json({ ok: true, results: [] }, { headers: getCorsHeaders(env) });
    }

    // Step 1: Search for songs on Netease Music
    const searchRes = await fetch('https://music.163.com/api/search/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://music.163.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: `s=${encodeURIComponent(searchTerm)}&type=1&limit=5`,
    });

    if (!searchRes.ok) {
      return Response.json({ ok: true, results: [], error: '搜索失败' }, { headers: getCorsHeaders(env) });
    }

    const searchData = await searchRes.json();
    const songs = searchData?.result?.songs || [];

    if (songs.length === 0) {
      return Response.json({ ok: true, results: [] }, { headers: getCorsHeaders(env) });
    }

    // Step 2: Get lyrics for each song
    for (const song of songs.slice(0, 5)) {
      try {
        const lyricRes = await fetch(`https://music.163.com/api/song/lyric?id=${song.id}&lv=1`, {
          headers: {
            'Referer': 'https://music.163.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        let plainLyrics = '';
        let syncedLyrics = '';

        if (lyricRes.ok) {
          const lyricData = await lyricRes.json();
          syncedLyrics = lyricData?.lrc?.lyric || '';
          // Extract plain text from synced lyrics
          if (syncedLyrics) {
            plainLyrics = syncedLyrics
              .split('\n')
              .map(line => line.replace(/^\[\d+:\d+\.\d+\]\s*/, ''))
              .filter(line => line.trim() && !line.match(/^\[.*\]$/))
              .join('\n');
          }
        }

        const artistStr = song.artists?.map(a => a.name).join(', ') || '';

        results.push({
          id: song.id,
          trackName: song.name,
          artistName: artistStr,
          albumName: song.album?.name || '',
          duration: Math.round((song.duration || 0) / 1000),
          plainLyrics,
          syncedLyrics,
          source: 'netease',
        });
      } catch (e) {
        // Skip this song if lyrics fetch fails
      }
    }

    return Response.json({ ok: true, results }, { headers: getCorsHeaders(env) });
  } catch (err) {
    console.error('Lyrics search error:', err);
    return Response.json({ ok: false, error: '搜索失败', results: [] }, { headers: getCorsHeaders(env) });
  }
}
