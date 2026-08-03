// Bark action 回调接口（返回纯文本给 Bark 显示）
// GET /api/bark-action?id=X&key=***&act=confirm
// GET /api/bark-action?id=X&key=***&act=reject

import { getCorsHeaders } from './_auth.js';

export async function onRequest(context) {
  const { env } = context;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  const key = url.searchParams.get('key');
  const act = url.searchParams.get('act');

  if (!key || key !== env.ADMIN_KEY) {
    return new Response('❌ 密钥无效', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  if (!id) {
    return new Response('❌ 缺少订单ID', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  try {
    const order = await env.DB.prepare('SELECT * FROM purchase_orders WHERE id = ?').bind(id).first();

    if (!order) {
      return new Response(`❌ 订单#${id}不存在`, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    if (order.status === 'confirmed') {
      return new Response(`✅ 订单#${id}已确认\n邀请码：${order.invite_code}`, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    if (order.status === 'rejected') {
      return new Response(`❌ 订单#${id}已拒绝`, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // 拒绝
    if (act === 'reject') {
      await env.DB.prepare(
        "UPDATE purchase_orders SET status = 'rejected', updated_at = datetime('now') WHERE id = ?"
      ).bind(id).run();

      return new Response(`❌ 已拒绝订单#${id}\n${order.contact}`, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // 确认 — 生成邀请码
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    let attempts = 0;
    do {
      code = '';
      for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
      attempts++;
    } while (attempts < 10 && await env.DB.prepare('SELECT id FROM invite_codes WHERE code = ?').bind(code).first());

    const codeExists = await env.DB.prepare('SELECT id FROM invite_codes WHERE code = ?').bind(code).first();
    if (!codeExists) {
      await env.DB.prepare('INSERT INTO invite_codes (code) VALUES (?)').bind(code).run();
    }

    await env.DB.prepare(
      "UPDATE purchase_orders SET status = 'confirmed', invite_code = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(code, id).run();

    return new Response(`✅ 已确认订单#${id}\n${order.contact} · ¥${order.amount}\n邀请码：${code}`, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (err) {
    return new Response(`❌ 系统错误：${err.message}`, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
