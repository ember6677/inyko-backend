/* ============================================================
   INYKO AI 营销策划中心 — 前端逻辑（事件委托版）
   0 个内联 onclick，所有事件通过 addEventListener 绑定
   ============================================================ */

(function() {
'use strict';

const API_BASE = window.location.origin;

// ======================== TOAST ========================
function toast(msg, type) {
  type = type || 'info';
  document.querySelectorAll('.toast').forEach(function(t) { t.remove(); });
  var el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.textContent = msg;
  el.style.cssText = 'opacity:1;transition:opacity 0.3s;';
  document.body.appendChild(el);
  var duration = type === 'error' ? 6000 : 3500;
  setTimeout(function() { el.style.opacity = '0'; setTimeout(function() { el.remove(); }, 300); }, duration);
  var logFn = type === 'error' ? console.error : console.log;
  logFn('[INYKO]', msg);
}

// ======================== UTILS ========================
function getVal(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function getPlatforms() {
  var checks = document.querySelectorAll('#platformCheckboxes input[type=checkbox]:checked');
  var list = [];
  checks.forEach(function(c) { list.push(c.value); });
  return list;
}

// ======================== TABS ========================
function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  document.getElementById('panel-' + tabId).classList.add('active');
  // Also highlight the right tab button
  var tabs = document.querySelectorAll('.tab');
  var map = { planner: 0, topics: 1, scripts: 2, calendar: 3 };
  if (map[tabId] !== undefined) tabs[map[tabId]].classList.add('active');

  if (tabId === 'topics') loadTopics();
  if (tabId === 'scripts') loadScripts();
  if (tabId === 'calendar') loadSchedule();
}

// Expose to global for the HTML tab buttons
window.switchTab = switchTab;

// ======================== GENERATE TOPICS ========================
window.generateTopics = function() {
  var brand = getVal('inputBrand');
  var product = getVal('inputProduct');
  if (!brand || !product) {
    alert('请填写品牌名称和产品/服务（两个字段都必须填）');
    toast('请填写品牌名称和产品/服务', 'error');
    return;
  }

  var btn = document.getElementById('btnGenerateTopics');
  var originalHTML = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span> AI 正在思考...';
  btn.disabled = true;

  fetch(API_BASE + '/api/ai/generate-topics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brandName: brand,
      product: product,
      targetAudience: getVal('inputAudience') || undefined,
      platforms: getPlatforms(),
      count: 6
    })
  })
  .then(function(res) {
    if (!res.ok) throw new Error('请求失败 (' + res.status + ')');
    return res.json();
  })
  .then(function(data) {
    var card = document.getElementById('topicsResultCard');
    var list = document.getElementById('topicsList');
    card.style.display = '';
    list.innerHTML = renderTopicCards(data.data || []);
    toast('成功生成 ' + (data.data||[]).length + ' 个选题！', 'success');
  })
  .catch(function(err) {
    console.error(err);
    var card = document.getElementById('topicsResultCard');
    card.style.display = '';
    document.getElementById('topicsList').innerHTML =
      '<div style="padding:20px;text-align:center;color:var(--rose);">' +
      '<div style="font-size:24px;margin-bottom:8px;">&#9888;&#65039;</div>' +
      '<div style="font-weight:600;margin-bottom:6px;">AI 生成失败</div>' +
      '<div style="font-size:13px;opacity:.8;">' + err.message + '</div>' +
      '<div style="margin-top:12px;font-size:12px;opacity:.6;">请检查 Render 后台的 GROQ_API_KEY 是否已配置，并稍后重试</div>' +
      '</div>';
    toast('AI 生成失败：' + err.message, 'error');
  })
  .finally(function() {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  });
};

// ======================== RENDER TOPIC CARDS ========================
function renderTopicCards(topics) {
  if (!topics || !topics.length) return '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">没有生成选题</div></div>';

  var colors = [
    { bg: 'var(--cyan-dim)', fg: 'var(--cyan)' },
    { bg: 'var(--violet-dim)', fg: 'var(--violet)' },
    { bg: 'var(--gold-dim)', fg: 'var(--gold)' },
    { bg: 'var(--green-dim)', fg: 'var(--green)' },
    { bg: 'var(--rose-dim)', fg: 'var(--rose)' },
    { bg: 'var(--cyan-dim)', fg: 'var(--cyan)' }
  ];

  var platformNames = { douyin: '抖音', xiaohongshu: '小红书', bilibili: 'B站', weixin: '视频号', kuaishou: '快手' };
  var engagementLabels = { high: '高互动', medium: '中互动', low: '低互动' };
  var engagementClasses = { high: 'tag-green', medium: 'tag-gold', low: 'tag-rose' };

  var html = '';
  topics.forEach(function(t, i) {
    var c = colors[i % 6];
    var titleSafe = (t.title || '未命名选题').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var descSafe = (t.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    var metaHTML = '';
    if (t.platforms) {
      t.platforms.forEach(function(p) {
        metaHTML += '<span class="tag tag-cyan">' + (platformNames[p] || p) + '</span>';
      });
    }
    if (t.tags && t.tags.length) {
      t.tags.slice(0, 3).forEach(function(tag) {
        metaHTML += '<span class="tag tag-violet">#' + tag.replace(/</g,'&lt;') + '</span>';
      });
    }
    metaHTML += '<span class="tag tag-gold">' + (t.bestPostTime || '--') + ' 最佳</span>';
    if (t.estimatedEngagement) {
      metaHTML += '<span class="tag ' + (engagementClasses[t.estimatedEngagement] || 'tag-rose') + '">' +
        (t.estimatedEngagement === 'high' ? '🔥' : t.estimatedEngagement === 'medium' ? '⭐' : '📊') +
        ' ' + (engagementLabels[t.estimatedEngagement] || '') + '</span>';
    }

    html +=
      '<div class="topic-card">' +
      '<div class="topic-num" style="background:' + c.bg + ';color:' + c.fg + ';">' + (i + 1) + '</div>' +
      '<div class="topic-info">' +
      '<div class="topic-title">' + titleSafe + '</div>' +
      '<div class="topic-desc">' + descSafe + '</div>' +
      '<div class="topic-meta">' + metaHTML + '</div>' +
      '</div>' +
      '<div class="topic-action">' +
      '<button class="btn btn-primary btn-sm" data-action="write-script" data-id="' + t.id + '" data-title="' + titleSafe + '">✍️ 写脚本</button>' +
      '<button class="btn btn-ghost btn-sm" data-action="approve" data-id="' + t.id + '">✅ 采用</button>' +
      '</div>' +
      '</div>';
  });

  return html;
}

// ======================== LOAD TOPICS ========================
function loadTopics() {
  var container = document.getElementById('topicsLibrary');
  var counter = document.getElementById('topicCount');

  fetch(API_BASE + '/api/ai/topics')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var topics = data.data || [];
      counter.textContent = topics.length + ' 条';
      if (!topics.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">还没有选题</div><div class="empty-desc">去「内容规划」页用 AI 生成第一批选题吧！</div></div>';
        return;
      }
      container.innerHTML = renderTopicCards(topics);
    })
    .catch(function(e) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">加载失败</div><div class="empty-desc">' + e.message + '</div></div>';
    });
}
window.loadTopics = loadTopics;

// ======================== LOAD SCRIPTS ========================
function loadScripts() {
  var container = document.getElementById('scriptsLibrary');
  var counter = document.getElementById('scriptCount');

  fetch(API_BASE + '/api/ai/scripts')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var scripts = data.data || [];
      counter.textContent = scripts.length + ' 个';
      if (!scripts.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📜</div><div class="empty-title">还没有脚本</div><div class="empty-desc">从选题库里选一个选题，点击「写脚本」即可用 AI 生成完整脚本</div></div>';
        return;
      }

      var html = '';
      scripts.forEach(function(s) {
        var titleSafe = (s.topicTitle || '未命名视频').replace(/</g,'&lt;');
        var hookSafe = (s.hook || '').slice(0, 120);
        html +=
          '<div class="script-view" style="cursor:pointer;" data-action="view-script" data-script-id="' + s.id + '">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
          '<div>' +
          '<div style="font-size:15px;font-weight:600;">' + titleSafe + '</div>' +
          '<div style="font-size:11px;color:var(--text-3);margin-top:2px;">' + (s.duration || '30s') + ' · ' + new Date(s.createdAt || Date.now()).toLocaleString() + '</div>' +
          '</div>' +
          '<span style="background:var(--cyan-dim);color:var(--cyan);font-size:11px;padding:3px 8px;border-radius:10px;">点击展开</span>' +
          '</div>' +
          '<div style="font-size:13px;color:var(--text-2);line-height:1.6;">' + hookSafe + '...</div>' +
          '</div>';
      });
      container.innerHTML = html;
    })
    .catch(function() {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">加载失败</div></div>';
    });
}
window.loadScripts = loadScripts;

// ======================== VIEW SCRIPT MODAL (using fetched data) ========================
function viewScriptById(scriptId) {
  toast('加载脚本中...', 'info');
  fetch(API_BASE + '/api/ai/scripts')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var scripts = data.data || [];
      var s = null;
      for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].id === scriptId) { s = scripts[i]; break; }
      }
      if (!s) { toast('脚本未找到', 'error'); return; }
      showScriptModal(s, s.topicTitle || '脚本详情');
    })
    .catch(function(e) { toast('加载失败: ' + e.message, 'error'); });
}

// ======================== SHOW SCRIPT MODAL ========================
function showScriptModal(script, title) {
  var titleSafe = String(title || '').replace(/</g, '&lt;');
  var hookSafe = String(script.hook || '').replace(/</g, '&lt;');
  var ctaSafe = String(script.cta || '').replace(/</g, '&lt;');
  var bgmSafe = String(script.bgm || '').replace(/</g, '&lt;');

  var scenesHTML = '';
  if (script.scenes && script.scenes.length) {
    script.scenes.forEach(function(s) {
      scenesHTML +=
        '<div class="scene-row">' +
        '<div class="scene-time">' + (s.time || '') + '</div>' +
        '<div class="scene-visual">📷 ' + (s.visual || '').replace(/</g,'&lt;') + '</div>' +
        '<div class="scene-audio">🗣️ ' + (s.audio || '').replace(/</g,'&lt;') + '</div>' +
        '<div class="scene-text">📝 ' + (s.text || '').replace(/</g,'&lt;') + '</div>' +
        '</div>';
    });
  }

  var tagsHTML = '';
  if (script.tags && script.tags.length) {
    script.tags.forEach(function(t) {
      tagsHTML += '<span class="tag tag-gold">' + t.replace(/</g,'&lt;') + '</span>';
    });
  }

  var modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);z-index:10000;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML =
    '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:20px;max-width:720px;width:94%;max-height:85vh;overflow-y:auto;padding:32px;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
    '<div><h2 style="font-size:18px;">' + titleSafe + '</h2><p style="font-size:12px;color:var(--text-3);margin-top:4px;">AI 生成的拍摄脚本</p></div>' +
    '<button data-action="close-modal" style="background:none;border:none;color:var(--text-3);cursor:pointer;font-size:24px;">&times;</button>' +
    '</div>' +

    '<div style="background:linear-gradient(135deg,var(--cyan-dim),var(--violet-dim));padding:16px;border-radius:12px;margin-bottom:20px;">' +
    '<div style="font-size:12px;color:var(--text-3);margin-bottom:6px;">🎬 开场钩子</div>' +
    '<div style="font-size:16px;font-weight:600;color:var(--text-1);line-height:1.6;">' + hookSafe + '</div>' +
    '</div>' +

    '<div style="margin-bottom:20px;">' +
    '<div style="font-size:12px;color:var(--text-3);margin-bottom:12px;">📹 分镜脚本</div>' +
    scenesHTML +
    '</div>' +

    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +
    '<div style="background:var(--bg-surface);padding:14px;border-radius:12px;">' +
    '<div style="font-size:12px;color:var(--text-3);margin-bottom:6px;">🔚 结尾引导语</div>' +
    '<div style="font-size:13px;color:var(--text-1);line-height:1.6;">' + ctaSafe + '</div>' +
    '</div>' +
    '<div style="background:var(--bg-surface);padding:14px;border-radius:12px;">' +
    '<div style="font-size:12px;color:var(--text-3);margin-bottom:6px;">🎵 BGM 建议</div>' +
    '<div style="font-size:13px;color:var(--text-1);line-height:1.6;">' + bgmSafe + '</div>' +
    '</div>' +
    '</div>' +

    '<div style="margin-top:16px;padding:14px;background:var(--gold-dim);border-radius:12px;">' +
    '<div style="font-size:12px;color:var(--gold);margin-bottom:6px;">🏷️ 推荐话题标签</div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;">' + tagsHTML + '</div>' +
    '</div>' +

    '<div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end;">' +
    '<button class="btn btn-secondary" data-action="copy-script">📋 复制脚本</button>' +
    '<button class="btn btn-primary" data-action="close-modal-and-scripts">查看脚本库</button>' +
    '</div>' +
    '</div>';

  modal._scriptData = script;
  document.body.appendChild(modal);
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.remove();
  });
}

// ======================== GENERATE SCRIPT FOR TOPIC ========================
window.generateScriptForTopic = function(topicId, topicTitle) {
  var brand = getVal('inputBrand');
  var product = getVal('inputProduct');
  var audience = getVal('inputAudience');
  toast('正在为「' + topicTitle + '」生成脚本...', 'info');

  fetch(API_BASE + '/api/ai/generate-script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topicTitle: topicTitle,
      topicDescription: '',
      brandName: brand,
      product: product,
      targetAudience: audience,
      duration: 30,
      style: 'engaging'
    })
  })
  .then(function(res) {
    if (!res.ok) throw new Error('脚本生成失败 (' + res.status + ')');
    return res.json();
  })
  .then(function(data) {
    showScriptModal(data.data, topicTitle);
    loadScripts();
    toast('脚本已生成并保存到脚本库！', 'success');
  })
  .catch(function(err) {
    console.error(err);
    toast('脚本生成失败：' + err.message, 'error');
  });
};

// ======================== APPROVE / DELETE ========================
function approveTopic(id) {
  fetch(API_BASE + '/api/ai/topic-status/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved' })
  }).then(function() { toast('选题已标记为采用 ✓', 'success'); })
    .catch(function() { toast('操作失败', 'error'); });
}

window.deleteTopic = function(id) {
  fetch(API_BASE + '/api/ai/topics/' + id, { method: 'DELETE' })
    .then(function() { loadTopics(); toast('选题已删除', 'success'); })
    .catch(function() { toast('删除失败', 'error'); });
};

// ======================== CALENDAR ========================
window.generateCalendarFromTopics = function() {
  var brand = getVal('inputBrand');
  var product = getVal('inputProduct');
  toast('AI 正在为你生成一周排期...', 'info');

  fetch(API_BASE + '/api/ai/topics')
    .then(function(res) { return res.json(); })
    .then(function(topicsData) {
      var topics = (topicsData.data || []).slice(0, 7);
      return fetch(API_BASE + '/api/ai/content-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brand,
          product: product,
          platforms: getPlatforms(),
          topics: topics
        })
      });
    })
    .then(function(res) {
      if (!res.ok) throw new Error('排期生成失败 (' + res.status + ')');
      return res.json();
    })
    .then(function(calData) {
      renderCalendar(calData.data);
      toast('排期已生成！', 'success');
    })
    .catch(function(e) {
      toast('排期生成失败：' + e.message, 'error');
    });
};

function loadSchedule() {
  fetch(API_BASE + '/api/ai/schedule')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      renderCalendar({ calendar: [], weeklyStrategy: '', scheduleItems: data.data || [] });
    }).catch(function() {});
}

function renderCalendar(data) {
  var container = document.getElementById('calendarArea');
  var items = data.scheduleItems || [];
  var weekStrategy = data.weeklyStrategy || '';
  var days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  var grouped = {};
  items.forEach(function(item) {
    var d = item.date || item.scheduledDate || '未安排';
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(item);
  });

  var today = new Date();
  var weekDates = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(today);
    d.setDate(today.getDate() + i);
    var dateStr = d.toISOString().slice(0, 10);
    var dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
    weekDates.push({ date: dateStr, day: days[dayIdx], isToday: i === 0 });
  }

  var platformIdx = { douyin: 0, xiaohongshu: 1, bilibili: 2, weixin: 3, kuaishou: 4 };
  var platformColors = {
    douyin: { bg: 'var(--cyan-dim)', fg: 'var(--cyan)' },
    xiaohongshu: { bg: 'var(--violet-dim)', fg: 'var(--violet)' },
    bilibili: { bg: 'rgba(0,229,160,.06)', fg: 'var(--green)' },
    weixin: { bg: 'var(--gold-dim)', fg: 'var(--gold)' }
  };

  var html = '';
  if (weekStrategy) {
    html += '<div style="padding:14px;background:linear-gradient(135deg,var(--cyan-dim),var(--violet-dim));border-radius:12px;margin-bottom:20px;font-size:13px;color:var(--text-1);line-height:1.7;"><strong>本周策略：</strong>' + weekStrategy.replace(/</g,'&lt;') + '</div>';
  }

  html += '<div class="cal-week"><div></div>';
  days.forEach(function(d) { html += '<div class="cal-day-name">' + d + '</div>'; });
  html += '</div>';

  weekDates.forEach(function(w) {
    var dayItems = grouped[w.date] || [];
    html += '<div class="cal-row"><div class="cal-date-cell" style="' + (w.isToday ? 'font-weight:700;color:var(--cyan);' : '') + '">' + w.date.slice(5) + '<br><small>' + w.day + (w.isToday ? '·今天' : '') + '</small></div>';
    for (var col = 0; col < 7; col++) {
      var found = null;
      for (var di = 0; di < dayItems.length; di++) {
        var idx = platformIdx[dayItems[di].platform];
        if (idx === col) { found = dayItems[di]; break; }
      }
      if (found) {
        var pc = platformColors[found.platform] || { bg: 'var(--cyan-dim)', fg: 'var(--cyan)' };
        html += '<div class="cal-item" style="background:' + pc.bg + ';color:' + pc.fg + ';">' + (found.time || '') + ' ' + (found.title || found.type || '') + '</div>';
      } else {
        html += '<div></div>';
      }
    }
    html += '</div>';
  });

  if (items.length === 0 && !weekStrategy) {
    html += '<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-title">暂无排期计划</div><div class="empty-desc">点击「AI 自动排期」让 AI 为你规划一周的内容发布计划</div></div>';
  }

  container.innerHTML = html;
}
window.loadSchedule = loadSchedule;

// ======================== COPY SCRIPT ========================
function copyScriptText() {
  var modal = document.querySelector('[style*="max-width:720px"]');
  if (!modal) return;
  var parent = modal.closest('[style*="position:fixed"]');
  var s = (parent || {})._scriptData;
  if (!s) { toast('无法读取脚本数据', 'error'); return; }

  var lines = [];
  lines.push('【开场】' + (s.hook || ''));
  if (s.scenes) {
    s.scenes.forEach(function(sc) {
      lines.push('[' + (sc.time||'') + '] ' + (sc.audio||'') + ' | ' + (sc.text||''));
    });
  }
  lines.push('【结尾】' + (s.cta || ''));
  lines.push('【BGM】' + (s.bgm || ''));
  lines.push('【标签】' + (s.tags || []).join(' '));
  var text = lines.join('\n');

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() { toast('脚本已复制到剪贴板', 'success'); });
  } else {
    toast('请手动复制：浏览器不支持剪贴板', 'error');
  }
}

// ======================== EVENT DELEGATION ========================
document.addEventListener('click', function(e) {
  var el = e.target;

  // Walk up to find a [data-action] element (max 3 levels)
  for (var i = 0; i < 3; i++) {
    if (!el || el === document.body) break;
    var action = el.getAttribute ? el.getAttribute('data-action') : null;
    if (action) break;
    el = el.parentElement;
  }
  if (!el || !el.getAttribute) return;
  var action = el.getAttribute('data-action');
  if (!action) return;

  var id = el.getAttribute('data-id') || '';
  var title = el.getAttribute('data-title') || '';

  switch (action) {
    case 'write-script':
      window.generateScriptForTopic(id, title);
      break;
    case 'approve':
      approveTopic(id);
      break;
    case 'view-script':
      var scriptId = el.getAttribute('data-script-id');
      if (scriptId) viewScriptById(scriptId);
      break;
    case 'close-modal':
      var modal = el.closest('[style*="position:fixed"]');
      if (modal) modal.remove();
      break;
    case 'close-modal-and-scripts':
      var m = el.closest('[style*="position:fixed"]');
      if (m) m.remove();
      switchTab('scripts');
      break;
    case 'copy-script':
      copyScriptText();
      break;
  }
});

// ======================== INIT ========================
// Load saved brand config from localStorage
(function() {
  try {
    var saved = localStorage.getItem('inyko_ai_brand');
    if (saved) {
      var cfg = JSON.parse(saved);
      if (cfg.brand) document.getElementById('inputBrand').value = cfg.brand;
      if (cfg.product) document.getElementById('inputProduct').value = cfg.product;
      if (cfg.audience) document.getElementById('inputAudience').value = cfg.audience;
    }
  } catch(e) {}

  // Auto-save on input change
  ['inputBrand', 'inputProduct', 'inputAudience'].forEach(function(id) {
    var input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', function() {
        localStorage.setItem('inyko_ai_brand', JSON.stringify({
          brand: getVal('inputBrand'),
          product: getVal('inputProduct'),
          audience: getVal('inputAudience')
        }));
      });
    }
  });
})();

})();
