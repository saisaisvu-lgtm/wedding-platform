// 付款设置接口（超级管理员）
// GET    /api/payment?key=***              — 获取当前付款设置
// PUT    /api/payment?key=***              — 更新付款设置（价格、收款码、联系方式）

import { corsHeaders } from './_auth.js';

function checkAdmin(request, env) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key || key !== env.ADMIN_KEY) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }
  return null;
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// 获取付款设置
export async function onRequestGet(context) {
  const { request, env } = context;

  // 管理员可以看完整数据（含 base64），普通用户只看是否有码
  const url = new URL(request.url);
  const adminKey = url.searchParams.get('key');
  const isAdmin = adminKey && adminKey === env.ADMIN_KEY;

  try {
    // 确保表存在
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS payment_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        price REAL NOT NULL DEFAULT 9.9,
        price_desc TEXT NOT NULL DEFAULT '注册码单价',
        wechat_qr TEXT NOT NULL DEFAULT '',
        alipay_qr TEXT NOT NULL DEFAULT '',
        contact_info TEXT NOT NULL DEFAULT '',
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `).run();

    let settings = await env.DB.prepare('SELECT * FROM payment_settings WHERE id = 1').first();

    if (!settings) {
      // 初始化默认设置
      await env.DB.prepare(
        'INSERT INTO payment_settings (id, price, price_desc, wechat_qr, alipay_qr, contact_info) VALUES (1, 9.9, \'注册码单价\', \'\', \'\', \'\')'
      ).run();
      settings = { id: 1, price: 9.9, price_desc: '注册码单价', wechat_qr: '', alipay_qr: '', contact_info: '', updated_at: null };
    }

    if (isAdmin) {
      // 管理员返回完整数据
      return Response.json({ ok: true, settings }, { headers: corsHeaders });
    } else {
      // 公开接口：只返回是否有收款码、价格、联系方式
      return Response.json({
        ok: true,
        settings: {
          price: settings.price,
          price_desc: settings.price_desc,
          has_wechat: !!settings.wechat_qr,
          has_alipay: !!settings.alipay_qr,
          contact_info: settings.contact_info,
        }
      }, { headers: corsHeaders });
    }
  } catch (err) {
    console.error('Payment get error:', err);
    return Response.json({ ok: false, error: '获取失败' }, { status: 500, headers: corsHeaders });
  }
}

// 更新付款设置
export async function onRequestPut(context) {
  const { request, env } = context;
  const authErr = checkAdmin(request, env);
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const { price, price_desc, wechat_qr, alipay_qr, contact_info } = body;

    // 确保表存在
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS payment_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        price REAL NOT NULL DEFAULT 9.9,
        price_desc TEXT NOT NULL DEFAULT '注册码单价',
        wechat_qr TEXT NOT NULL DEFAULT '',
        alipay_qr TEXT NOT NULL DEFAULT '',
        contact_info TEXT NOT NULL DEFAULT '',
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // 先查询是否存在
    const existing = await env.DB.prepare('SELECT id FROM payment_settings WHERE id = 1').first();

    if (existing) {
      // 更新
      const updates = [];
      const values = [];
      if (price !== undefined) { updates.push('price = ?'); values.push(parseFloat(price) || 9.9); }
      if (price_desc !== undefined) { updates.push('price_desc = ?'); values.push(price_desc); }
      if (wechat_qr !== undefined) { updates.push('wechat_qr = ?'); values.push(wechat_qr); }
      if (alipay_qr !== undefined) { updates.push('alipay_qr = ?'); values.push(alipay_qr); }
      if (contact_info !== undefined) { updates.push('contact_info = ?'); values.push(contact_info); }
      updates.push("updated_at = datetime('now')");

      if (updates.length > 1) {
        await env.DB.prepare(
          `UPDATE payment_settings SET ${updates.join(', ')} WHERE id = 1`
        ).bind(...values).run();
      }
    } else {
      // 插入
      await env.DB.prepare(
        'INSERT INTO payment_settings (id, price, price_desc, wechat_qr, alipay_qr, contact_info) VALUES (1, ?, ?, ?, ?, ?)'
      ).bind(
        parseFloat(price) || 9.9,
        price_desc || '注册码单价',
        wechat_qr || '',
        alipay_qr || '',
        contact_info || ''
      ).run();
    }

    return Response.json({ ok: true, message: '付款设置已更新' }, { headers: corsHeaders });
  } catch (err) {
    console.error('Payment update error:', err);
    return Response.json({ ok: false, error: '更新失败' }, { status: 500, headers: corsHeaders });
  }
}
