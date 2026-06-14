// 自动发布任务 API
const express = require('express');
const router = express.Router();
const { all, get, insert, update, remove } = require('../db');
const makeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

router.get('/', (req, res) => {
  res.json(all('publish_tasks'));
});

router.post('/', (req, res) => {
  const { title, platform, scheduled_at, status, content_type, content_path, cover_path, description } = req.body;
  if (!title || !platform) return res.status(400).json({ error: '标题和平台不能为空' });
  const task = { id: makeId(), title, platform, scheduled_at: scheduled_at || '', status: status || 'scheduled', content_type: content_type || 'video', content_path: content_path || '', cover_path: cover_path || '', description: description || '' };
  insert('publish_tasks', task);
  res.status(201).json(task);
});

router.put('/:id', (req, res) => {
  const fields = ['title', 'platform', 'scheduled_at', 'status', 'content_type', 'description'];
  const data = {};
  fields.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
  update('publish_tasks', { id: req.params.id }, data);
  res.json(get('publish_tasks', { id: req.params.id }));
});

router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: '状态不能为空' });
  update('publish_tasks', { id: req.params.id }, { status });
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => { remove('publish_tasks', { id: req.params.id }); res.json({ ok: true }); });

module.exports = router;
