// 封面精修 + 平台账号 API
const express = require('express');
const router = express.Router();
const { all, get, insert, update, remove } = require('../db');

function makeId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

// ============ 封面精修 ============
router.get('/covers', (req, res) => res.json(all('cover_tasks')));

router.post('/covers', (req, res) => {
  const { name, source_path } = req.body;
  if (!name) return res.status(400).json({ error: '任务名称不能为空' });
  const task = { id: makeId(), name, source_path: source_path || '', status: 'pending', progress: 0, result_path: '' };
  insert('cover_tasks', task);
  res.status(201).json(task);
});

router.put('/covers/:id', (req, res) => {
  const data = {};
  ['name', 'status', 'progress', 'result_path'].forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
  update('cover_tasks', { id: req.params.id }, data);
  res.json(get('cover_tasks', { id: req.params.id }));
});

router.delete('/covers/:id', (req, res) => { remove('cover_tasks', { id: req.params.id }); res.json({ ok: true }); });

// ============ 平台账号 ============
router.get('/platforms', (req, res) => res.json(all('platforms')));

router.post('/platforms', (req, res) => {
  const { name, icon, account_name, status, followers, today_posts, notes } = req.body;
  if (!name) return res.status(400).json({ error: '平台名称不能为空' });
  const p = { id: makeId(), name, icon: icon || '', account_name: account_name || '', status: status || 'connected', followers: followers || 0, today_posts: today_posts || 0, notes: notes || '' };
  insert('platforms', p);
  res.status(201).json(p);
});

router.put('/platforms/:id', (req, res) => {
  const fields = ['name', 'icon', 'account_name', 'status', 'followers', 'today_posts', 'notes'];
  const data = {};
  fields.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
  update('platforms', { id: req.params.id }, data);
  res.json(get('platforms', { id: req.params.id }));
});

router.delete('/platforms/:id', (req, res) => { remove('platforms', { id: req.params.id }); res.json({ ok: true }); });

module.exports = router;
