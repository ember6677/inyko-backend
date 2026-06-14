// 内容规划 API
const express = require('express');
const router = express.Router();
const { all, get, insert, update, remove } = require('../db');
const makeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

router.get('/', (req, res) => {
  const plans = all('content_plans');
  const total = plans.length;
  const scripts = plans.filter(p => p.status === 'published').length;
  res.json({ plans, total, scripts_generated: scripts, adoption_rate: total > 0 ? Math.round(scripts / total * 100) : 0 });
});

router.post('/', (req, res) => {
  const { title, type, description, suggested_time, priority, status } = req.body;
  if (!title) return res.status(400).json({ error: '标题不能为空' });
  const now = new Date();
  const plan = { id: makeId(), title, type: type || 'video', description: description || '', suggested_time: suggested_time || '', priority: priority || 'normal', status: status || 'draft', month: now.getMonth() + 1, year: now.getFullYear() };
  insert('content_plans', plan);
  res.status(201).json(plan);
});

router.put('/:id', (req, res) => {
  const fields = ['title', 'type', 'description', 'suggested_time', 'priority', 'status'];
  const data = {};
  fields.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
  update('content_plans', { id: req.params.id }, data);
  res.json(get('content_plans', { id: req.params.id }));
});

router.delete('/:id', (req, res) => { remove('content_plans', { id: req.params.id }); res.json({ ok: true }); });

module.exports = router;
