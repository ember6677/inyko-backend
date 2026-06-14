// 视频剪辑任务 API
const express = require('express');
const router = express.Router();
const { all, get, insert, update, remove } = require('../db');

router.get('/', (req, res) => {
  res.json(all('video_tasks'));
});

router.get('/:id', (req, res) => {
  const task = get('video_tasks', { id: req.params.id });
  if (!task) return res.status(404).json({ error: '任务不存在' });
  res.json(task);
});

router.post('/', (req, res) => {
  const { name, source_path } = req.body;
  if (!name) return res.status(400).json({ error: '任务名称不能为空' });
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const task = { id, name, source_path: source_path || '', status: 'pending', progress: 0, result_path: '', duration: 0, error_msg: '', clip_count: 0 };
  insert('video_tasks', task);
  res.status(201).json(task);
});

router.put('/:id', (req, res) => {
  const existing = get('video_tasks', { id: req.params.id });
  if (!existing) return res.status(404).json({ error: '任务不存在' });
  const fields = ['name', 'status', 'progress', 'result_path', 'duration', 'error_msg', 'clip_count'];
  const data = {};
  fields.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
  update('video_tasks', { id: req.params.id }, data);
  res.json(get('video_tasks', { id: req.params.id }));
});

router.delete('/:id', (req, res) => {
  remove('video_tasks', { id: req.params.id });
  res.json({ ok: true });
});

module.exports = router;
