// 海报模板接口
// GET /api/poster?action=list — 模板列表
// GET /api/poster?action=template&id=X — 模板详情+配置
// GET /api/poster?action=data — 用户婚礼数据

import { corsHeaders, requireAuth } from './_auth.js';

// ====== 模板配置 ======
// cleanImage: 去除人物后的模板图片（需放入 public/posters/ 目录）
// photoSlots: 人物区域 bbox [x, y, w, h]（相对 1080x1920 坐标）
// textFields: 文案区域 bbox（自动填充婚礼数据）
// overlayText: true=文字在照片上层, false=文字在照片下层
const TEMPLATES = [
  {
    id: 'tpl-01', name: '囍字良缘', style: 'chinese', layout: 'A', thumb: '🏮',
    desc: '中式传统 · 上文下图',
    cleanImage: '/posters/tpl-01-clean.png',
    width: 1080, height: 1920,
    photoSlots: [
      { id: 'main', bbox: [50, 650, 980, 1200], shape: 'rect', zIndex: 0 },
    ],
    textFields: [
      { key: 'title', content: '我们结婚啦', bbox: [540, 200, 0, 0], fontSize: 72, color: '#ffd700', align: 'center' },
      { key: 'groomName', content: '{partner1}', bbox: [350, 400, 0, 0], fontSize: 56, color: '#ffd700', align: 'center' },
      { key: 'brideName', content: '{partner2}', bbox: [730, 400, 0, 0], fontSize: 56, color: '#ffd700', align: 'center' },
      { key: 'date', content: '{wedding_date_cn}', bbox: [540, 500, 0, 0], fontSize: 32, color: 'rgba(255,215,0,0.8)', align: 'center' },
      { key: 'venue', content: '{wedding_venue}', bbox: [540, 560, 0, 0], fontSize: 26, color: 'rgba(255,215,0,0.6)', align: 'center' },
    ],
    overlayText: false,
  },
  {
    id: 'tpl-02', name: '龙凤呈祥', style: 'chinese', layout: 'B', thumb: '🐉',
    desc: '中式传统 · 上图下文再下图',
    cleanImage: '/posters/tpl-02-clean.png',
    width: 1080, height: 1920,
    photoSlots: [
      { id: 'top', bbox: [50, 50, 980, 750], shape: 'rect', zIndex: 0 },
      { id: 'bottom', bbox: [50, 1120, 980, 750], shape: 'rect', zIndex: 0 },
    ],
    textFields: [
      { key: 'groomName', content: '{partner1}', bbox: [350, 870, 0, 0], fontSize: 56, color: '#ffd700', align: 'center' },
      { key: 'brideName', content: '{partner2}', bbox: [730, 870, 0, 0], fontSize: 56, color: '#ffd700', align: 'center' },
      { key: 'date', content: '{wedding_date_cn}', bbox: [540, 960, 0, 0], fontSize: 28, color: 'rgba(255,215,0,0.7)', align: 'center' },
      { key: 'venue', content: '{wedding_venue}', bbox: [540, 1020, 0, 0], fontSize: 24, color: 'rgba(255,215,0,0.5)', align: 'center' },
    ],
    overlayText: false,
  },
  {
    id: 'tpl-03', name: '森系清新', style: 'forest', layout: 'C', thumb: '🌿',
    desc: '森系户外 · 上图下文',
    cleanImage: '/posters/tpl-03-clean.png',
    width: 1080, height: 1920,
    photoSlots: [
      { id: 'main', bbox: [50, 50, 980, 1100], shape: 'rect', zIndex: 0 },
    ],
    textFields: [
      { key: 'groomName', content: '{partner1}', bbox: [350, 1250, 0, 0], fontSize: 52, color: '#2e7d32', align: 'center' },
      { key: 'brideName', content: '{partner2}', bbox: [730, 1250, 0, 0], fontSize: 52, color: '#2e7d32', align: 'center' },
      { key: 'date', content: '{wedding_date_cn}', bbox: [540, 1350, 0, 0], fontSize: 26, color: '#4caf50', align: 'center' },
      { key: 'venue', content: '{wedding_venue}', bbox: [540, 1410, 0, 0], fontSize: 22, color: '#66bb6a', align: 'center' },
    ],
    overlayText: false,
  },
  {
    id: 'tpl-04', name: '轻奢优雅', style: 'luxury', layout: 'A', thumb: '✨',
    desc: '轻奢简约 · 上文下图',
    cleanImage: '/posters/tpl-04-clean.png',
    width: 1080, height: 1920,
    photoSlots: [
      { id: 'main', bbox: [50, 600, 980, 1250], shape: 'rect', zIndex: 0 },
    ],
    textFields: [
      { key: 'title', content: 'WEDDING', bbox: [540, 150, 0, 0], fontSize: 24, color: '#999', align: 'center', letterSpacing: 12 },
      { key: 'groomName', content: '{partner1}', bbox: [350, 300, 0, 0], fontSize: 52, color: '#333', align: 'center' },
      { key: 'brideName', content: '{partner2}', bbox: [730, 300, 0, 0], fontSize: 52, color: '#333', align: 'center' },
      { key: 'date', content: '{wedding_date_cn}', bbox: [540, 420, 0, 0], fontSize: 24, color: '#666', align: 'center' },
      { key: 'venue', content: '{wedding_venue}', bbox: [540, 480, 0, 0], fontSize: 20, color: '#888', align: 'center' },
    ],
    overlayText: false,
  },
  {
    id: 'tpl-05', name: '复古胶片', style: 'retro', layout: 'A', thumb: '🎞️',
    desc: '复古胶片 · 暖黄调',
    cleanImage: '/posters/tpl-05-clean.png',
    width: 1080, height: 1920,
    photoSlots: [
      { id: 'main', bbox: [50, 600, 980, 1250], shape: 'rect', zIndex: 0 },
    ],
    textFields: [
      { key: 'groomName', content: '{partner1}', bbox: [350, 320, 0, 0], fontSize: 52, color: '#8d6e63', align: 'center' },
      { key: 'brideName', content: '{partner2}', bbox: [730, 320, 0, 0], fontSize: 52, color: '#8d6e63', align: 'center' },
      { key: 'date', content: '{wedding_date_cn}', bbox: [540, 440, 0, 0], fontSize: 24, color: '#a1887f', align: 'center' },
      { key: 'venue', content: '{wedding_venue}', bbox: [540, 500, 0, 0], fontSize: 20, color: '#bcaaa4', align: 'center' },
    ],
    overlayText: false,
  },
  {
    id: 'tpl-06', name: '轻奢花体', style: 'luxury', layout: 'A', thumb: '💐',
    desc: '轻奢简约 · 花体英文',
    cleanImage: '/posters/tpl-06-clean.png',
    width: 1080, height: 1920,
    photoSlots: [
      { id: 'main', bbox: [50, 600, 980, 1250], shape: 'rect', zIndex: 0 },
    ],
    textFields: [
      { key: 'title', content: 'Save the Date', bbox: [540, 180, 0, 0], fontSize: 28, color: '#b8860b', align: 'center', style: 'italic' },
      { key: 'groomName', content: '{partner1}', bbox: [350, 320, 0, 0], fontSize: 52, color: '#333', align: 'center' },
      { key: 'brideName', content: '{partner2}', bbox: [730, 320, 0, 0], fontSize: 52, color: '#333', align: 'center' },
      { key: 'date', content: '{wedding_date_cn}', bbox: [540, 440, 0, 0], fontSize: 24, color: '#666', align: 'center' },
      { key: 'venue', content: '{wedding_venue}', bbox: [540, 500, 0, 0], fontSize: 20, color: '#888', align: 'center' },
    ],
    overlayText: false,
  },
  {
    id: 'tpl-07', name: '森系双图', style: 'forest', layout: 'B', thumb: '🌲',
    desc: '森系户外 · 上下双图',
    cleanImage: '/posters/tpl-07-clean.png',
    width: 1080, height: 1920,
    photoSlots: [
      { id: 'top', bbox: [50, 50, 980, 700], shape: 'rect', zIndex: 0 },
      { id: 'bottom', bbox: [50, 1170, 980, 700], shape: 'rect', zIndex: 0 },
    ],
    textFields: [
      { key: 'groomName', content: '{partner1}', bbox: [350, 840, 0, 0], fontSize: 48, color: '#2e7d32', align: 'center' },
      { key: 'brideName', content: '{partner2}', bbox: [730, 840, 0, 0], fontSize: 48, color: '#2e7d32', align: 'center' },
      { key: 'date', content: '{wedding_date_cn}', bbox: [540, 930, 0, 0], fontSize: 24, color: '#4caf50', align: 'center' },
      { key: 'venue', content: '{wedding_venue}', bbox: [540, 990, 0, 0], fontSize: 20, color: '#66bb6a', align: 'center' },
    ],
    overlayText: false,
  },
  {
    id: 'tpl-08', name: '森系草坪', style: 'forest', layout: 'C', thumb: '☀️',
    desc: '森系户外 · 草坪',
    cleanImage: '/posters/tpl-08-clean.png',
    width: 1080, height: 1920,
    photoSlots: [
      { id: 'main', bbox: [50, 50, 980, 1100], shape: 'rect', zIndex: 0 },
    ],
    textFields: [
      { key: 'groomName', content: '{partner1}', bbox: [350, 1250, 0, 0], fontSize: 52, color: '#33691e', align: 'center' },
      { key: 'brideName', content: '{partner2}', bbox: [730, 1250, 0, 0], fontSize: 52, color: '#33691e', align: 'center' },
      { key: 'date', content: '{wedding_date_cn}', bbox: [540, 1350, 0, 0], fontSize: 26, color: '#558b2f', align: 'center' },
      { key: 'venue', content: '{wedding_venue}', bbox: [540, 1410, 0, 0], fontSize: 22, color: '#689f38', align: 'center' },
    ],
    overlayText: false,
  },
  {
    id: 'tpl-09', name: '森系花墙', style: 'forest', layout: 'B', thumb: '🌸',
    desc: '森系户外 · 花墙',
    cleanImage: '/posters/tpl-09-clean.png',
    width: 1080, height: 1920,
    photoSlots: [
      { id: 'top', bbox: [50, 50, 980, 700], shape: 'rect', zIndex: 0 },
      { id: 'bottom', bbox: [50, 1170, 980, 700], shape: 'rect', zIndex: 0 },
    ],
    textFields: [
      { key: 'groomName', content: '{partner1}', bbox: [350, 840, 0, 0], fontSize: 48, color: '#c62828', align: 'center' },
      { key: 'brideName', content: '{partner2}', bbox: [730, 840, 0, 0], fontSize: 48, color: '#c62828', align: 'center' },
      { key: 'date', content: '{wedding_date_cn}', bbox: [540, 930, 0, 0], fontSize: 24, color: '#e57373', align: 'center' },
      { key: 'venue', content: '{wedding_venue}', bbox: [540, 990, 0, 0], fontSize: 20, color: '#ef9a9a', align: 'center' },
    ],
    overlayText: false,
  },
  {
    id: 'tpl-10', name: '森系唯', style: 'forest', layout: 'A', thumb: '🦋',
    desc: '森系户外 · 唯美',
    cleanImage: '/posters/tpl-10-clean.png',
    width: 1080, height: 1920,
    photoSlots: [
      { id: 'main', bbox: [50, 650, 980, 1200], shape: 'rect', zIndex: 0 },
    ],
    textFields: [
      { key: 'groomName', content: '{partner1}', bbox: [350, 400, 0, 0], fontSize: 52, color: '#2e7d32', align: 'center' },
      { key: 'brideName', content: '{partner2}', bbox: [730, 400, 0, 0], fontSize: 52, color: '#2e7d32', align: 'center' },
      { key: 'date', content: '{wedding_date_cn}', bbox: [540, 500, 0, 0], fontSize: 26, color: '#4caf50', align: 'center' },
      { key: 'venue', content: '{wedding_venue}', bbox: [540, 560, 0, 0], fontSize: 22, color: '#66bb6a', align: 'center' },
    ],
    overlayText: false,
  },
];

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (action === 'list') {
    return Response.json({ ok: true, templates: TEMPLATES.map(t => ({ id: t.id, name: t.name, style: t.style, layout: t.layout, thumb: t.thumb, desc: t.desc })) }, { headers: corsHeaders });
  }

  if (action === 'template') {
    const tpl = TEMPLATES.find(t => t.id === url.searchParams.get('id'));
    if (!tpl) return Response.json({ ok: false, error: '模板不存在' }, { status: 404, headers: corsHeaders });
    return Response.json({ ok: true, template: tpl }, { headers: corsHeaders });
  }

  if (action === 'data') {
    const userId = await requireAuth(context);
    if (userId instanceof Response) return userId;
    try {
      const user = await env.DB.prepare('SELECT partner1, partner2, wedding_date, wedding_venue, slug FROM users WHERE id = ?').bind(userId).first();
      if (!user) return Response.json({ ok: false, error: '用户不存在' }, { status: 404, headers: corsHeaders });
      let wedding_date_cn = '';
      if (user.wedding_date) {
        const d = new Date(user.wedding_date + 'T00:00:00');
        const wk = ['日','一','二','三','四','五','六'];
        wedding_date_cn = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 星期${wk[d.getDay()]}`;
      }
      const { results: imgs } = await env.DB.prepare("SELECT id FROM images WHERE user_id = ? AND category = 'gallery' ORDER BY sort_order").bind(userId).all();
      return Response.json({ ok: true, data: {
        partner1: user.partner1 || '新郎', partner2: user.partner2 || '新娘',
        wedding_date_cn, wedding_venue: user.wedding_venue || '', slug: user.slug || '',
        gallery: imgs.map(i => ({ id: i.id, url: `/api/image?id=${i.id}` })),
      }}, { headers: corsHeaders });
    } catch (e) { return Response.json({ ok: false, error: '获取失败' }, { status: 500, headers: corsHeaders }); }
  }

  return Response.json({ ok: false, error: '未知操作' }, { status: 400, headers: corsHeaders });
}
