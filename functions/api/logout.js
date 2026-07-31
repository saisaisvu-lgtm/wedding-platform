export async function onRequestPost() {
  return Response.json(
    { ok: true, message: '已退出登录' },
    { headers: { 'Set-Cookie': 'session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0' } }
  );
}
