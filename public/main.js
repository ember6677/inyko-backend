// ===== 页面切换 =====
function showPage(pageId) {
  // 移除所有页面的 active 状态
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });

  // 显示目标页面
  const target = document.getElementById('page-' + pageId);
  if (target) {
    target.classList.add('active');
    // 重置动画
    target.style.animation = 'none';
    target.offsetHeight; // reflow
    target.style.animation = '';
  }

  // 更新导航高亮
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.page === pageId) {
      link.classList.add('active');
    }
  });

  // 关闭手机端菜单
  const navLinks = document.getElementById('navLinks');
  if (navLinks) navLinks.classList.remove('open');

  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== 汉堡菜单 =====
function toggleMenu() {
  const navLinks = document.getElementById('navLinks');
  if (navLinks) {
    navLinks.classList.toggle('open');
  }
}

// ===== 导航栏滚动效果 =====
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
});

// ===== FAQ 展开/收起 =====
function toggleFaq(el) {
  const item = el.parentElement;
  const isOpen = item.classList.contains('open');

  // 关闭所有
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));

  // 如果原来是关闭的，则打开
  if (!isOpen) {
    item.classList.add('open');
  }
}

// ===== 联系表单提交 =====
function submitForm(e) {
  e.preventDefault();
  const form = e.target;
  const successMsg = document.getElementById('form-success');

  // 模拟提交
  const btn = form.querySelector('button[type="submit"]');
  btn.textContent = '提交中...';
  btn.disabled = true;

  setTimeout(() => {
    form.style.display = 'none';
    if (successMsg) successMsg.style.display = 'block';
  }, 1200);
}

// ===== 数字动画 =====
function animateNumbers() {
  const statNumbers = document.querySelectorAll('.stat-number');
  statNumbers.forEach(el => {
    const text = el.textContent;
    const num = parseInt(text.replace(/\D/g, ''));
    const suffix = text.replace(/[\d]/g, '').trim();

    if (isNaN(num)) return;

    let start = 0;
    const duration = 1500;
    const step = num / (duration / 16);

    const timer = setInterval(() => {
      start += step;
      if (start >= num) {
        start = num;
        clearInterval(timer);
      }
      el.innerHTML = Math.round(start) + '<span>' + suffix + '</span>';
    }, 16);
  });
}

// ===== 滚动动画观察器 =====
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  // 显示首页
  showPage('home');

  // 为卡片添加入场动画初始状态
  const animItems = document.querySelectorAll('.feature-card, .scenario-card, .value-card, .cert-item, .product-card');
  animItems.forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = `opacity 0.5s ease ${index * 0.08}s, transform 0.5s ease ${index * 0.08}s`;
    observer.observe(item);
  });

  // 延迟触发数字动画
  setTimeout(animateNumbers, 500);
});
