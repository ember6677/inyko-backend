// INYKO 运营控制面板 — 后端 API 服务器
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// 引入路由
const metricsRouter = require('./routes/metrics');
const videoTasksRouter = require('./routes/video-tasks');
const coversPlatformsRouter = require('./routes/covers-platforms');
const publishTasksRouter = require('./routes/publish-tasks');
const contentPlansRouter = require('./routes/content-plans');
const logsAutomationsRouter = require('./routes/logs-automations');

const app = express();
const PORT = process.env.PORT || 4000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（部署时前端也在一起）
app.use(express.static(path.join(__dirname, 'public')));

// API 路由
app.use('/api/metrics', metricsRouter);
app.use('/api/video-tasks', videoTasksRouter);
app.use('/api', coversPlatformsRouter);
app.use('/api/publish-tasks', publishTasksRouter);
app.use('/api/content-plans', contentPlansRouter);
app.use('/api', logsAutomationsRouter);

// 仪表盘聚合接口
app.get('/api/dashboard', (req, res) => {
  const db = require('./db');
  const today = new Date().toISOString().slice(0, 10);

  let metrics = db.get('metrics', { date: today });
  if (!metrics) {
    db.insert('metrics', { date: today, total_plays: 0, new_followers: 0, ai_tasks_completed: 0, engagement_rate: 0, pending_tasks: 0, play_growth: 0, follower_growth: 0, engagement_benchmark: 3.2 });
    metrics = db.get('metrics', { date: today });
  }

  const platformStats = db.all('platform_stats');
  const videoTasks = db.all('video_tasks').slice(-10);
  const coverTasks = db.all('cover_tasks').slice(-10);
  const platforms = db.all('platforms');
  const publishTasks = db.all('publish_tasks');
  const contentPlansArr = db.all('content_plans');
  const logs = db.all('system_logs').slice(-20).reverse();
  const automationsArr = db.all('automations');
  const hotKeywords = db.all('hot_keywords').sort((a, b) => b.score - a.score).slice(0, 10);
  const insight = db.get('daily_insight', { date: today }) || { suggestion: '', golden_window: '18:00-19:30' };

  res.json({
    metrics,
    platformStats: Array.isArray(platformStats) ? platformStats : [],
    videoTasks,
    coverTasks,
    platforms,
    publishTasks,
    contentPlans: {
      plans: contentPlansArr,
      total: contentPlansArr.length,
      scripts_generated: contentPlansArr.filter(p => p.status === 'published').length,
      adoption_rate: contentPlansArr.length > 0 ? Math.round(contentPlansArr.filter(p => p.status === 'published').length / contentPlansArr.length * 100) : 0
    },
    logs,
    automations: {
      automations: automationsArr,
      total_saved_hours: automationsArr.reduce((s, a) => s + (a.saved_hours || 0), 0)
    },
    hotKeywords,
    insight
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  try {
    require('fs').accessSync(indexPath);
    res.sendFile(indexPath);
  } catch {
    res.status(404).json({ error: 'Not Found' });
  }
});

// 启动
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  INYKO API 服务已启动');
  console.log('  本地地址: http://localhost:' + PORT);
  console.log('  仪表盘数据: /api/dashboard');
  console.log('  健康检查: /api/health');
  console.log('========================================');
});
