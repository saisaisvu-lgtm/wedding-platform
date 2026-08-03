// 付款收款码图片接口（公开）
// GET /api/payment-image?type=wechat|alipay

import { getCorsHeaders } from './_auth.js';

export async function onRequestOptions() {
  return new Response(null, { headers: getCorsHeaders(env) });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // wechat or alipay

    if (!type || !['wechat', 'alipay'].includes(type)) {
      return Response.json({ ok: false, error: '无效的类型' }, { status: 400, headers: getCorsHeaders(env) });
    }

    const col = type === 'wechat' ? 'wechat_qr' : 'alipay_qr';
    const settings = await env.DB.prepare(`SELECT ${col} FROM payment_settings WHERE id = 1`).first();

    if (!settings || !settings[col]) {
      return Response.json({ ok: false, error: '收款码未设置' }, { status: 404, headers: getCorsHeaders(env) });
    }

    // 返回 base64 图片数据
    const base64Data = settings[col];

    // 解析 data URL
    let mimeType = 'image/png';
    let raw = base64Data;
    if (base64Data.startsWith('data:')) {
      const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        raw = match[2];
      }
    }

    const binaryStr = atob(raw);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    return new Response(bytes, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': 'https://mylove.sairx.cn',
      }
    });
  } catch (err) {
    console.error('Payment image error:', err);
    return Response.json({ ok: false, error: '获取失败' }, { status: 500, headers: getCorsHeaders(env) });
  }
}
