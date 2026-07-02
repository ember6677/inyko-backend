// INYKO 后端 — JSON 文件数据库层（零依赖，无需编译）
const fs = require('fs');
const path = require('path');

// Vercel 环境使用 /tmp（唯一可写目录），本地开发使用 data/ 目录
const IS_VERCEL = !!process.env.VERCEL;
const DB_DIR = process.env.DB_PATH || (IS_VERCEL ? '/tmp/data' : path.join(__dirname, 'data'));
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

// 内存缓存
const stores = {};

function load(name) {
  if (stores[name]) return stores[name];
  const file = path.join(DB_DIR, `${name}.json`);
  if (fs.existsSync(file)) {
    try { stores[name] = JSON.parse(fs.readFileSync(file, 'utf-8')); }
    catch { stores[name] = []; }
  } else {
    stores[name] = [];
  }
  return stores[name];
}

function save(name) {
  const file = path.join(DB_DIR, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(stores[name], null, 2), 'utf-8');
}

// --- 通用查询 ---
function all(store, filter = {}) {
  let rows = load(store);
  const keys = Object.keys(filter);
  if (keys.length > 0) {
    rows = rows.filter(r => keys.every(k => r[k] === filter[k]));
  }
  return rows;
}

function get(store, filter) {
  return all(store, filter)[0] || null;
}

function run(store, action) {
  const rows = load(store);
  if (action.type === 'insert') {
    rows.push(action.row);
  } else if (action.type === 'update') {
    const idx = rows.findIndex(r => Object.keys(action.where).every(k => r[k] === action.where[k]));
    if (idx >= 0) rows[idx] = { ...rows[idx], ...action.data, updated_at: new Date().toISOString() };
  } else if (action.type === 'upsert') {
    const idx = rows.findIndex(r => Object.keys(action.where).every(k => r[k] === action.where[k]));
    if (idx >= 0) {
      // 只更新非 null 的字段
      for (const [k, v] of Object.entries(action.row)) {
        if (v !== null && v !== undefined) rows[idx][k] = v;
      }
      rows[idx].updated_at = new Date().toISOString();
    } else {
      rows.push({ ...action.row, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
  } else if (action.type === 'delete') {
    stores[store] = rows.filter(r => !Object.keys(action.where).every(k => r[k] === action.where[k]));
    save(store);
    return;
  }
  stores[store] = rows;
  save(store);
}

function insert(store, row) {
  run(store, { type: 'insert', row: { ...row, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } });
}

function update(store, where, data) {
  run(store, { type: 'update', where, data });
}

function upsert(store, where, row) {
  run(store, { type: 'upsert', where, row });
}

function remove(store, where) {
  run(store, { type: 'delete', where });
}

function clear(store) {
  stores[store] = [];
  save(store);
}

// ===================== 初始化默认数据 =====================
function initDefaults() {
  // 指标
  if (all('metrics').length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    insert('metrics', { date: today, total_plays: 128000, new_followers: 342, ai_tasks_completed: 12, engagement_rate: 4.2, pending_tasks: 5, play_growth: 23.4, follower_growth: 18.7, engagement_benchmark: 3.2 });
  }

  // 平台实时数据
  if (all('platform_stats').length === 0) {
    ['douyin', 'xiaohongshu', 'bilibili', 'shipinhao', 'kuaishou'].forEach(p => {
      insert('platform_stats', { platform: p, metric: p === 'douyin' ? 'plays' : p === 'xiaohongshu' ? 'exposure' : p === 'bilibili' ? 'approved' : p === 'shipinhao' ? 'fans' : 'queue', value: p === 'douyin' ? '12.8万' : p === 'xiaohongshu' ? '6.4万' : p === 'bilibili' ? '3条' : p === 'shipinhao' ? '342' : '4个', trend: p === 'douyin' ? '+23.4%' : p === 'xiaohongshu' ? '+12.1%' : p === 'shipinhao' ? '+18.7%' : '' });
    });
  }

  // 视频任务
  if (all('video_tasks').length === 0) {
    [{ id: 'task-001', name: '隔音舱展示视频', status: 'pending', progress: 0 },
     { id: 'task-002', name: '客户证言视频', status: 'done', progress: 100 },
     { id: 'task-003', name: '产品功能讲解', status: 'pending', progress: 0 },
     { id: 'task-004', name: '安装现场视频', status: 'error', progress: 45 }].forEach(t => insert('video_tasks', t));
  }

  // 封面
  if (all('cover_tasks').length === 0) {
    [{ id: 'cover-001', name: 'Focus S 产品封面', status: 'done', progress: 100 },
     { id: 'cover-002', name: '618促销海报', status: 'processing', progress: 60 }].forEach(t => insert('cover_tasks', t));
  }

  // 平台账号
  if (all('platforms').length === 0) {
    [{ id: 'douyin', name: '抖音', icon: '🎵', account_name: '@inyko官方', status: 'connected', followers: 285000, today_posts: 2 },
     { id: 'xiaohongshu', name: '小红书', icon: '📕', account_name: '@inyko科技', status: 'connected', followers: 156000, today_posts: 1 },
     { id: 'bilibili', name: 'B站', icon: '📺', account_name: '@INYKO音可', status: 'connected', followers: 89000, today_posts: 0 },
     { id: 'shipinhao', name: '视频号', icon: '💬', account_name: '@inyko', status: 'connected', followers: 42000, today_posts: 1 },
     { id: 'kuaishou', name: '快手', icon: '⚡', account_name: '@inyko声学', status: 'pending', followers: 0, today_posts: 0 }].forEach(p => insert('platforms', p));
  }

  // 发布任务
  if (all('publish_tasks').length === 0) {
    [{ id: 'pub-001', title: '隔音舱对比测试 · 60s', platform: 'douyin', scheduled_at: '2026-06-14T10:00', status: 'scheduled', content_type: 'video' },
     { id: 'pub-002', title: '静音键盘声音对比', platform: 'xiaohongshu', scheduled_at: '2026-06-14T12:30', status: 'scheduled', content_type: 'video' },
     { id: 'pub-003', title: 'Focus S 工作室实测', platform: 'bilibili', scheduled_at: '2026-06-14T18:00', status: 'scheduled', content_type: 'video' },
     { id: 'pub-004', title: '客户案例 · 某互联网大厂', platform: 'shipinhao', scheduled_at: '2026-06-14T21:00', status: 'scheduled', content_type: 'video' }].forEach(t => insert('publish_tasks', t));
  }

  // 内容规划
  if (all('content_plans').length === 0) {
    const now = new Date();
    [{ id: 'cp-001', title: '隔音舱 vs 普通声学材料', type: 'video', description: '对比测评，突出降噪效果', suggested_time: '2026-06-15', priority: 'high', status: 'draft' },
     { id: 'cp-002', title: '在家搭建录音间攻略', type: 'article', description: '图文教程，适合自媒体人', suggested_time: '2026-06-16', priority: 'high', status: 'draft' },
     { id: 'cp-003', title: 'Focus S 新品开箱直播', type: 'live', description: '抖音/B站双平台直播', suggested_time: '2026-06-18', priority: 'high', status: 'scheduled' },
     { id: 'cp-004', title: '8年声学研发之路', type: 'video', description: '品牌故事，情感化叙事', suggested_time: '2026-06-20', priority: 'normal', status: 'draft' },
     { id: 'cp-005', title: '远程办公降噪解决方案', type: 'article', description: '面向企业HR的内容', suggested_time: '2026-06-22', priority: 'normal', status: 'draft' }].forEach(t => {
       insert('content_plans', { ...t, month: now.getMonth() + 1, year: now.getFullYear() });
     });
  }

  // 日志
  if (all('system_logs').length === 0) {
    [{ id: 'log-001', type: 'info', message: '系统启动完成，所有模块就绪', module: 'system' },
     { id: 'log-002', type: 'success', message: 'douyin 账户状态检测通过', module: 'platforms' },
     { id: 'log-003', type: 'success', message: '今日发布队列已生成 · 4条内容', module: 'publish' },
     { id: 'log-004', type: 'info', message: 'AI 内容规划引擎已更新', module: 'content' },
     { id: 'log-005', type: 'warning', message: 'kuaishou 账户 Token 已过期', module: 'platforms' },
     { id: 'log-006', type: 'success', message: 'bilibili 稿件审核通过 · 3条', module: 'platforms' },
     { id: 'log-007', type: 'info', message: '热点关键词库已刷新 · 12个新词', module: 'analytics' },
     { id: 'log-008', type: 'error', message: '任务 task-004 编码错误：不支持的 H.265 源', module: 'video' }].forEach(l => insert('system_logs', l));
  }

  // 自动化
  if (all('automations').length === 0) {
    [{ id: 'auto-001', name: '定时发布', status: 'running', next_run: '2026-06-14T10:00', saved_hours: 2.5 },
     { id: 'auto-002', name: 'AI 剪辑队列', status: 'running', next_run: '2026-06-14T08:00', saved_hours: 3.2 },
     { id: 'auto-003', name: '内容审核', status: 'running', next_run: '2026-06-14T14:00', saved_hours: 0.8 },
     { id: 'auto-004', name: '数据同步', status: 'running', next_run: '2026-06-14T00:00', saved_hours: 0.3 },
     { id: 'auto-005', name: '热点监测', status: 'running', next_run: '2026-06-14T06:00', saved_hours: 0.5 }].forEach(a => insert('automations', a));
  }

  // 热点关键词
  if (all('hot_keywords').length === 0) {
    ['隔音舱:95:douyin', '办公降噪:88:douyin', '工作效率:82:xiaohongshu', '静音空间:78:douyin', '远程办公:75:shipinhao', '声学设计:70:bilibili', 'Focus S:68:douyin', '录音间:65:xiaohongshu', '居家办公好物:60:xiaohongshu', 'AI剪辑:55:douyin'].forEach(k => {
      const [keyword, score, source] = k.split(':');
      insert('hot_keywords', { keyword, score: parseInt(score), source });
    });
  }

  // 每日洞察
  if (all('daily_insight').length === 0) {
    insert('daily_insight', { date: new Date().toISOString().slice(0, 10), suggestion: '根据过去7天数据，建议发布展示舱内工作场景的60s短视频，预计播放量可突破8万+', golden_window: '18:00-19:30' });
  }
}

// 初始化
initDefaults();

module.exports = { all, get, insert, update, upsert, remove, clear };
