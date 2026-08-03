// 通用认证工具 — 所有 API 共用

// 简单 HMAC-SHA256 签名的 JWT 替代方案
// ⚠️ 必须通过环境变量 SESSION_SECRET 设置密钥

export function getCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name, value, maxAge = 86400 * 7) {
  return `${name}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${maxAge}`;
}

export async function createToken(userId, env) {
  const secret = env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET not configured');
  const payload = JSON.stringify({ uid: userId, exp: Date.now() + 7 * 86400 * 1000 });
  const encoded = btoa(payload);
  const sig = await hmacSign(encoded, secret);
  return `${encoded}.${sig}`;
}

export async function verifyToken(token, env) {
  if (!token) return null;
  const secret = env.SESSION_SECRET;
  if (!secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = await hmacSign(encoded, secret);
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(atob(encoded));
    if (payload.exp < Date.now()) return null;
    return payload.uid;
  } catch {
    return null;
  }
}

async function hmacSign(data, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function hashPassword(password) {
  // PBKDF2 + 随机盐，防彩虹表
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password),
    { name: 'PBKDF2' }, false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const hashArray = new Uint8Array(bits);
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...hashArray));
  return `${saltB64}:${hashB64}`;
}

export async function verifyPassword(password, stored) {
  // 兼容旧格式（纯 SHA-256）和新格式（PBKDF2）
  if (stored.includes(':')) {
    // 新格式: salt:hash
    const [saltB64, hashB64] = stored.split(':');
    const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', encoder.encode(password),
      { name: 'PBKDF2' }, false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial, 256
    );
    const hashArray = new Uint8Array(bits);
    const newHashB64 = btoa(String.fromCharCode(...hashArray));
    return newHashB64 === hashB64;
  }
  // 旧格式兼容: 纯 SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const oldHash = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return oldHash === stored;
}

export async function requireAuth(context) {
  const { request, env } = context;
  const token = getCookie(request, 'session');
  const userId = await verifyToken(token, env);
  if (!userId) {
    return Response.json({ ok: false, error: '请先登录' }, { status: 401 });
  }
  return userId;
}

export function getCorsHeaders(env) {
  const origin = env.SITE_URL || 'https://mylove.sairx.cn';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// 兼容旧引用
export function corsHeaders(env) {
  return getCorsHeaders(env);
}
