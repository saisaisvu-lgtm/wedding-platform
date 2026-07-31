// API 工具函数

async function apiCall(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  return res.json();
}

async function apiGet(url) {
  return apiCall(url);
}

async function apiPost(url, data) {
  return apiCall(url, { method: 'POST', body: JSON.stringify(data) });
}

async function apiPut(url, data) {
  return apiCall(url, { method: 'PUT', body: JSON.stringify(data) });
}

async function apiDelete(url) {
  return apiCall(url, { method: 'DELETE' });
}

async function apiUpload(url, formData) {
  const res = await fetch(url, { method: 'POST', body: formData });
  return res.json();
}

// 显示提示
function showAlert(el, message, type = 'error') {
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert-${type} show`;
}

function hideAlert(el) {
  if (!el) return;
  el.className = 'alert';
}
