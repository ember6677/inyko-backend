// 核心指标 + 平台实时数据 + 每日洞察 API
const express = require('express');
const router = express.Router();
const { all, get, insert, update, upsert, clear } = require('../db');

// GET /api/metrics
router.get('/', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  let metrics = get('metrics', { date: today });
  if (!metrics) {
    insert('metrics', { date: today, total_plays: 0, new_followers: 0, ai_tasks_completed: 0, engagement_rate: 0, pending_tasks: 0, play_growth: 0, follower_growth: 0, engagement_benchmark: 3.2 });
    metrics = get('metrics', { date: today });
  }
  const platformStats = all('platform_stats');
  const insight = get('daily_insight', { date: today }) || { suggestion: '', golden_window: '18:00-19:30' };
  // 确保返回数组
  const statsSerialized = Array.isArray(platformStats) ? platformStats : [];
  res.json({ metrics, platformStats: statsSerialized, insight });
});

// PUT /api/metrics
router.put('/', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const data = { ...req.body, date: today, updated_at: new Date().toISOString() };
  upsert('metrics', { date: today }, data);
  const updated = get('metrics', { date: today });
  res.json(updated);
});

// PUT /api/metrics/platforms
router.put('/platforms', (req, res) => {
  const stats = req.body;
  if (!Array.isArray(stats)) return res.status(400).json({ error: '需要数组格式' });
  // 清空重建
  clear('platform_stats');
  stats.forEach(s => insert('platform_stats', { platform: s.platform, metric: s.metric, value: s.value, trend: s.trend || '' }));
  res.json({ ok: true });
});

// PUT /api/metrics/insight
router.put('/insight', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const { suggestion, golden_window } = req.body;
  upsert('daily_insight', { date: today }, { date: today, suggestion, golden_window });
  res.json({ ok: true });
});

module.exports = router;
