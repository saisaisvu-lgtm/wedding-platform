// 订单确认页面（从 Bark 点击跳转）
// 无 action 参数 → 显示确认/拒绝按钮
// action=confirm → 执行确认
// action=reject → 执行拒绝

export async function onRequest(context) {
  const { env } = context;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  const key = url.searchParams.get('key');
  const action = url.searchParams.get('action');

  if (!key || key !== env.ADMIN_KEY) {
    return new Response(errorPage('验证失败', '管理密钥无效'), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (!id) {
    return new Response(errorPage('参数错误', '缺少订单 ID'), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  try {
    const order = await env.DB.prepare('SELECT * FROM purchase_orders WHERE id = ?').bind(id).first();

    if (!order) {
      return new Response(errorPage('订单不存在', `订单 #${id} 不存在`), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (order.status !== 'pending') {
      // 已处理，显示结果
      const isConfirmed = order.status === 'confirmed';
      return new Response(resultPage(
        isConfirmed ? '✅ 订单已确认' : '❌ 订单已拒绝',
        `订单 #${id} · ${order.contact}`,
        isConfirmed ? order.invite_code : '',
        isConfirmed,
        key
      ), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // 有 action 参数则执行操作
    if (action === 'confirm') {
      return await doConfirm(env, order, id, key);
    }
    if (action === 'reject') {
      return await doReject(env, order, id, key);
    }

    // 无 action → 显示确认页面（带两个按钮）
    return new Response(confirmPage(order, id, key), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });

  } catch (err) {
    return new Response(errorPage('系统错误', err.message), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

async function doConfirm(env, order, id, key) {
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

  return new Response(resultPage(
    '✅ 确认成功！',
    `订单 #${id} · ${order.contact} · ¥${order.amount}`,
    code, true, key
  ), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

async function doReject(env, order, id, key) {
  await env.DB.prepare(
    "UPDATE purchase_orders SET status = 'rejected', updated_at = datetime('now') WHERE id = ?"
  ).bind(id).run();

  return new Response(resultPage(
    '❌ 已拒绝',
    `订单 #${id} · ${order.contact} · ¥${order.amount}`,
    '', false, key
  ), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function confirmPage(order, id, key) {
  const methodMap = { wechat: '📱 微信支付', alipay: '💳 支付宝', other: '💰 其他' };
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>订单确认 #${id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:linear-gradient(160deg,#1a1210 0%,#2a1f18 40%,#1a1510 100%);color:#f0e6d2;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{max-width:420px;width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(212,175,55,0.25);border-radius:20px;padding:36px 28px;text-align:center;backdrop-filter:blur(10px);box-shadow:0 8px 40px rgba(0,0,0,0.3)}
.xi{font-size:42px;color:#d4af37;margin-bottom:4px;text-shadow:0 0 20px rgba(212,175,55,0.2)}
.title{font-size:13px;color:rgba(212,175,55,0.6);letter-spacing:0.3em;margin-bottom:20px}
.divider{width:60px;height:1px;background:linear-gradient(90deg,transparent,#d4af37,transparent);margin:0 auto 20px}
.info-card{background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.15);border-radius:12px;padding:20px;margin-bottom:24px}
.order-id{font-size:12px;color:rgba(212,175,55,0.5);letter-spacing:0.1em;margin-bottom:12px}
.method{font-size:14px;color:rgba(255,245,220,0.7);margin-bottom:8px}
.contact{font-size:16px;color:#f0e6d2;font-weight:600;margin-bottom:12px}
.amount{font-size:36px;font-weight:700;color:#d4af37;line-height:1}
.amount .unit{font-size:16px;font-weight:400;color:rgba(212,175,55,0.6)}
.note{font-size:12px;color:rgba(255,245,220,0.4);margin-top:8px;font-style:italic}
.btns{display:flex;gap:12px;margin-top:8px}
.btn{flex:1;padding:16px;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all 0.25s;letter-spacing:0.05em}
.btn:active{transform:scale(0.96)}
.btn-confirm{background:linear-gradient(135deg,rgba(46,125,50,0.3),rgba(46,125,50,0.15));border:1px solid rgba(46,125,50,0.5);color:#8f8}
.btn-confirm:hover{background:linear-gradient(135deg,rgba(46,125,50,0.45),rgba(46,125,50,0.25));box-shadow:0 4px 20px rgba(46,125,50,0.2)}
.btn-reject{background:rgba(196,30,58,0.12);border:1px solid rgba(196,30,58,0.3);color:#e88}
.btn-reject:hover{background:rgba(196,30,58,0.2);box-shadow:0 4px 20px rgba(196,30,58,0.15)}
.footer{margin-top:24px;font-size:11px;color:rgba(255,245,220,0.2);letter-spacing:0.05em}
</style>
</head>
<body>
<div class="card">
  <div class="xi">囍</div>
  <div class="title">订单确认</div>
  <div class="divider"></div>
  <div class="info-card">
    <div class="order-id">订单编号 #${id}</div>
    <div class="method">${methodMap[order.contact_type] || order.contact_type}</div>
    <div class="contact">${order.contact}</div>
    <div class="amount">¥${order.amount}</div>
    ${order.note ? `<div class="note">备注：${order.note}</div>` : ''}
  </div>
  <div class="btns">
    <button class="btn btn-confirm" onclick="location.href='/api/confirm-order?id=${id}&key=${key}&action=confirm'">✅ 确认发放</button>
    <button class="btn btn-reject" onclick="location.href='/api/confirm-order?id=${id}&key=${key}&action=reject'">❌ 拒绝</button>
  </div>
  <div class="footer">光影婚礼墙 · 请确认收款后再发放邀请码</div>
</div>
</body>
</html>`;
}

function resultPage(title, info, code, isSuccess, key) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:linear-gradient(160deg,#1a1210 0%,#2a1f18 40%,#1a1510 100%);color:#f0e6d2;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{max-width:420px;width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(212,175,55,0.25);border-radius:20px;padding:36px 28px;text-align:center;backdrop-filter:blur(10px);box-shadow:0 8px 40px rgba(0,0,0,0.3)}
.xi{font-size:42px;color:#d4af37;margin-bottom:4px;text-shadow:0 0 20px rgba(212,175,55,0.2)}
.icon{font-size:48px;margin-bottom:8px}
.title{font-size:20px;color:${isSuccess ? '#8f8' : '#e88'};margin-bottom:8px;font-weight:600}
.info{font-size:14px;color:rgba(255,245,220,0.6);line-height:1.8;margin-bottom:16px}
.divider{width:60px;height:1px;background:linear-gradient(90deg,transparent,#d4af37,transparent);margin:16px auto}
.code-box{background:rgba(46,125,50,0.1);border:1.5px solid rgba(46,125,50,0.35);border-radius:14px;padding:20px;margin:16px auto;max-width:280px}
.code-label{font-size:11px;color:rgba(212,175,55,0.5);letter-spacing:0.1em;margin-bottom:8px}
.code{font-size:30px;font-weight:700;color:#8f8;font-family:monospace;letter-spacing:0.15em}
.copy-btn{margin-top:16px;background:rgba(46,125,50,0.2);border:1px solid rgba(46,125,50,0.5);color:#8f8;padding:12px 32px;border-radius:10px;font-size:14px;cursor:pointer;font-family:inherit;transition:all 0.25s;letter-spacing:0.05em}
.copy-btn:hover{background:rgba(46,125,50,0.35);box-shadow:0 4px 16px rgba(46,125,50,0.2)}
.copy-btn:active{transform:scale(0.96)}
.footer{margin-top:24px;font-size:11px;color:rgba(255,245,220,0.2);letter-spacing:0.05em}
</style>
</head>
<body>
<div class="card">
  <div class="xi">囍</div>
  <div class="icon">${isSuccess ? '🎉' : '❌'}</div>
  <div class="title">${title}</div>
  <div class="info">${info}</div>
  ${code ? `
  <div class="divider"></div>
  <div class="code-box">
    <div class="code-label">邀请码</div>
    <div class="code">${code}</div>
  </div>
  <button class="copy-btn" onclick="navigator.clipboard.writeText('${code}').then(()=>{this.textContent='✅ 已复制';setTimeout(()=>{this.textContent='📋 复制邀请码'},2000)})">📋 复制邀请码</button>
  ` : ''}
  <div class="footer">光影婚礼墙</div>
</div>
</body>
</html>`;
}

function errorPage(title, msg) {
  return resultPage(`❌ ${title}`, msg, '', false, '');
}
