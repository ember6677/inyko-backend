// 初始化种子数据 — 首次运行时填充数据库
const { run, all } = require('./db');

console.log('🌱 正在初始化种子数据...');

// --- 今日指标 ---
const today = new Date().toISOString().slice(0, 10);
run('INSERT OR IGNORE INTO metrics (date, total_plays, new_followers, ai_tasks_completed, engagement_rate, pending_tasks, play_growth, follower_growth) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  [today, 128000, 342, 12, 4.2, 5, 23.4, 18.7]);

// --- 平台实时数据 ---
const platforms = [
  ['douyin', 'plays', '12.8万', '+23.4%'],
  ['xiaohongshu', 'exposure', '6.4万', '+12.1%'],
  ['bilibili', 'approved', '3条', ''],
  ['shipinhao', 'fans', '342', '+18.7%'],
  ['kuaishou', 'queue', '4个', ''],
];
const stmt = run('DELETE FROM platform_stats');
platforms.forEach(p => run('INSERT INTO platform_stats (platform, metric, value, trend) VALUES (?, ?, ?, ?)', p));

// --- 视频剪辑任务 ---
const videoData = [
  ['task-001', '隔音舱展示视频', 'pending', 0],
  ['task-002', '客户证言视频', 'done', 100],
  ['task-003', '产品功能讲解', 'pending', 0],
  ['task-004', '安装现场视频', 'error', 45],
];
run('DELETE FROM video_tasks');
videoData.forEach(v => run('INSERT INTO video_tasks (id, name, status, progress) VALUES (?, ?, ?, ?)', v));

// --- 封面精修 ---
run('DELETE FROM cover_tasks');
run('INSERT INTO cover_tasks (id, name, status, progress) VALUES (?, ?, ?, ?)', ['cover-001', 'Focus S 产品封面', 'done', 100]);
run('INSERT INTO cover_tasks (id, name, status, progress) VALUES (?, ?, ?, ?)', ['cover-002', '618促销海报', 'processing', 60]);

// --- 平台账号 ---
run('DELETE FROM platforms');
const accts = [
  ['douyin', '🎵', '@inyko官方', 'connected', 285000, 2],
  ['xiaohongshu', '📕', '@inyko科技', 'connected', 156000, 1],
  ['bilibili', '📺', '@INYKO音可', 'connected', 89000, 0],
  ['shipinhao', '💬', '@inyko', 'connected', 42000, 1],
  ['kuaishou', '⚡', '@inyko声学', 'pending', 0, 0],
];
accts.forEach(a => run('INSERT INTO platforms (id, icon, name, account_name, status, followers, today_posts) VALUES (?, ?, ?, ?, ?, ?, ?)', a));

// --- 发布任务 ---
run('DELETE FROM publish_tasks');
const pubs = [
  ['pub-001', '隔音舱对比测试 · 60s', 'douyin', '2026-06-14T10:00', 'scheduled', 'video'],
  ['pub-002', '静音键盘声音对比', 'xiaohongshu', '2026-06-14T12:30', 'scheduled', 'video'],
  ['pub-003', 'Focus S 工作室实测', 'bilibili', '2026-06-14T18:00', 'scheduled', 'video'],
  ['pub-004', '客户案例 · 某互联网大厂', 'shipinhao', '2026-06-14T21:00', 'scheduled', 'video'],
];
pubs.forEach(p => run('INSERT INTO publish_tasks (id, title, platform, scheduled_at, status, content_type) VALUES (?, ?, ?, ?, ?, ?)', p));

// --- 内容规划 ---
run('DELETE FROM content_plans');
const plans = [
  ['cp-001', '隔音舱 vs 普通声学材料', 'video', '对比测评，突出降噪效果', '2026-06-15', 'high', 'draft'],
  ['cp-002', '在家搭建录音间攻略', 'article', '图文教程，适合自媒体人', '2026-06-16', 'high', 'draft'],
  ['cp-003', 'Focus S 新品开箱直播', 'live', '抖音/B站双平台直播', '2026-06-18', 'high', 'scheduled'],
  ['cp-004', '8年声学研发之路', 'video', '品牌故事，情感化叙事', '2026-06-20', 'normal', 'draft'],
  ['cp-005', '远程办公降噪解决方案', 'article', '面向企业HR的内容', '2026-06-22', 'normal', 'draft'],
];
plans.forEach(p => run('INSERT INTO content_plans (id, title, type, description, suggested_time, priority, status, month, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  [...p, new Date().getMonth() + 1, new Date().getFullYear()]));

// --- 系统日志 ---
run('DELETE FROM system_logs');
const logs = [
  ['log-001', 'info', '系统启动完成，所有模块就绪', 'system'],
  ['log-002', 'success', 'douyin 账户状态检测通过', 'platforms'],
  ['log-003', 'success', '今日发布队列已生成 · 4条内容', 'publish'],
  ['log-004', 'info', 'AI 内容规划引擎已更新', 'content'],
  ['log-005', 'warning', 'kuaishou 账户 Token 已过期', 'platforms'],
  ['log-006', 'success', 'bilibili 稿件审核通过 · 3条', 'platforms'],
  ['log-007', 'info', '热点关键词库已刷新 · 12个新词', 'analytics'],
  ['log-008', 'error', '任务 task-004 编码错误：不支持的 H.265 源', 'video'],
];
logs.forEach(l => run('INSERT INTO system_logs (id, type, message, module) VALUES (?, ?, ?, ?)', l));

// --- 自动化任务 ---
run('DELETE FROM automations');
const autos = [
  ['auto-001', '定时发布', 'running', '2026-06-14T10:00', 2.5],
  ['auto-002', 'AI 剪辑队列', 'running', '2026-06-14T08:00', 3.2],
  ['auto-003', '内容审核', 'running', '2026-06-14T14:00', 0.8],
  ['auto-004', '数据同步', 'running', '2026-06-14T00:00', 0.3],
  ['auto-005', '热点监测', 'running', '2026-06-14T06:00', 0.5],
];
autos.forEach(a => run('INSERT INTO automations (id, name, status, next_run, saved_hours) VALUES (?, ?, ?, ?, ?)', a));

// --- 热点关键词 ---
run('DELETE FROM hot_keywords');
const kws = [
  ['隔音舱', 95, 'douyin'],
  ['办公降噪', 88, 'douyin'],
  ['工作效率', 82, 'xiaohongshu'],
  ['静音空间', 78, 'douyin'],
  ['远程办公', 75, 'shipinhao'],
  ['声学设计', 70, 'bilibili'],
  ['Focus S', 68, 'douyin'],
  ['录音间', 65, 'xiaohongshu'],
  ['居家办公好物', 60, 'xiaohongshu'],
  ['AI剪辑', 55, 'douyin'],
];
kws.forEach(k => run('INSERT INTO hot_keywords (keyword, score, source) VALUES (?, ?, ?)', k));

// --- 每日洞察 ---
run('INSERT OR IGNORE INTO daily_insight (date, suggestion, golden_window) VALUES (?, ?, ?)',
  [today, '根据过去7天数据，建议发布展示舱内工作场景的60s短视频，预计播放量可突破8万+', '18:00-19:30']);

console.log('✅ 种子数据初始化完成!');
console.log('   运行 "npm start" 启动服务器');
console.log('   仪表盘接口: http://localhost:4000/api/dashboard');
