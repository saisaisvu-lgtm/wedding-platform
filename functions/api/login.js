import { verifyPassword, createToken, setCookie, getCorsHeaders } from './_auth.js';

export async function onRequestOptions(context) {
  return new Response(null, { headers: getCorsHeaders(context.env) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = getCorsHeaders(env);

  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return Response.json({ ok: false, error: '请填写用户名和密码' }, { status: 400, headers: corsHeaders });
    }

    const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
    if (!user) {
      return Response.json({ ok: false, error: '用户名或密码错误' }, { status: 401, headers: corsHeaders });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return Response.json({ ok: false, error: '用户名或密码错误' }, { status: 401, headers: corsHeaders });
    }

    const token = await createToken(user.id, env);

    return Response.json(
      { ok: true, message: '登录成功', slug: user.slug },
      { headers: { ...corsHeaders, 'Set-Cookie': setCookie('session', token) } }
    );

  } catch (err) {
    console.error('Login error:', err);
    return Response.json({ ok: false, error: '登录失败' }, { status: 500, headers: corsHeaders });
  }
}
