// POST /api/rsvp — 宾客提交回执（无需登录，通过 slug 关联婚礼）

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://mylove.sairx.cn',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { slug, name, phone, guests, arrival_time, transport, message } = body;

    if (!slug) {
      return Response.json({ ok: false, error: '缺少婚礼标识' }, { status: 400, headers: corsHeaders });
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return Response.json({ ok: false, error: '请填写姓名' }, { status: 400, headers: corsHeaders });
    }
    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      return Response.json({ ok: false, error: '请填写联系电话' }, { status: 400, headers: corsHeaders });
    }

    const guestCount = parseInt(guests) || 1;
    if (guestCount < 1 || guestCount > 20) {
      return Response.json({ ok: false, error: '人数不合法' }, { status: 400, headers: corsHeaders });
    }

    // 查找婚礼所属用户
    const user = await env.DB.prepare('SELECT id FROM users WHERE slug = ?').bind(slug).first();
    if (!user) {
      return Response.json({ ok: false, error: '婚礼页面不存在' }, { status: 404, headers: corsHeaders });
    }

    // 生成6位随机参与码（纯数字）
    let participationCode = '';
    let codeAttempts = 0;
    do {
      participationCode = String(Math.floor(100000 + Math.random() * 900000));
      codeAttempts++;
    } while (codeAttempts < 20 && await env.DB.prepare('SELECT id FROM rsvp WHERE wedding_user_id = ? AND participation_code = ?').bind(user.id, participationCode).first());

    await env.DB.prepare(
      `INSERT INTO rsvp (wedding_user_id, name, phone, guests, arrival_time, transport, message, participation_code, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      user.id,
      name.trim(),
      phone.trim(),
      guestCount,
      (arrival_time || '').trim(),
      (transport || '').trim(),
      (message || '').trim(),
      participationCode
    ).run();

    return Response.json({
      ok: true,
      message: '感谢您的回复，期待与您相聚！🎉',
      participation_code: participationCode,
    }, { headers: corsHeaders });

  } catch (err) {
    console.error('RSVP error:', err);
    return Response.json({ ok: false, error: '提交失败，请稍后重试' }, { status: 500, headers: corsHeaders });
  }
}
