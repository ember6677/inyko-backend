/* ============================================================
   INYKO SPA 路由系统 — 无刷新页面切换
   ============================================================ */
(function() {
  'use strict';

  if (window.__spaInit) return;
  window.__spaInit = true;

  const currentPage = () => {
    const p = location.pathname;
    return p === '/' || p === '' ? 'index.html' : p.split('/').pop();
  };

  /* ── 拦截所有内部导航 ── */
  function bindNav() {
    document.querySelectorAll('.nav-item, .topbar-logo, .brand, a[href]').forEach(el => {
      const href = el.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('http') || href.startsWith('//')) return;
      if (!href.endsWith('.html')) return;

      // 已经绑定过的跳过
      if (el.dataset.spaBound) return;
      el.dataset.spaBound = '1';

      el.addEventListener('click', function(e) {
        e.preventDefault();
        navigateTo(href);
      });
    });
  }

  /* ── 页面切换 ── */
  async function navigateTo(url, pushState = true) {
    const urlFile = url.split('/').pop();
    if (urlFile === currentPage()) return;

    const main = document.querySelector('.main');
    if (!main) { location.href = url; return; }

    // 过渡动画
    main.style.transition = 'opacity 0.15s ease';
    main.style.opacity = '0.3';

    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const html = await res.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 提取新页面的 main 内容
      const newMain = doc.querySelector('.main');
      if (!newMain) throw new Error('No .main found in target page');

      main.innerHTML = newMain.innerHTML;

      // 注入目标页面的独有样式
      doc.querySelectorAll('style').forEach((style, i) => {
        const styleId = 'spa-style-' + urlFile.replace(/[^a-z0-9]/gi, '_') + '-' + i;
        let existing = document.getElementById(styleId);
        if (!existing) {
          existing = document.createElement('style');
          existing.id = styleId;
          document.head.appendChild(existing);
        }
        existing.textContent = style.textContent;
      });

      // 等待 DOM 更新
      await new Promise(r => setTimeout(r, 50));

      // 执行目标页面的脚本
      const scripts = doc.querySelectorAll('script');
      for (const script of scripts) {
        if (script.src) {
          // 外部脚本
          const alreadyLoaded = document.querySelector('script[src="' + script.src + '"]');
          if (!alreadyLoaded) {
            const s = document.createElement('script');
            s.src = script.src;
            await new Promise((resolve) => {
              s.onload = resolve;
              s.onerror = () => resolve();
              document.body.appendChild(s);
            });
          }
        } else {
          // 内联脚本 — 使用 setTimeout 让它在下一轮事件循环执行，确保 DOM 已就位
          try {
            setTimeout(function() {
              try {
                new Function(script.textContent)();
              } catch (e) {
                console.warn('SPA script exec:', e);
              }
            }, 0);
          } catch (e) {
            console.warn('SPA script prepare:', e);
          }
        }
      }

      // 更新标题
      const title = doc.querySelector('title');
      if (title) document.title = title.textContent;

      // 更新 URL
      if (pushState) {
        history.pushState({ spa: true, url: url }, '', url);
      }

      // 更新导航高亮
      updateNavActive(url);

      // 滚动到顶部
      main.scrollTop = 0;

      // 重新绑定新页面中的导航（如果新内容中有未绑定的链接）
      setTimeout(bindNav, 100);

    } catch (e) {
      console.error('SPA navigation error:', e);
      location.href = url;
    } finally {
      main.style.opacity = '1';
    }
  }

  /* ── 更新导航高亮 ── */
  function updateNavActive(url) {
    const urlFile = url.split('/').pop().replace('.html', '') || 'index';
    document.querySelectorAll('.nav-item').forEach(item => {
      const itemHref = item.getAttribute('href') || item.dataset.spaUrl || '';
      const itemFile = itemHref.split('/').pop().replace('.html', '') || 'index';
      item.classList.toggle('active', itemFile === urlFile);
    });
  }

  /* ── 浏览器前进/后退 ── */
  window.addEventListener('popstate', function(e) {
    if (e.state && e.state.url) {
      navigateTo(e.state.url, false);
    }
  });

  /* ── 初始化 ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindNav);
  } else {
    bindNav();
  }

  // 暴露全局 API
  window.SPA = { navigateTo };
})();
