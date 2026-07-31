// 购买订单接口
// POST /api/order              — 用户提交购买订单（无需登录）
// GET  /api/order?key=***      — 管理员查看所有订单
// PUT  /api/order?key=***      — 管理员更新订单状态（发放邀请码）
// DELETE /api/order?key=***&id=X — 管理员删除订单

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

// 公开查询订单状态（无需登录，用于前端轮询）
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 如果带 key 参数则走管理员逻辑
  const key = url.searchParams.get('key');
  if (key) {
    // 管理员查看所有订单
    const authErr = checkAdmin(request, env);
    if (authErr) return authErr;

    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS purchase_orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          contact TEXT NOT NULL DEFAULT '',
          contact_type TEXT NOT NULL DEFAULT 'wechat',
          amount REAL NOT NULL DEFAULT 0,
          invite_code TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'pending',
          note TEXT NOT NULL DEFAULT '',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `).run();

      const status = url.searchParams.get('status');
      let query = 'SELECT * FROM purchase_orders';
      let params = [];
      if (status && ['pending', 'confirmed', 'rejected'].includes(status)) {
        query += ' WHERE status = ?';
        params.push(status);
      }
      query += ' ORDER BY created_at DESC';
      const { results: orders } = await env.DB.prepare(query).bind(...params).all();
      const allOrders = await env.DB.prepare('SELECT status, COUNT(*) as c FROM purchase_orders GROUP BY status').all();
      const stats = { total: orders.length, pending: 0, confirmed: 0, rejected: 0 };
      if (allOrders.results) {
        allOrders.results.forEach(r => { stats[r.status] = r.c; stats.total += r.c; });
      }
      return Response.json({ ok: true, orders, stats }, { headers: corsHeaders });
    } catch (err) {
      console.error('Order list error:', err);
      return Response.json({ ok: false, error: '获取失败' }, { status: 500, headers: corsHeaders });
    }
  }

  // 无 key 参数：公开查询单个订单状态（前端轮询用）
  const orderId = url.searchParams.get('id');
  if (!orderId) {
    return Response.json({ ok: false, error: '缺少订单 ID' }, { status: 400, headers: corsHeaders });
  }

  try {
    const order = await env.DB.prepare(
      'SELECT id, status, invite_code FROM purchase_orders WHERE id = ?'
    ).bind(orderId).first();

    if (!order) {
      return Response.json({ ok: false, error: '订单不存在' }, { status: 404, headers: corsHeaders });
    }

    return Response.json({
      ok: true,
      status: order.status,
      invite_code: order.invite_code || '',
    }, { headers: corsHeaders });
  } catch (err) {
    console.error('Order status error:', err);
    return Response.json({ ok: false, error: '查询失败' }, { status: 500, headers: corsHeaders });
  }
}

// 用户提交购买订单
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { contact, contact_type, amount, note } = body;

    if (!contact || typeof contact !== 'string' || contact.trim().length === 0) {
      return Response.json({ ok: false, error: '请填写联系方式' }, { status: 400, headers: corsHeaders });
    }

    const validTypes = ['wechat', 'alipay', 'other'];
    const type = validTypes.includes(contact_type) ? contact_type : 'wechat';

    // 获取当前价格
    let price = 9.9;
    try {
      const settings = await env.DB.prepare('SELECT price FROM payment_settings WHERE id = 1').first();
      if (settings) price = settings.price;
    } catch (e) { /* 表可能不存在，用默认价 */ }

    const orderAmount = parseFloat(amount) || price;

    // 确保表存在
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact TEXT NOT NULL DEFAULT '',
        contact_type TEXT NOT NULL DEFAULT 'wechat',
        amount REAL NOT NULL DEFAULT 0,
        invite_code TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        note TEXT NOT NULL DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `).run();

    const result = await env.DB.prepare(
      `INSERT INTO purchase_orders (contact, contact_type, amount, note, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))`
    ).bind(contact.trim(), type, orderAmount, (note || '').trim()).run();

    // Bark 推送通知管理员（带确认/拒绝按钮）
    const methodMap = { wechat: '微信', alipay: '支付宝', other: '其他' };
    const barkKey = env.BARK_KEY || '';
    if (barkKey) {
      const siteUrl = env.SITE_URL || 'https://mylove.sairx.cn';
      const adminKey = env.ADMIN_KEY || '';
      const orderId = result.meta.last_row_id;
      const title = `新订单 #${orderId} ¥${orderAmount}`;
      const body = `${methodMap[type]} · ${contact.trim()}${note ? '\n备注：' + note : ''}\n\n👇 点击确认发放邀请码`;
      const confirmPageUrl = `${siteUrl}/api/confirm-order?id=${orderId}&key=${encodeURIComponent(adminKey)}`;
      try {
        const barkRes = await fetch('https://api.day.app/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            device_key: barkKey,
            title,
            body,
            sound: 'minuet',
            group: 'wedding-order',
            url: confirmPageUrl,
            isArchive: 1,
          }),
        });
        const barkData = await barkRes.text();
        console.log('Bark response:', barkRes.status, barkData);
        if (!barkRes.ok) console.error('Bark failed:', barkRes.status, barkData);
      } catch (e) { console.error('Bark push error:', e); }
    } else {
      console.warn('BARK_KEY not set, skipping notification');
    }

    return Response.json({
      ok: true,
      message: '订单已提交！管理员确认付款后会通过您留的联系方式发送邀请码。',
      order_id: result.meta.last_row_id,
    }, { headers: corsHeaders });

  } catch (err) {
    console.error('Order create error:', err);
    return Response.json({ ok: false, error: '提交失败，请稍后重试' }, { status: 500, headers: corsHeaders });
  }
}



// 管理员更新订单（发放邀请码 / 拒绝）
export async function onRequestPut(context) {
  const { request, env } = context;
  const authErr = checkAdmin(request, env);
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const { id, status, invite_code } = body;

    if (!id) {
      return Response.json({ ok: false, error: '缺少订单 ID' }, { status: 400, headers: corsHeaders });
    }

    const order = await env.DB.prepare('SELECT * FROM purchase_orders WHERE id = ?').bind(id).first();
    if (!order) {
      return Response.json({ ok: false, error: '订单不存在' }, { status: 404, headers: corsHeaders });
    }

    if (status === 'confirmed') {
      // 确认并发放邀请码
      let code = invite_code ? invite_code.trim().toUpperCase() : '';

      if (!code) {
        // 自动生成邀请码
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let attempts = 0;
        do {
          code = '';
          for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
          attempts++;
        } while (attempts < 10 && await env.DB.prepare('SELECT id FROM invite_codes WHERE code = ?').bind(code).first());
      } else {
        // 检查管理员指定的码是否已存在
        const exists = await env.DB.prepare('SELECT id, used_by FROM invite_codes WHERE code = ?').bind(code).first();
        if (exists && exists.used_by) {
          return Response.json({ ok: false, error: '该邀请码已被使用' }, { status: 400, headers: corsHeaders });
        }
        if (!exists) {
          // 如果不存在就创建
          await env.DB.prepare('INSERT INTO invite_codes (code) VALUES (?)').bind(code).run();
        }
      }

      // 确保邀请码存在
      const codeExists = await env.DB.prepare('SELECT id FROM invite_codes WHERE code = ?').bind(code).first();
      if (!codeExists) {
        await env.DB.prepare('INSERT INTO invite_codes (code) VALUES (?)').bind(code).run();
      }

      await env.DB.prepare(
        "UPDATE purchase_orders SET status = 'confirmed', invite_code = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(code, id).run();

      // Bark 推送确认通知
      const barkKey2 = env.BARK_KEY || '';
      if (barkKey2) {
        try {
          const barkRes2 = await fetch('https://api.day.app/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              device_key: barkKey2,
              title: `订单已确认 #${id}`,
              body: `邀请码 ${code} 已发放给 ${order.contact}`,
              sound: 'minuet',
              group: 'wedding-order',
            }),
          });
          console.log('Bark confirm response:', barkRes2.status);
        } catch (e) { console.error('Bark confirm error:', e); }
      }

      return Response.json({
        ok: true,
        message: `订单已确认，邀请码：${code}`,
        invite_code: code,
      }, { headers: corsHeaders });

    } else if (status === 'rejected') {
      await env.DB.prepare(
        "UPDATE purchase_orders SET status = 'rejected', updated_at = datetime('now') WHERE id = ?"
      ).bind(id).run();

      return Response.json({ ok: true, message: '订单已拒绝' }, { headers: corsHeaders });

    } else {
      return Response.json({ ok: false, error: '无效的状态' }, { status: 400, headers: corsHeaders });
    }

  } catch (err) {
    console.error('Order update error:', err);
    return Response.json({ ok: false, error: '操作失败' }, { status: 500, headers: corsHeaders });
  }
}

// 管理员删除订单
export async function onRequestDelete(context) {
  const { request, env } = context;
  const authErr = checkAdmin(request, env);
  if (authErr) return authErr;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return Response.json({ ok: false, error: '缺少 ID' }, { status: 400, headers: corsHeaders });

    await env.DB.prepare('DELETE FROM purchase_orders WHERE id = ?').bind(id).run();
    return Response.json({ ok: true, message: '删除成功' }, { headers: corsHeaders });
  } catch (err) {
    console.error('Order delete error:', err);
    return Response.json({ ok: false, error: '删除失败' }, { status: 500, headers: corsHeaders });
  }
}
