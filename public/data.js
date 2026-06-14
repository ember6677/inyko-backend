// ============================================================
//  INYKO 控制面板 · 动态数据层
//  功能：localStorage 持久化 / JSON 导入导出 / API 对接预留
// ============================================================

(function () {
  'use strict';

  // ── 默认数据 ──
  const DEFAULTS = {
    metrics: [
      { label: '今日播放总量', value: 128400, unit: '次', trend: '+23.4% 昨日', trendUp: true },
      { label: '粉丝净增',   value: 1284,   unit: '人', trend: '+18.7% 昨日', trendUp: true },
      { label: 'AI 自动完成', value: 23,     unit: '项', trend: '较昨日 +5',   trendUp: true },
      { label: '内容互动率', value: 6.8,    unit: '%',  trend: '行业均值 3.2%', trendUp: true },
      { label: '待处理任务', value: 7,      unit: '项', trend: '需人工审核',    trendUp: false },
    ],
    videoQueue: [
      { name: '隔音舱展示 · 天河展厅新品发布现场', meta: '原始 08:24 · AI 压缩目标 60s', progress: 78, status: 'processing', statusLabel: '剪辑中' },
      { name: '客户证言 · 某头部科技公司 HR 采访', meta: '原始 05:12 · AI 剪辑 45s', progress: 100, status: 'done', statusLabel: '待审核' },
      { name: '产品功能讲解 · 静音新风系统原理', meta: '原始 12:36 · 拆分 3 条', progress: 0, status: 'waiting', statusLabel: '等待中' },
      { name: '安装现场 · 深圳某联合办公实拍', meta: '编码错误：不支持 H.265', progress: 15, status: 'error', statusLabel: '需修复' },
    ],
    watermarkTasks: [
      { name: '封面_抖音_隔音舱评测.jpg', quality: '品质 98', status: 'done',    statusLabel: '完成' },
      { name: '封面_小红书_办公场景.png', quality: 'AI精修中',  status: 'processing', statusLabel: '进行中' },
      { name: '封面_视频号_新品发布×3',  quality: '排队',       status: 'waiting', statusLabel: '等待' },
      { name: '封面_B站_封面模板批量',     quality: '×8张',      status: 'review', statusLabel: '待审' },
    ],
    activityLog: [
      { time: '09:47', color: 'green',  text: '<strong>封面精修完成</strong> · 抖音新品封面，AI评分 98 分' },
      { time: '09:32', color: 'cyan',   text: '<strong>视频剪辑开始</strong> · 天河展厅视频，预计 12 分钟完成' },
      { time: '09:15', color: 'violet', text: '<strong>内容计划生成</strong> · 下周 7 天 14 条内容规划就绪' },
      { time: '08:58', color: 'rose',   text: '<strong>发布失败</strong> · B站 API 超时，已加入重试队列' },
      { time: '08:30', color: 'green',  text: '<strong>小红书发布成功</strong> · 「静音工作舱体验」获 2.4k 点赞' },
      { time: '08:00', color: 'gold',   text: '<strong>流量密码更新</strong> · 发现 3 个新上升关键词' },
    ],
    apiBase: '',
    apiToken: '',
    apiEnabled: false,
  };

  // ── 深度合并默认值（保留 DEFAULTS 中但未在 saved 里出现的字段） ──
  function mergeDefaults(saved) {
    var result = JSON.parse(JSON.stringify(DEFAULTS));
    for (var key in saved) {
      if (saved.hasOwnProperty(key)) {
        result[key] = saved[key];
      }
    }
    return result;
  }

  // ── 加载数据 ──
  function loadData() {
    try {
      var raw = localStorage.getItem('inyko_dashboard');
      if (raw) {
        var parsed = JSON.parse(raw);
        return mergeDefaults(parsed);
      }
    } catch (e) { console.warn('[数据层] localStorage 读取失败', e); }
    return JSON.parse(JSON.stringify(DEFAULTS));
  }

  // ── 保存数据 ──
  function saveData(data) {
    try {
      localStorage.setItem('inyko_dashboard', JSON.stringify(data));
      showToast('✅ 数据已保存');
    } catch (e) {
      console.error('[数据层] 保存失败', e);
      showToast('❌ 保存失败：' + e.message, true);
    }
  }

  // ── Toast 提示 ──
  function showToast(msg, isError) {
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText =
      'position:fixed;bottom:24px;right:24px;z-index:99999;' +
      'padding:10px 18px;border-radius:10px;font-size:13px;font-weight:500;' +
      'color:#08090f;background:' + (isError ? '#fb7185' : '#00e5a0') + ';' +
      'box-shadow:0 8px 32px rgba(0,0,0,0.4);' +
      'animation:fadeUp 0.3s ease both;';
    document.body.appendChild(el);
    setTimeout(function() {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(function() { el.remove(); }, 300);
    }, 2200);
  }

  // ============================================================
  //  设置弹窗（动态创建）
  // ============================================================
  var settingsCreated = false;

  function ensureSettingsModal() {
    if (settingsCreated && document.getElementById('settingsModal')) return;
    var html =
      '<div id="settingsModal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);" onclick="if(event.target===this)toggleSettings()">' +
        '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(540px,92vw);max-height:86vh;overflow-y:auto;background:var(--bg-card);border:1px solid var(--border-lit);border-radius:var(--r-xl);padding:24px;">' +

          // 标题栏
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">' +
            '<div style="font-size:16px;font-weight:700;color:var(--text-1);">⚙️ 数据设置</div>' +
            '<button onclick="toggleSettings()" style="background:none;border:none;color:var(--text-3);cursor:pointer;font-size:20px;line-height:1;">✕</button>' +
          '</div>' +

          // Tab 栏
          '<div style="display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap;" id="settingsTabs">' +
            '<button class="setTabBtn" data-tab="metrics" style="padding:6px 12px;border-radius:8px;font-size:12px;cursor:pointer;border:1px solid var(--cyan);background:var(--cyan);color:#08090f;font-weight:600;">核心指标</button>' +
            '<button class="setTabBtn" data-tab="queue" style="padding:6px 12px;border-radius:8px;font-size:12px;cursor:pointer;border:1px solid var(--border);background:transparent;color:var(--text-2);">剪辑队列</button>' +
            '<button class="setTabBtn" data-tab="logs" style="padding:6px 12px;border-radius:8px;font-size:12px;cursor:pointer;border:1px solid var(--border);background:transparent;color:var(--text-2);">系统日志</button>' +
            '<button class="setTabBtn" data-tab="api" style="padding:6px 12px;border-radius:8px;font-size:12px;cursor:pointer;border:1px solid var(--border);background:transparent;color:var(--text-2);">API 对接</button>' +
            '<button class="setTabBtn" data-tab="import" style="padding:6px 12px;border-radius:8px;font-size:12px;cursor:pointer;border:1px solid var(--border);background:transparent;color:var(--text-2);">导入/导出</button>' +
          '</div>' +

          // Tab 内容区
          '<div id="settingsContent"></div>' +

        '</div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', html);
    settingsCreated = true;

    // Tab 切换事件
    document.querySelectorAll('.setTabBtn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        switchSettingsTab(this.dataset.tab, this);
      });
    });
  }

  window.toggleSettings = function() {
    ensureSettingsModal();
    var modal = document.getElementById('settingsModal');
    if (!modal) return;
    if (modal.style.display === 'none') {
      modal.style.display = 'block';
      switchSettingsTab('metrics', document.querySelector('.setTabBtn[data-tab="metrics"]'));
    } else {
      modal.style.display = 'none';
    }
  };

  function switchSettingsTab(tab, btn) {
    // 更新按钮样式
    document.querySelectorAll('.setTabBtn').forEach(function(b) {
      b.style.background = 'transparent';
      b.style.color = 'var(--text-2)';
      b.style.fontWeight = '400';
      b.style.borderColor = 'var(--border)';
    });
    if (btn) {
      btn.style.background = 'var(--cyan)';
      btn.style.color = '#08090f';
      btn.style.fontWeight = '600';
      btn.style.borderColor = 'var(--cyan)';
    }

    var content = document.getElementById('settingsContent');
    if (!content) return;

    if (tab === 'metrics')  renderMetricsEditor(content);
    if (tab === 'queue')    renderQueueEditor(content);
    if (tab === 'logs')     renderLogsEditor(content);
    if (tab === 'api')      renderApiSettings(content);
    if (tab === 'import')   renderImportExport(content);
  }

  // ── Tab：核心指标 ──
  function renderMetricsEditor(container) {
    var data = loadData();
    var html = '<div style="display:flex;flex-direction:column;gap:10px;">';
    data.metrics.forEach(function(m, i) {
      html +=
        '<div style="display:grid;grid-template-columns:1fr 110px 60px 1fr 50px;gap:8px;align-items:center;">' +
          '<input value="' + escAttr(m.label) + '" data-i="' + i + '" data-field="label" placeholder="指标名" style="' + inputStyle + '">' +
          '<input type="number" value="' + m.value + '" data-i="' + i + '" data-field="value" style="' + inputStyleNum + '">' +
          '<input value="' + escAttr(m.unit) + '" data-i="' + i + '" data-field="unit" placeholder="单位" style="' + inputStyleSm + '">' +
          '<input value="' + escAttr(m.trend) + '" data-i="' + i + '" data-field="trend" placeholder="趋势文字" style="' + inputStyle + '">' +
          '<button onclick="removeMetric(' + i + ')" style="' + delBtnStyle + '">✕</button>' +
        '</div>';
    });
    html += '</div>';
    html += '<button class="btn btn-ghost btn-sm" style="margin-top:10px;width:100%;" onclick="addMetric()">＋ 添加指标</button>';
    html += '<button class="btn btn-primary btn-sm" style="margin-top:10px;width:100%;" onclick="saveMetrics()">💾 保存指标</button>';
    container.innerHTML = html;
  }

  window.addMetric = function() {
    var data = loadData();
    data.metrics.push({ label: '新指标', value: 0, unit: '', trend: '', trendUp: true });
    saveData(data);
    var btn = document.querySelector('.setTabBtn[data-tab="metrics"]');
    switchSettingsTab('metrics', btn);
  };

  window.removeMetric = function(i) {
    var data = loadData();
    data.metrics.splice(i, 1);
    saveData(data);
    var btn = document.querySelector('.setTabBtn[data-tab="metrics"]');
    switchSettingsTab('metrics', btn);
  };

  window.saveMetrics = function() {
    var data = loadData();
    var inputs = document.querySelectorAll('#settingsContent input[data-field]');
    var newMetrics = [];
    for (var i = 0; i < inputs.length; i++) {
      var inp = inputs[i];
      var idx = parseInt(inp.dataset.i);
      if (!newMetrics[idx]) {
        newMetrics[idx] = { label: '', value: 0, unit: '', trend: '', trendUp: true };
      }
      if (inp.dataset.field === 'value') {
        newMetrics[idx].value = parseFloat(inp.value) || 0;
      } else {
        newMetrics[idx][inp.dataset.field] = inp.value;
      }
    }
    // 按顺序整理（因为 inputs 可能乱序）
    var ordered = [];
    for (var j = 0; j <= Math.max.apply(null, Array.from(inputs).map(function(x) { return parseInt(x.dataset.i); })); j++) {
      if (newMetrics[j]) ordered.push(newMetrics[j]);
    }
    data.metrics = ordered.length ? ordered : newMetrics;
    saveData(data);
    applyMetricsToDOM(data);
  };

  function applyMetricsToDOM(data) {
    var cards = document.querySelectorAll('.metric-card');
    data.metrics.forEach(function(m, i) {
      if (!cards[i]) return;
      var labelEl = cards[i].querySelector('.metric-label');
      if (labelEl) labelEl.textContent = m.label;

      var valEl = cards[i].querySelector('.metric-value');
      if (valEl) {
        valEl.innerHTML = '<span class="count-animate" data-target="' + m.value + '">' + m.value.toLocaleString() + '</span><span class="metric-unit">' + m.unit + '</span>';
      }

      var trendEl = cards[i].querySelector('.metric-trend');
      if (trendEl) {
        trendEl.innerHTML = (m.trendUp
          ? '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 9l4-6 4 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> '
          : '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3l4 6 4-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> ')
          + m.trend;
        trendEl.className = 'metric-trend ' + (m.trendUp ? 'trend-up' : 'trend-down');
      }
    });
    showToast('✅ 指标已更新到面板');
  }

  // ── Tab：剪辑队列 ──
  function renderQueueEditor(container) {
    var data = loadData();
    var statusOpts = { processing: '剪辑中', done: '完成', waiting: '等待中', error: '错误' };
    var html = '<div style="display:flex;flex-direction:column;gap:8px;">';
    data.videoQueue.forEach(function(item, i) {
      html +=
        '<div style="display:grid;grid-template-columns:1fr 70px 90px 50px;gap:8px;align-items:center;padding:8px;background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;">' +
          '<input value="' + escAttr(item.name) + '" data-i="' + i + '" data-field="name" style="' + inputStyle + '">' +
          '<input type="number" value="' + item.progress + '" min="0" max="100" data-i="' + i + '" data-field="progress" style="' + inputStyleNum + '">' +
          '<select data-i="' + i + '" data-field="status" style="' + selectStyle + '">' +
            '<option value="processing"' + (item.status === 'processing' ? ' selected' : '') + '>剪辑中</option>' +
            '<option value="done"' + (item.status === 'done' ? ' selected' : '') + '>完成</option>' +
            '<option value="waiting"' + (item.status === 'waiting' ? ' selected' : '') + '>等待</option>' +
            '<option value="error"' + (item.status === 'error' ? ' selected' : '') + '>错误</option>' +
          '</select>' +
          '<button onclick="removeQueueItem(' + i + ')" style="' + delBtnStyle + '">✕</button>' +
        '</div>';
    });
    html += '</div>';
    html += '<button class="btn btn-ghost btn-sm" style="margin-top:10px;width:100%;" onclick="addQueueItem()">＋ 添加任务</button>';
    html += '<button class="btn btn-primary btn-sm" style="margin-top:8px;width:100%;" onclick="saveQueue()">💾 保存队列</button>';
    container.innerHTML = html;
  }

  window.addQueueItem = function() {
    var data = loadData();
    data.videoQueue.push({ name: '新任务', meta: '待配置', progress: 0, status: 'waiting', statusLabel: '等待中' });
    saveData(data);
    var btn = document.querySelector('.setTabBtn[data-tab="queue"]');
    switchSettingsTab('queue', btn);
  };

  window.removeQueueItem = function(i) {
    var data = loadData();
    data.videoQueue.splice(i, 1);
    saveData(data);
    var btn = document.querySelector('.setTabBtn[data-tab="queue"]');
    switchSettingsTab('queue', btn);
  };

  window.saveQueue = function() {
    var data = loadData();
    var rows = document.querySelectorAll('#settingsContent > div > div');
    var newQueue = [];
    rows.forEach(function(row) {
      var inputs = row.querySelectorAll('input,select');
      var status = inputs[2].value;
      var statusLabels = { processing: '剪辑中', done: '待审核', waiting: '等待中', error: '需修复' };
      newQueue.push({
        name: inputs[0].value,
        meta: '已更新',
        progress: parseInt(inputs[1].value) || 0,
        status: status,
        statusLabel: statusLabels[status] || status,
      });
    });
    data.videoQueue = newQueue;
    saveData(data);
    applyQueueToDOM(data);
    showToast('✅ 队列已更新');
  };

  function applyQueueToDOM(data) {
    var queueEl = document.getElementById('videoQueue');
    if (!queueEl) return;
    var statusColors = { processing: '#00d4ff', done: '#00e5a0', waiting: '#4a5070', error: '#fb7185' };
    var html = '';
    data.videoQueue.forEach(function(item) {
      var color = statusColors[item.status] || '#00d4ff';
      html +=
        '<div class="video-item">' +
          '<div class="video-thumb"><div class="video-thumb-inner" style="background:linear-gradient(135deg,#0a1a2e,#1a3a5e);color:var(--cyan);">VID</div></div>' +
          '<div class="video-info">' +
            '<div class="video-name">' + item.name + '</div>' +
            '<div class="video-meta">' + item.meta + '</div>' +
          '</div>' +
          '<div class="prog-bar"><div class="prog-fill" style="width:' + item.progress + '%;background:' + color + ';"></div></div>' +
          '<span style="font-size:11px;color:' + color + ';">' + item.progress + '%</span>' +
          '<span class="status-chip chip-' + item.status + '">' + item.statusLabel + '</span>' +
        '</div>';
    });
    queueEl.innerHTML = html;
  }

  // ── Tab：系统日志 ──
  function renderLogsEditor(container) {
    var data = loadData();
    var html = '<div style="display:flex;flex-direction:column;gap:8px;max-height:320px;overflow-y:auto;">';
    data.activityLog.forEach(function(log, i) {
      html +=
        '<div style="display:grid;grid-template-columns:70px 100px 1fr 50px;gap:8px;align-items:center;padding:8px;background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;">' +
          '<input value="' + escAttr(log.time) + '" data-i="' + i + '" data-field="time" style="' + inputStyleSm + '">' +
          '<select data-i="' + i + '" data-field="color" style="' + selectStyle + '">' +
            '<option value="green"' + (log.color === 'green' ? ' selected' : '') + '>🟢 绿</option>' +
            '<option value="cyan"' + (log.color === 'cyan' ? ' selected' : '') + '>🔵 青</option>' +
            '<option value="violet"' + (log.color === 'violet' ? ' selected' : '') + '>🟣 紫</option>' +
            '<option value="rose"' + (log.color === 'rose' ? ' selected' : '') + '>🔴 红</option>' +
            '<option value="gold"' + (log.color === 'gold' ? ' selected' : '') + '>🟡 金</option>' +
          '</select>' +
          '<input value="' + escAttr(log.text.replace(/<[^>]+>/g, '')) + '" data-i="' + i + '" data-field="text" style="' + inputStyle + '">' +
          '<button onclick="removeLogItem(' + i + ')" style="' + delBtnStyle + '">✕</button>' +
        '</div>';
    });
    html += '</div>';
    html += '<button class="btn btn-ghost btn-sm" style="margin-top:10px;width:100%;" onclick="addLogItem()">＋ 添加日志</button>';
    html += '<button class="btn btn-primary btn-sm" style="margin-top:8px;width:100%;" onclick="saveLogs()">💾 保存日志</button>';
    container.innerHTML = html;
  }

  window.addLogItem = function() {
    var data = loadData();
    var now = new Date();
    var time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    data.activityLog.unshift({ time: time, color: 'green', text: '<strong>新日志</strong> · 请编辑' });
    saveData(data);
    var btn = document.querySelector('.setTabBtn[data-tab="logs"]');
    switchSettingsTab('logs', btn);
  };

  window.removeLogItem = function(i) {
    var data = loadData();
    data.activityLog.splice(i, 1);
    saveData(data);
    var btn = document.querySelector('.setTabBtn[data-tab="logs"]');
    switchSettingsTab('logs', btn);
  };

  window.saveLogs = function() {
    var data = loadData();
    var rows = document.querySelectorAll('#settingsContent > div > div');
    var newLogs = [];
    rows.forEach(function(row) {
      var inputs = row.querySelectorAll('input,select');
      var txt = inputs[2].value;
      // 自动加 <strong> 到第一个 · 之前
      var strong = txt.split('·')[0] || txt;
      var rest = txt.split('·')[1] || '';
      newLogs.push({
        time: inputs[0].value,
        color: inputs[1].value,
        text: '<strong>' + strong.trim() + '</strong> · ' + rest.trim(),
      });
    });
    data.activityLog = newLogs;
    saveData(data);
    applyLogsToDOM(data);
    showToast('✅ 日志已更新');
  };

  function applyLogsToDOM(data) {
    var feeds = document.querySelectorAll('.activity-feed');
    if (!feeds.length) return;
    var html = '';
    data.activityLog.forEach(function(log) {
      html +=
        '<div class="activity-item">' +
          '<div class="act-dot" style="background:var(--' + log.color + ');"></div>' +
          '<div class="act-body">' +
            '<div class="act-text">' + log.text + '</div>' +
            '<div class="act-time">' + log.time + '</div>' +
          '</div>' +
        '</div>';
    });
    feeds.forEach(function(f) { f.innerHTML = html; });
  }

  // ── Tab：API 对接 ──
  function renderApiSettings(container) {
    var data = loadData();
    container.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:12px;">' +

        '<div>' +
          '<label style="font-size:12px;color:var(--text-3);display:block;margin-bottom:4px;">API 基础地址</label>' +
          '<input id="apiBase" type="text" value="' + escAttr(data.apiBase) + '" placeholder="https://your-api.com" style="' + inputStyle + '">' +
        '</div>' +

        '<div>' +
          '<label style="font-size:12px;color:var(--text-3);display:block;margin-bottom:4px;">API Token（可选）</label>' +
          '<input id="apiToken" type="password" value="' + escAttr(data.apiToken) + '" placeholder="Bearer token" style="' + inputStyle + '">' +
        '</div>' +

        '<label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-2);cursor:pointer;">' +
          '<input type="checkbox" id="apiEnabled"' + (data.apiEnabled ? ' checked' : '') + ' onchange="onApiToggle()"> 启用 API 模式（关闭则使用本地数据）' +
        '</label>' +

        '<button class="btn btn-secondary btn-sm" style="width:100%;" onclick="testApi()">🔌 测试连接</button>' +
        '<div id="apiTestResult" style="font-size:12px;margin-top:4px;"></div>' +

        '<button class="btn btn-primary btn-sm" style="margin-top:8px;width:100%;" onclick="saveApiSettings()">💾 保存 API 设置</button>' +

      '</div>';
  }

  window.onApiToggle = function() {
    // 实时保存到 data（不等多按保存）
    var data = loadData();
    data.apiEnabled = document.getElementById('apiEnabled').checked;
    saveData(data);
  };

  window.saveApiSettings = function() {
    var data = loadData();
    data.apiBase = document.getElementById('apiBase').value;
    data.apiToken = document.getElementById('apiToken').value;
    data.apiEnabled = document.getElementById('apiEnabled').checked;
    saveData(data);
    showToast('✅ API 设置已保存');
  };

  window.testApi = function() {
    var base = document.getElementById('apiBase').value;
    var resultEl = document.getElementById('apiTestResult');
    if (!base) {
      resultEl.textContent = '⚠️ 请先填写 API 基础地址';
      resultEl.style.color = 'var(--gold)';
      return;
    }
    resultEl.textContent = '⏳ 测试中…';
    resultEl.style.color = 'var(--cyan)';
    var token = document.getElementById('apiToken').value;
    fetch(base + '/health', {
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      mode: 'cors',
    }).then(function(r) {
      if (r.ok) {
        resultEl.textContent = '✅ 连接成功！API 可访问';
        resultEl.style.color = 'var(--green)';
      } else {
        resultEl.textContent = '⚠️ 连接返回 ' + r.status;
        resultEl.style.color = 'var(--gold)';
      }
    }).catch(function(e) {
      resultEl.textContent = '❌ 连接失败：' + e.message;
      resultEl.style.color = 'var(--rose)';
    });
  };

  // ── Tab：导入/导出 ──
  function renderImportExport(container) {
    container.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
        '<button class="btn btn-secondary btn-sm" style="width:100%;" onclick="exportData()">📤 导出数据（JSON 文件）</button>' +
        '<button class="btn btn-secondary btn-sm" style="width:100%;" onclick="importData()">📥 导入数据（上传 JSON）</button>' +
        '<input type="file" id="importFile" accept=".json" style="display:none;" onchange="handleImport(event)">' +
        '<div style="font-size:12px;color:var(--text-3);line-height:1.7;margin-top:8px;padding:12px;background:var(--bg-surface);border-radius:8px;border:1px solid var(--border);">' +
          '💡 <strong>导出</strong>：将所有面板数据保存为 JSON 文件<br>' +
          '💡 <strong>导入</strong>：从 JSON 文件恢复面板数据<br>' +
          '💡 数据自动保存在浏览器 localStorage 中<br>' +
          '💡 部署到公网后，每台设备有独立数据' +
        '</div>' +
        '<button class="btn btn-ghost btn-sm" style="width:100%;margin-top:8px;" onclick="resetData()">🗑️ 恢复默认数据</button>' +
      '</div>';
  }

  // ── 导出 ──
  window.exportData = function() {
    var data = loadData();
    // 移除不需要导出的字段
    var exportData = JSON.parse(JSON.stringify(data));
    var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'INYKO-控制面板-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('📤 数据已导出');
  };

  // ── 导入 ──
  window.importData = function() {
    document.getElementById('importFile').click();
  };

  window.handleImport = function(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);
        localStorage.setItem('inyko_dashboard', JSON.stringify(data));
        showToast('📥 导入成功！正在刷新…');
        setTimeout(function() { location.reload(); }, 800);
      } catch (err) {
        showToast('❌ JSON 解析失败：' + err.message, true);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // ── 恢复默认 ──
  window.resetData = function() {
    if (!confirm('确定恢复默认数据？当前所有修改将丢失。')) return;
    localStorage.removeItem('inyko_dashboard');
    showToast('🔄 已恢复默认，正在刷新…');
    setTimeout(function() { location.reload(); }, 800);
  };

  // ============================================================
  //  API 对接层（后端 JSON 数据库）
  // ============================================================
  function getApiConfig() {
    var data = loadData();
    var base = data.apiBase || window.location.origin;  // 未配置时用页面自身域名
    return {
      base: base,
      token: data.apiToken || '',
      enabled: data.apiEnabled || false,
    };
  }

  function apiRequest(path, options) {
    var cfg = getApiConfig();
    if (!cfg.base) return Promise.reject(new Error('API 地址未配置'));
    var url = cfg.base.replace(/\/$/, '') + path;
    var headers = options.headers || {};
    if (cfg.token) headers['Authorization'] = 'Bearer ' + cfg.token;
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    return fetch(url, { ...options, headers, mode: 'cors' })
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      });
  }

  // 从 API 拉取所有仪表盘数据
  function fetchDashboard() {
    var cfg = getApiConfig();
    if (!cfg.enabled || !cfg.base) return Promise.reject(new Error('API 未启用'));
    return apiRequest('/api/dashboard', { method: 'GET' });
  }

  // 将 API 返回的仪表盘数据映射到本地 data 格式
  function mapApiDashboard(apiData) {
    var data = loadData();

    // 核心指标
    if (apiData.metrics) {
      var m = apiData.metrics;
      data.metrics = [
        { label: '今日播放总量', value: m.total_plays || 0, unit: '次', trend: (m.play_growth >= 0 ? '+' : '') + (m.play_growth || 0).toFixed(1) + '% 昨日', trendUp: (m.play_growth || 0) >= 0 },
        { label: '粉丝净增', value: m.new_followers || 0, unit: '人', trend: (m.follower_growth >= 0 ? '+' : '') + (m.follower_growth || 0).toFixed(1) + '% 昨日', trendUp: (m.follower_growth || 0) >= 0 },
        { label: 'AI 自动完成', value: m.ai_tasks_completed || 0, unit: '项', trend: '实时统计', trendUp: true },
        { label: '内容互动率', value: (m.engagement_rate || 0), unit: '%', trend: '行业均值 ' + (m.engagement_benchmark || 3.2) + '%', trendUp: (m.engagement_rate || 0) > (m.engagement_benchmark || 3.2) },
        { label: '待处理任务', value: m.pending_tasks || 0, unit: '项', trend: '需人工审核', trendUp: false },
      ];
    }

    // 视频队列
    if (apiData.videoTasks && apiData.videoTasks.length) {
      var statusLabels = { pending: '等待中', processing: '剪辑中', done: '待审核', error: '需修复' };
      data.videoQueue = apiData.videoTasks.map(function(t) {
        return {
          name: t.name || '',
          meta: (t.duration ? '原始 ' + Math.round(t.duration/60).toString().padStart(2,'0') + ':' + Math.round(t.duration%60).toString().padStart(2,'0') : t.error_msg || 'AI 分析中…'),
          progress: t.progress || 0,
          status: t.status === 'done' ? 'done' : t.status === 'error' ? 'error' : t.status === 'processing' ? 'processing' : 'waiting',
          statusLabel: statusLabels[t.status] || t.status || '等待中',
        };
      });
    }

    // 日志
    if (apiData.logs && apiData.logs.length) {
      var logColors = { success: 'green', info: 'cyan', warning: 'gold', error: 'rose' };
      data.activityLog = apiData.logs.map(function(l) {
        return {
          time: (l.created_at || '').slice(11, 16) || '--:--',
          color: logColors[l.type] || 'cyan',
          text: '<strong>' + (l.module || '系统') + '</strong> · ' + (l.message || ''),
        };
      });
    }

    return data;
  }

  // 覆盖 loadData：当 API 模式时从后端读取，offline 降级到 localStorage
  var _loadDataOrig = loadData;
  loadData = function() {
    var raw = localStorage.getItem('inyko_dashboard');
    try {
      var parsed = raw ? JSON.parse(raw) : null;
      if (parsed && parsed.apiEnabled && parsed.apiBase) {
        // API 模式：先从 localStorage 读出基础数据（含 API 配置），标记为 pending
        var cached = mergeDefaults(parsed);
        cached._apiLoading = true;
        return cached;
      }
      if (parsed) return mergeDefaults(parsed);
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULTS));
  };

  // API 异步刷新：页面加载后自动拉取一次
  function asyncRefreshFromApi() {
    var raw = localStorage.getItem('inyko_dashboard');
    if (!raw) return;
    try {
      var parsed = JSON.parse(raw);
      if (!parsed.apiEnabled || !parsed.apiBase) return;
    } catch (e) { return; }

    fetchDashboard().then(function(apiData) {
      var data = mapApiDashboard(apiData);
      localStorage.setItem('inyko_dashboard', JSON.stringify(data));
      applyAllData();
      showToast('🔗 数据已从服务器同步');
    }).catch(function(err) {
      console.warn('[API] 同步失败，使用本地缓存:', err.message);
      // 静默降级，不打扰用户
    });
  }

  // ============================================================
  //  页面加载时应用数据
  // ============================================================
  function applyAllData() {
    var data = loadData();
    applyMetricsToDOM(data);
    applyQueueToDOM(data);
    applyLogsToDOM(data);
  }

  // 工具：CSS 字符串
  var inputStyle    = 'padding:6px 10px;background:var(--bg-surface);border:1px solid var(--border);border-radius:6px;color:var(--text-1);font-size:12px;font-family:var(--font);width:100%;box-sizing:border-box;';
  var inputStyleNum = 'padding:6px 10px;background:var(--bg-surface);border:1px solid var(--border);border-radius:6px;color:var(--cyan);font-size:13px;font-weight:600;font-family:var(--font);text-align:center;width:100%;box-sizing:border-box;';
  var inputStyleSm  = 'padding:6px 10px;background:var(--bg-surface);border:1px solid var(--border);border-radius:6px;color:var(--text-1);font-size:12px;font-family:var(--font);width:100%;box-sizing:border-box;';
  var selectStyle   = 'padding:5px 8px;background:var(--bg-surface);border:1px solid var(--border);border-radius:6px;color:var(--text-1);font-size:12px;font-family:var(--font);width:100%;box-sizing:border-box;';
  var delBtnStyle  = 'background:rgba(251,113,133,0.1);border:1px solid rgba(251,113,133,0.2);color:var(--rose);border-radius:6px;cursor:pointer;padding:4px 8px;font-size:12px;';

  function escAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // DOM 准备完毕后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(applyAllData, 600);
      setTimeout(asyncRefreshFromApi, 1200);  // 延迟1.2s，等静态数据先渲染再异步拉API
    });
  } else {
    setTimeout(applyAllData, 600);
    setTimeout(asyncRefreshFromApi, 1200);
  }

  // 覆盖 HTML 中原有的 addVideoTask，让"添加素材"按钮走数据层
  window.addVideoTask = function() {
    var data = loadData();
    var names = [
      '品牌故事 · 8年声学匠心之路',
      'Studio R 录音舱 · 专业测试实录',
      'Focus S 开箱评测 · 开箱即用',
      '客户访谈 · 某互联网大厂部署案例',
    ];
    var name = names[Math.floor(Math.random() * names.length)];
    data.videoQueue.push({
      name: name,
      meta: '正在上传 · 分析中…',
      progress: 5,
      status: 'processing',
      statusLabel: '上传中'
    });
    saveData(data);
    applyQueueToDOM(data);
    showToast('✅ 新素材已添加到队列');
  };

  // 覆盖 generateContent，走数据层动画
  var _genContent = window.generateContent;
  window.generateContent = function() {
    var btn = event ? event.target : document.querySelector('.btn-primary.btn-sm');
    if (!btn) return;
    btn.textContent = 'AI 生成中…';
    btn.disabled = true;
    setTimeout(function() {
      btn.textContent = '✓ 生成完成！';
      btn.style.background = 'var(--green)';
      setTimeout(function() {
        btn.textContent = 'AI 生成本月计划';
        btn.disabled = false;
        btn.style.background = '';
      }, 2000);
    }, 1800);
    showToast('🤖 AI 内容计划已生成');
  };

})();
