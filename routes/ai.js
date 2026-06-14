// INYKO AI 营销引擎 — Google Gemini 集成
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ========== 通用 Gemini 调用 ==========
async function callGemini(prompt, temperature = 0.7) {
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: 2048,
        topP: 0.95,
        topK: 40
      }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API 错误 (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ========== API 端点 ==========

// POST /api/ai/generate-topics — AI 生成内容选题
router.post('/generate-topics', async (req, res) => {
  try {
    const { brandName, product, targetAudience, platforms, count = 5 } = req.body;
    
    if (!brandName || !product) return res.status(400).json({ error: '缺少品牌名或产品信息' });

    const prompt = `你是一个资深社交媒体内容策划师，擅长抖音、小红书、B站等平台的内容运营。

请为以下品牌生成 ${count} 个短视频/图文内容选题：

**品牌**: ${brandName}
**产品/服务**: ${product}
**目标受众**: ${targetAudience || '25-35岁职场人群'}
**发布平台**: ${platforms?.join('、') || '抖音、小红书、B站'}

要求：
1. 每个选题必须具体可执行，不是泛泛而谈
2. 标题要吸引人（符合中文互联网传播规律）
3. 标注适合的平台
4. 给出预计互动率（高/中/低）
5. 用 JSON 数组格式返回

返回格式（严格JSON数组）：
[
  {
    "title": "选题标题",
    "description": "内容描述（2-3句话说明拍什么/说什么）",
    "platforms": ["douyin"],
    "contentType": "video",
    "estimatedEngagement": "high",
    "tags": ["标签1", "标签2"],
    "bestPostTime": "18:00",
    "scriptHint": "脚本方向提示"
  }
]`;

    const rawText = await callGemini(prompt);
    
    // 提取 JSON
    let topics;
    try {
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) topics = JSON.parse(jsonMatch[0]);
      else topics = JSON.parse(rawText);
    } catch (e) {
      // 如果解析失败，手动构造
      const lines = rawText.split('\n').filter(l => l.trim());
      topics = lines.slice(0, count).map((line, i) => ({
        id: uuidv4(),
        title: line.slice(0, 50),
        description: line.slice(0, 100),
        platforms: ['douyin'],
        contentType: 'video',
        estimatedEngagement: 'medium',
        tags: [],
        bestPostTime: '18:00',
        scriptHint: ''
      }));
    }

    // 存入数据库
    topics.forEach(t => {
      t.id = t.id || uuidv4();
      t.createdAt = new Date().toISOString();
      t.status = 'draft';
      db.insert('ai_topics', t);
    });

    res.json({ code: 0, data: topics });
  } catch (err) {
    console.error('AI generate-topics error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/generate-script — AI 生成视频脚本
router.post('/generate-script', async (req, res) => {
  try {
    const { topicTitle, topicDescription, brandName, product, duration = 30, style = 'engaging' } = req.body;

    if (!topicTitle || !topicDescription) return res.status(400).json({ error: '缺少选题信息' });

    const prompt = `你是专业短视频脚本编剧。根据以下选题生成完整的拍摄脚本：

**品牌**: ${brandName || ''}
**产品**: ${product || ''}
**选题**: ${topicTitle}
**描述**: ${topicDescription}
**视频时长**: 约 ${duration} 秒
**风格**: ${style === 'humorous' ? '幽默搞笑' : style === 'professional' ? '专业干货' : style === 'storytelling' ? '故事叙事' : '轻松有趣'}

请输出：
1. 开场钩子（前3秒抓住观众）
2. 分镜脚本（按秒数划分每个镜头）
3. 口播文案（完整逐字稿）
4. 字幕文字
5. BGM建议
6. 结尾引导语（CTA）
7. 推荐话题标签（#格式）

用 JSON 格式返回：
{
  "hook": "开场3秒话术",
  "scenes": [
    {"time": "0-5s", "visual": "画面描述", "audio": "口播文案", "text": "屏幕字幕"}
  ],
  "cta": "结尾引导",
  "bgm": "BGM建议",
  "tags": ["#标签"],
  "duration": "${duration}s"
}`;

    const rawText = await callGemini(prompt);

    let script;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      script = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch (e) {
      script = {
        hook: rawText.slice(0, 100),
        scenes: [{ time: '0-30s', visual: '产品展示', audio: rawText.slice(0, 200), text: '' }],
        cta: '关注我了解更多',
        bgm: '轻快背景音乐',
        tags: ['#热门'],
        duration: `${duration}s`
      };
    }

    // 保存脚本到数据库
    script.id = uuidv4();
    script.topicTitle = topicTitle;
    script.createdAt = new Date().toISOString();
    db.insert('ai_scripts', script);

    res.json({ code: 0, data: script });
  } catch (err) {
    console.error('AI generate-script error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/generate-titles — AI 生成爆款标题
router.post('/generate-titles', async (req, res) => {
  try {
    const { topic, platform, count = 8 } = req.body;

    const prompt = `你是抖音/小红书爆款标题专家。针对"${topic}"这个内容主题，生成 ${count} 个有爆款潜力的标题。

平台: ${platform || '抖音'}

要求：
- 符合平台调性（抖音偏口语化+悬念，小红书偏精致+emoji，B站偏梗+深度）
- 利用数字法则、反差法、痛点法等技巧
- 每个标题不超过20字
- 返回纯 JSON 数组: ["标题1","标题2",...]`;

    const rawText = await callGemini(prompt, 0.9); // 更高的创意性
    
    let titles;
    try {
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      titles = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
      if (!Array.isArray(titles)) titles = [rawText];
    } catch (e) {
      titles = rawText.split('\n').filter(l => l.trim()).slice(0, count);
    }

    res.json({ code: 0, data: titles.slice(0, count) });
  } catch (err) {
    console.error('AI generate-titles error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/content-calendar — AI 生成一周排期
router.post('/content-calendar', async (req, res) => {
  try {
    const { brandName, product, topics, platforms } = req.body;

    const prompt = `你是一个专业的社交媒体运营总监。请基于以下信息，生成未来7天的内容排期计划。

品牌: ${brandName || ''}
产品: ${product || ''}
已有选题/任务: ${(topics || []).map(t => typeof t === 'string' ? t : t.title || '').join('；') || '待定'}
目标平台: ${platforms?.join('、') || '抖音、小红书'}

要求：
1. 每天1-3条内容
2. 不同平台错开发布时间（避免同质化）
3. 周末和节假日适当调整策略
4. 标注最佳发布时间段
5. 内容类型混合（视频/图文/直播预告）

用严格 JSON 格式返回：
{
  "calendar": [
    {
      "date": "2026-MM-DD",
      "dayOfWeek": "周一",
      "items": [
        {
          "time": "08:00",
          "platform": "xiaohongshu",
          "type": "image",
          "title": "内容标题",
          "status": "planned"
        }
      ]
    }
  ],
  "weeklyStrategy": "本周整体策略说明"
}`;

    const rawText = await callGemini(prompt);
    
    let calendar;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      calendar = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch (e) {
      calendar = { calendar: [], weeklyStrategy: rawText };
    }

    // 保存排期
    calendar.calendar?.forEach(day => {
      day.items?.forEach(item => {
        item.id = uuidv4();
        item.createdAt = new Date().toISOString();
        db.insert('publish_schedule', item);
      });
    });

    res.json({ code: 0, data: calendar });
  } catch (err) {
    console.error('AI content-calendar error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/topics — 获取已生成的所有选题
router.get('/topics', (req, res) => {
  const topics = db.all('ai_topics').sort((a, b) =>
    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  res.json({ code: 0, data: Array.isArray(topics) ? topics : [] });
});

// GET /api/ai/scripts — 获取已生成的所有脚本
router.get('/scripts', (req, res) => {
  const scripts = db.all('ai_scripts').sort((a, b) =>
    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  res.json({ code: 0, data: Array.isArray(scripts) ? scripts : [] });
});

// GET /api/ai/schedule — 获取发布排期
router.get('/schedule', (req, res) => {
  const schedule = db.all('publish_schedule');
  res.json({ code: 0, data: Array.isArray(schedule) ? schedule : [] });
});

// DELETE /api/ai/topics/:id — 删除选题
router.delete('/topics/:id', (req, res) => {
  db.remove('ai_topics', { id: req.params.id });
  res.json({ code: 0, message: '删除成功' });
});

// DELETE /api/ai/scripts/:id — 删除脚本
router.delete('/scripts/:id', (req, res) => {
  db.remove('ai_scripts', { id: req.params.id });
  res.json({ code: 0, message: '删除成功' });
});

// PUT /api/ai/topic-status/:id — 更新选题状态（draft→approved→producing→published）
router.put('/topic-status/:id', (req, res) => {
  const { status } = req.body;
  if (!['draft', 'approved', 'producing', 'published'].includes(status)) {
    return res.status(400).json({ error: '无效状态' });
  }
  db.update('ai_topics', { id: req.params.id }, { status, updatedAt: new Date().toISOString() });
  res.json({ code: 0, message: '状态已更新' });
});

module.exports = router;
