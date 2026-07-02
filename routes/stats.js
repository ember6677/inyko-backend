// 每日数据录入 API — 手工记账式运营数据
const express = require('express');
const router = express.Router();
const { all, get, insert, update, remove } = require('../db');
const { v4: uuidv4 } = require('uuid');

// POST /api/stats — 录入今日数据
router.post('/', (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const existing = get('daily_stats', { date: today });

    const entry = {
      id: existing ? existing.id : uuidv4(),
      date: today,
      platform: req.body.platform || 'douyin',
      total_plays: parseInt(req.body.total_plays) || 0,
      new_plays: parseInt(req.body.new_plays) || 0,
      total_followers: parseInt(req.body.total_followers) || 0,
      new_followers: parseInt(req.body.new_followers) || 0,
      total_likes: parseInt(req.body.total_likes) || 0,
      new_likes: parseInt(req.body.new_likes) || 0,
      comments: parseInt(req.body.comments) || 0,
      shares: parseInt(req.body.shares) || 0,
      engagement_rate: parseFloat(req.body.engagement_rate) || 0,
      notes: req.body.notes || '',
      updated_at: new Date().toISOString()
    };

    if (existing) {
      update('daily_stats', { date: today }, entry);
    } else {
      insert('daily_stats', entry);
    }

    res.json({ code: 0, data: entry, message: existing ? '已更新今日数据' : '已保存今日数据' });
  } catch (err) {
    console.error('stats save error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/latest — 获取最新一条
router.get('/latest', (req, res) => {
  try {
    const allStats = all('daily_stats').sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );
    const latest = allStats[0] || null;

    // 计算昨日变化
    let yesterday = allStats[1] || null;
    let play_growth = 0;
    let follower_growth = 0;
    if (yesterday && latest && yesterday.total_plays > 0) {
      play_growth = Math.round((latest.new_plays - yesterday.new_plays) / yesterday.new_plays * 100) || 0;
    }
    if (yesterday && latest && yesterday.new_followers > 0) {
      follower_growth = Math.round((latest.new_followers - yesterday.new_followers) / yesterday.new_followers * 100) || 0;
    }

    res.json({
      code: 0,
      data: latest
        ? {
            ...latest,
            play_growth: play_growth >= 0 ? `+${play_growth}` : `${play_growth}`,
            follower_growth: follower_growth >= 0 ? `+${follower_growth}` : `${follower_growth}`,
            engagement_benchmark: 3.2
          }
        : null
    });
  } catch (err) {
    console.error('stats latest error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats — 获取历史数据（默认最近 30 天）
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.days) || 30;
    const allStats = all('daily_stats')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit)
      .reverse(); // 旧→新 排序

    res.json({
      code: 0,
      data: allStats,
      summary: {
        total_plays: allStats.reduce((s, d) => s + (d.new_plays || 0), 0),
        total_followers: allStats.reduce((s, d) => s + (d.new_followers || 0), 0),
        total_likes: allStats.reduce((s, d) => s + (d.new_likes || 0), 0),
        days: allStats.length
      }
    });
  } catch (err) {
    console.error('stats list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/today — 获取今日是否已有数据
router.get('/today', (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const entry = get('daily_stats', { date: today });
    res.json({ code: 0, data: entry || null });
  } catch (err) {
    console.error('stats today error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
