// Next.js 启动时执行一次：建表、初始化管理员、生成 session secret，
// 这样 `docker compose logs` 里能立刻看到 [INIT] 密码，而不是等第一个请求。
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getDb, getSessionSecret } = await import('./lib/db');
    getDb();
    getSessionSecret();
  }
}
