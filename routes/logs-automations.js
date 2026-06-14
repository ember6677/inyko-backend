// 系统日志 + 自动化任务 + 热点关键词 API
const express = require('express');
const router = express.Router();
const { all, get, insert, update, remove, clear } = require('../db');
const makeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// ============ 系统日志 ============
router.get('/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const logs = all('system_logs').slice(-limit).reverse();
  res.json(logs);
});

router.post('/logs', (req, res) => {
  const { type, message, module: mod } = req.body;
  if (!message) return res.status(400).json({ error: '日志内容不能为空' });
  const log = { id: makeId(), type: type || 'info', message, module: mod || '' };
  insert('system_logs', log);
  res.status(201).json(log);
});

router.delete('/logs', (req, res) => { clear('system_logs'); res.json({ ok: true }); });

// ============ 自动化任务 ============
router.get('/automations', (req, res) => {
  const autos = all('automations');
  const totalSaved = autos.reduce((sum, a) => sum + (a.saved_hours || 0), 0);
  res.json({ automations: autos, total_saved_hours: totalSaved });
});

router.put('/automations/:id', (req, res) => {
  const fields = ['name', 'status', 'next_run', 'saved_hours'];
  const data = {};
  fields.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
  update('automations', { id: req.params.id }, data);
  res.json(get('automations', { id: req.params.id }));
});

// ============ 热点关键词 ============
router.get('/hot-keywords', (req, res) => {
  res.json(all('hot_keywords').sort((a, b) => b.score - a.score));
});

router.post('/hot-keywords', (req, res) => {
  const { keyword, score, source } = req.body;
  if (!keyword) return res.status(400).json({ error: '关键词不能为空' });
  const kw = { id: makeId(), keyword, score: score || 50, source: source || 'douyin' };
  insert('hot_keywords', kw);
  res.status(201).json(kw);
});

router.delete('/hot-keywords/:id', (req, res) => { remove('hot_keywords', { id: req.params.id }); res.json({ ok: true }); });

module.exports = router;
