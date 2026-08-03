import {hashPassword, createToken, setCookie, getCorsHeaders} from './_auth.js';

export async function onRequestOptions(context) {
  return new Response(null, { headers: getCorsHeaders(env) });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { username, password, partner1, partner2, wedding_date, wedding_venue, invite_code } = body;

    // 校验
    if (!username || !password) {
      return Response.json({ ok: false, error: '请填写用户名和密码' }, { status: 400, headers: getCorsHeaders(env) });
    }
    if (!invite_code || typeof invite_code !== 'string' || invite_code.trim().length === 0) {
      return Response.json({ ok: false, error: '请填写邀请码' }, { status: 400, headers: getCorsHeaders(env) });
    }
    if (username.length < 3 || username.length > 30) {
      return Response.json({ ok: false, error: '用户名长度 3-30 个字符' }, { status: 400, headers: getCorsHeaders(env) });
    }
    if (password.length < 6) {
      return Response.json({ ok: false, error: '密码至少 6 个字符' }, { status: 400, headers: getCorsHeaders(env) });
    }
    if (!partner1 || !partner2) {
      return Response.json({ ok: false, error: '请填写双方姓名' }, { status: 400, headers: getCorsHeaders(env) });
    }

    // 生成 slug（用 username 做 URL 友好标识）
    const slug = username.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    // 检查用户名是否已存在
    const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (existing) {
      return Response.json({ ok: false, error: '用户名已存在' }, { status: 409, headers: getCorsHeaders(env) });
    }

    // 检查 slug 是否冲突
    const slugExists = await env.DB.prepare('SELECT id FROM users WHERE slug = ?').bind(slug).first();
    if (slugExists) {
      return Response.json({ ok: false, error: '用户名已被占用，请换一个' }, { status: 409, headers: getCorsHeaders(env) });
    }

    // 验证邀请码
    const code = invite_code.trim().toUpperCase();
    const inviteRow = await env.DB.prepare('SELECT id, used_by FROM invite_codes WHERE code = ?').bind(code).first();
    if (!inviteRow) {
      return Response.json({ ok: false, error: '邀请码无效' }, { status: 400, headers: getCorsHeaders(env) });
    }
    if (inviteRow.used_by) {
      return Response.json({ ok: false, error: '邀请码已被使用' }, { status: 400, headers: getCorsHeaders(env) });
    }

    const passwordHash = await hashPassword(password);
    const coupleName = `${partner1} & ${partner2}`;

    // 生成6位随机参与码（纯数字，不重复）
    let participationCode = '';
    let codeAttempts = 0;
    do {
      participationCode = String(Math.floor(100000 + Math.random() * 900000));
      codeAttempts++;
    } while (codeAttempts < 20 && await env.DB.prepare('SELECT id FROM users WHERE participation_code = ?').bind(participationCode).first());

    const result = await env.DB.prepare(
      `INSERT INTO users (username, password_hash, couple_name, partner1, partner2, wedding_date, wedding_venue, slug, participation_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(username, passwordHash, coupleName, partner1 || '', partner2 || '', wedding_date || '', wedding_venue || '', slug, participationCode).run();

    const userId = result.meta.last_row_id;
    const token = await createToken(userId, env);

    // 标记邀请码已使用
    await env.DB.prepare('UPDATE invite_codes SET used_by = ?, used_at = datetime(\'now\') WHERE id = ?').bind(userId, inviteRow.id).run();

    return Response.json(
      { ok: true, message: '注册成功！', slug },
      { status: 201, headers: { ...getCorsHeaders(env), 'Set-Cookie': setCookie('session', token) } }
    );

  } catch (err) {
    console.error('Register error:', err);
    return Response.json({ ok: false, error: '注册失败，请稍后重试' }, { status: 500, headers: getCorsHeaders(env) });
  }
}
