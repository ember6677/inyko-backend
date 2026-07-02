// INYKO 运营控制面板 — 本地开发启动入口
const app = require('./app');
const PORT = process.env.PORT || 4000;

// 仅在本地开发时启动 HTTP 服务器（Vercel 上由平台管理）
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  INYKO API 服务已启动');
  console.log('  本地地址: http://localhost:' + PORT);
  console.log('  仪表盘数据: /api/dashboard');
  console.log('  健康检查: /api/health');
  console.log('========================================');
});
