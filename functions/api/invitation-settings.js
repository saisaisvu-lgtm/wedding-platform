// 请帖设置 API
// GET  /api/invitation-settings  → 读取当前用户的请帖设置
// PUT  /api/invitation-settings  → 保存请帖设置

import { requireAuth, corsHeaders } from './_auth.js';

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// 读取请帖设置
export async function onRequestGet(context) {
  const { env } = context;
  const userId = await requireAuth(context);
  if (userId instanceof Response) return userId;

  try {
    // 从 users 表读取基础信息
    const user = await env.DB.prepare(
      `SELECT partner1, partner2, partner1_en, partner2_en, couple_name, wedding_date, wedding_venue, theme_color, bgm_url
       FROM users WHERE id = ?`
    ).bind(userId).first();

    if (!user) {
      return Response.json({ ok: false, error: '用户不存在' }, { status: 404, headers: corsHeaders });
    }

    // 从 images 表读取头像
    const avatar = await env.DB.prepare(
      `SELECT data, mime_type FROM images WHERE user_id = ? AND category = 'avatar' ORDER BY sort_order DESC LIMIT 1`
    ).bind(userId).first();

    // 从 images 表读取致谢照
    const credits = await env.DB.prepare(
      `SELECT data, mime_type FROM images WHERE user_id = ? AND category = 'credits' ORDER BY sort_order DESC LIMIT 1`
    ).bind(userId).first();

    // 从 invitation_settings 表读取扩展设置
    let settings = {};
    try {
      const row = await env.DB.prepare(
        `SELECT * FROM invitation_settings WHERE user_id = ?`
      ).bind(userId).first();
      if (row) settings = row;
    } catch {
      // 表可能不存在
    }

    return Response.json({
      ok: true,
      data: {
        partner1: user.partner1 || '',
        partner2: user.partner2 || '',
        partner1_en: user.partner1_en || '',
        partner2_en: user.partner2_en || '',
        couple_name: user.couple_name || '',
        wedding_date: user.wedding_date || '',
        wedding_venue: user.wedding_venue || '',
        theme_color: settings.theme_color || user.theme_color || '#d4af37',
        call_to_action: settings.call_to_action || '快来搂席！',
        married_text: settings.married_text || 'WE ARE MARRIED',
        welcome_title: settings.welcome_title || 'Welcome',
        welcome_text: settings.welcome_text || '',
        love_quote: settings.love_quote || 'Love is life in its fulness',
        invite_text: settings.invite_text || '敬备喜宴 ❤️ 恭候莅临',
        thank_you: settings.thank_you || 'Thank you',
        kids_text: settings.kids_text || 'These two kids are getting married',
        schedule: settings.schedule
          ? JSON.parse(settings.schedule)
          : [
              { time: '4:30', label: '签到合影', icon: '📸' },
              { time: '5:38', label: '仪式', icon: '💍' },
              { time: '6:00', label: '干饭', icon: '🍽️' }
            ],
        venue_address: settings.venue_address || '',
        venue_map_url: settings.venue_map_url || '',
        default_guest_name: settings.default_guest_name || '嘉宾',
        bgm_url: user.bgm_url || settings.bgm_url || '',
        avatar_data: avatar ? `data:${avatar.mime_type};base64,${avatar.data}` : '',
        credits_data: credits ? `data:${credits.mime_type};base64,${credits.data}` : '',
        site_url: env.SITE_URL || ''
      }
    }, { headers: corsHeaders });

  } catch (err) {
    console.error('读取请帖设置失败:', err);
    return Response.json({ ok: false, error: '服务器错误' }, { status: 500, headers: corsHeaders });
  }
}

// 保存请帖设置
export async function onRequestPut(context) {
  const { request, env } = context;
  const userId = await requireAuth(context);
  if (userId instanceof Response) return userId;

  try {
    const body = await request.json();

    // 更新 users 表的基础字段
    await env.DB.prepare(
      `UPDATE users SET
        partner1 = ?, partner2 = ?, partner1_en = ?, partner2_en = ?, couple_name = ?,
        wedding_date = ?, wedding_venue = ?, theme_color = ?
       WHERE id = ?`
    ).bind(
      body.partner1 || '',
      body.partner2 || '',
      body.partner1_en || '',
      body.partner2_en || '',
      body.couple_name || `${body.partner1 || ''} & ${body.partner2 || ''}`,
      body.wedding_date || '',
      body.wedding_venue || '',
      body.theme_color || '#d4af37',
      userId
    ).run();

    // 确保 invitation_settings 表存在
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS invitation_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      call_to_action TEXT NOT NULL DEFAULT '快来搂席！',
      married_text TEXT NOT NULL DEFAULT 'WE ARE MARRIED',
      welcome_title TEXT NOT NULL DEFAULT 'Welcome',
      welcome_text TEXT NOT NULL DEFAULT '',
      love_quote TEXT NOT NULL DEFAULT 'Love is life in its fulness',
      invite_text TEXT NOT NULL DEFAULT '敬备喜宴 ❤️ 恭候莅临',
      thank_you TEXT NOT NULL DEFAULT 'Thank you',
      kids_text TEXT NOT NULL DEFAULT 'These two kids are getting married',
      schedule TEXT NOT NULL DEFAULT '[]',
      venue_address TEXT NOT NULL DEFAULT '',
      venue_map_url TEXT NOT NULL DEFAULT '',
      default_guest_name TEXT NOT NULL DEFAULT '嘉宾',
      bgm_url TEXT NOT NULL DEFAULT '',
      theme_color TEXT NOT NULL DEFAULT '#d4af37',
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`).run();

    // UPSERT 扩展设置
    await env.DB.prepare(
      `INSERT INTO invitation_settings (
        user_id, call_to_action, married_text, welcome_title, welcome_text,
        love_quote, invite_text, thank_you, kids_text,
        schedule, venue_address, venue_map_url, default_guest_name, bgm_url, theme_color, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        call_to_action = excluded.call_to_action,
        married_text = excluded.married_text,
        welcome_title = excluded.welcome_title,
        welcome_text = excluded.welcome_text,
        love_quote = excluded.love_quote,
        invite_text = excluded.invite_text,
        thank_you = excluded.thank_you,
        kids_text = excluded.kids_text,
        schedule = excluded.schedule,
        venue_address = excluded.venue_address,
        venue_map_url = excluded.venue_map_url,
        default_guest_name = excluded.default_guest_name,
        bgm_url = excluded.bgm_url,
        theme_color = excluded.theme_color,
        updated_at = datetime('now')`
    ).bind(
      userId,
      body.call_to_action || '快来搂席！',
      body.married_text || 'WE ARE MARRIED',
      body.welcome_title || 'Welcome',
      body.welcome_text || '',
      body.love_quote || 'Love is life in its fulness',
      body.invite_text || '敬备喜宴 ❤️ 恭候莅临',
      body.thank_you || 'Thank you',
      body.kids_text || 'These two kids are getting married',
      JSON.stringify(body.schedule || []),
      body.venue_address || '',
      body.venue_map_url || '',
      body.default_guest_name || '嘉宾',
      body.bgm_url || '',
      body.theme_color || '#d4af37'
    ).run();

    return Response.json({ ok: true, message: '保存成功' }, { headers: corsHeaders });

  } catch (err) {
    console.error('保存请帖设置失败:', err);
    return Response.json({ ok: false, error: '保存失败' }, { status: 500, headers: corsHeaders });
  }
}
