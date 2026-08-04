// ====== 内容审核引擎 ======
// 多策略匹配：精确/归一化/谐音/变体/拆字

// ====== 敏感词库（分级）======
// level: 3=严重(立即封禁+拒绝) 2=高危(待审核+封禁) 1=敏感(待审核)
const WORD_DB = [
  // === 政治敏感 ===
  { word: '习近平', level: 3 }, { word: '毛泽东', level: 3 }, { word: '邓小平', level: 3 },
  { word: '六四', level: 3 }, { word: '天安门事件', level: 3 }, { word: '法轮功', level: 3 },
  { word: '台独', level: 3 }, { word: '藏独', level: 3 }, { word: '疆独', level: 3 },
  { word: '共产党', level: 2 }, { word: '国民党', level: 2 }, { word: '民进党', level: 2 },

  // === 色情 ===
  { word: '约炮', level: 3 }, { word: '裸聊', level: 3 }, { word: '裸体', level: 3 },
  { word: '色情', level: 3 }, { word: '成人视频', level: 3 }, { word: '一夜情', level: 3 },
  { word: '嫖', level: 3 }, { word: '妓', level: 3 }, { word: '骚逼', level: 3 },
  { word: '骚货', level: 3 }, { word: '荡妇', level: 3 }, { word: '淫', level: 2 },
  { word: '黄色网站', level: 3 }, { word: 'AV', level: 2 }, { word: 'a片', level: 3 },

  // === 赌博 ===
  { word: '赌博', level: 3 }, { word: '网赌', level: 3 }, { word: '赌球', level: 3 },
  { word: '博彩', level: 3 }, { word: '外围', level: 2 }, { word: '六合彩', level: 3 },
  { word: '百家乐', level: 3 }, { word: '老虎机', level: 2 },

  // === 毒品 ===
  { word: '冰毒', level: 3 }, { word: '大麻', level: 3 }, { word: '海洛因', level: 3 },
  { word: '摇头丸', level: 3 }, { word: 'K粉', level: 3 }, { word: '吸毒', level: 3 },

  // === 诈骗/广告 ===
  { word: '代开发票', level: 3 }, { word: '办证', level: 3 }, { word: '代孕', level: 3 },
  { word: '加微信', level: 3 }, { word: '加QQ', level: 3 }, { word: '加V', level: 3 },
  { word: '兼职', level: 2 }, { word: '日赚', level: 3 }, { word: '躺赚', level: 3 },
  { word: '刷单', level: 3 }, { word: '贷款', level: 2 }, { word: '套现', level: 3 },
  { word: '免费领', level: 2 }, { word: '点击链接', level: 3 }, { word: '优惠券', level: 1 },

  // === 人身攻击 ===
  { word: '傻逼', level: 3 }, { word: '煞笔', level: 3 }, { word: '沙比', level: 3 },
  { word: '操你', level: 3 }, { word: '草你', level: 3 }, { word: '日你', level: 3 },
  { word: '干你', level: 3 }, { word: '你妈', level: 3 }, { word: '尼玛', level: 2 },
  { word: '他妈的', level: 3 }, { word: '去死', level: 3 }, { word: '死全家', level: 3 },
  { word: '贱人', level: 3 }, { word: '婊子', level: 3 }, { word: '畜生', level: 3 },
  { word: '王八蛋', level: 3 }, { word: '狗日', level: 3 }, { word: '混蛋', level: 2 },
  { word: '白痴', level: 2 }, { word: '脑残', level: 2 }, { word: '弱智', level: 2 },
  { word: '智障', level: 2 }, { word: '废物', level: 2 }, { word: '垃圾', level: 1 },
  { word: '狗屎', level: 2 },

  // === 英文脏话 ===
  { word: 'fuck', level: 3 }, { word: 'shit', level: 3 }, { word: 'bitch', level: 3 },
  { word: 'asshole', level: 3 }, { word: 'dick', level: 3 }, { word: 'pussy', level: 3 },
  { word: 'bastard', level: 3 }, { word: 'damn', level: 1 }, { word: 'crap', level: 1 },
  { word: 'stfu', level: 3 }, { word: 'wtf', level: 2 }, { word: 'lmfao', level: 1 },

  // === 草泥马系变体 ===
  { word: '草泥马', level: 3 }, { word: '卧槽', level: 2 }, { word: '我靠', level: 1 },
  { word: '我擦', level: 1 }, { word: '特么', level: 1 }, { word: '你妹', level: 1 },
];

// ====== 同音/形近字映射 ======
const HOMOPHONE_MAP = {
  '习': ['席', '系', '洗', '戏', '细', '西', '吸', '希', '喜'],
  '近': ['进', '金', '今', '紧', '尽', '仅', '禁', '津'],
  '平': ['评', '瓶', '屏', '凭', '萍', '乒'],
  '傻': ['沙', '煞', '啥', '杀', '纱'],
  '逼': ['比', '笔', '币', '鼻', '壁', '碧'],
  '草': ['操', '曹', '槽', '嘈'],
  '你': ['泥', '尼', '妮', '逆', '拟'],
  '妈': ['马', '麻', '骂', '吗', '蚂'],
  '狗': ['够', '沟', '勾', '构', '购'],
  '贱': ['建', '见', '剑', '件', '健', '渐'],
  '婊': ['表', '标', '彪'],
  '逼': ['比', '笔', '币', '鼻'],
  '操': ['草', '曹', '槽', '嘈', '超'],
  '死': ['四', '似', '丝', '司', '私', '思'],
  '日': ['入', '如', '乳', '儒'],
  '干': ['赶', '感', '敢', '甘', '干'],
  '滚': ['棍', '浑', '混'],
  '贱': ['建', '见', '剑'],
  '骚': ['扫', '嫂', '梢'],
  '淫': ['银', '引', '因', '音', '阴'],
  '赌': ['堵', '度', '肚', '杜'],
  '毒': ['读', '独', '度', '肚'],
  '鸡': ['机', '几', '己', '记', '技', '继', '济', '集', '极'],
  '妓': ['计', '记', '技', '继', '济', '集', '极'],
};

// ====== 归一化映射 ======
const LEET_MAP = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't',
  '8': 'b', '9': 'g', '@': 'a', '$': 's', '!': 'i', '+': 't',
};

const FULLWIDTH_MAP = {};
for (let i = 0x21; i < 0x7F; i++) {
  FULLWIDTH_MAP[String.fromCharCode(i + 0xFF00 - 0x20)] = String.fromCharCode(i);
}
// 额外全角映射
FULLWIDTH_MAP['，'] = ','; FULLWIDTH_MAP['。'] = '.'; FULLWIDTH_MAP['！'] = '!';
FULLWIDTH_MAP['？'] = '?'; FULLWIDTH_MAP['：'] = ':'; FULLWIDTH_MAP['；'] = ';';
FULLWIDTH_MAP['（'] = '('; FULLWIDTH_MAP['）'] = ')'; FULLWIDTH_MAP['"'] = '"';
FULLWIDTH_MAP['"'] = '"'; FULLWIDTH_MAP['''] = "'"; FULLWIDTH_MAP['''] = "'";

// ====== 文本归一化 ======
function normalize(text) {
  if (!text) return '';
  let s = text.toLowerCase();

  // 1. 全角 → 半角
  s = s.split('').map(ch => FULLWIDTH_MAP[ch] || ch).join('');

  // 2. 去除常见分隔符（空格、点、横杠、下划线、星号等）
  s = s.replace(/[\s\-_.*·,，。.!！?？:：;；~～、\/\\|()（）\[\]【】{}'""]+/g, '');

  // 3. leet speak → 正常字母
  s = s.split('').map(ch => LEET_MAP[ch] || ch).join('');

  // 4. 去除重复字符（如"傻傻傻逼逼逼" → "傻逼"）
  s = s.replace(/(.)\1{2,}/g, '$1$1');

  return s;
}

// ====== 检测函数 ======
function checkContent(text, nickname) {
  const combined = (nickname || '') + ' ' + (text || '');
  const normalized = normalize(combined);
  const original = (combined || '').toLowerCase();

  let maxLevel = 0;
  let matchedWords = [];

  for (const entry of WORD_DB) {
    const word = entry.word.toLowerCase();
    const normalizedWord = normalize(word);

    // 策略1: 归一化后精确匹配
    if (normalized.includes(normalizedWord)) {
      if (entry.level > maxLevel) maxLevel = entry.level;
      matchedWords.push(entry.word);
      continue;
    }

    // 策略2: 原文包含（处理未被归一化覆盖的情况）
    if (original.includes(word)) {
      if (entry.level > maxLevel) maxLevel = entry.level;
      matchedWords.push(entry.word);
      continue;
    }

    // 策略3: 同音字替换检测
    if (entry.level >= 2) {
      const homophonePattern = buildHomophoneRegex(word);
      if (homophonePattern && homophonePattern.test(normalized)) {
        if (entry.level > maxLevel) maxLevel = entry.level;
        matchedWords.push(entry.word + '(谐音)');
      }
    }
  }

  return {
    blocked: maxLevel > 0,
    level: maxLevel,
    words: matchedWords,
    action: maxLevel >= 3 ? 'reject_ban' : maxLevel >= 2 ? 'pending_ban' : maxLevel >= 1 ? 'pending' : 'pass',
  };
}

// 构建同音字正则
function buildHomophoneRegex(word) {
  const chars = word.split('');
  let pattern = '';
  for (const ch of chars) {
    const homophones = HOMOPHONE_MAP[ch];
    if (homophones && homophones.length > 0) {
      pattern += '[' + escapeRegex(ch + homophones.join('')) + ']';
    } else {
      pattern += escapeRegex(ch);
    }
  }
  try {
    return new RegExp(pattern, 'i');
  } catch {
    return null;
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ====== IP Hash ======
async function hashIP(ip) {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + 'danmaku-salt-2026');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).slice(0, 16);
}

// ====== 导出 ======
export { checkContent, hashIP };
