import PasswordForm from '@/components/admin/PasswordForm';
import { DB_PATH, DATA_DIR } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const rows: [string, string][] = [
    ['站点名称 SITE_NAME', process.env.SITE_NAME || 'PromptVault'],
    ['数据目录 DATA_DIR', DATA_DIR],
    ['数据库', DB_PATH],
    ['上传上限 UPLOAD_MAX_MB', process.env.UPLOAD_MAX_MB || '10'],
    ['Cookie Secure', process.env.COOKIE_SECURE === 'true' ? 'true（HTTPS）' : 'false（HTTP）'],
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-[20px] font-bold">设置</h1>
      <div className="pv-card p-5">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-[#8b97b8]">站点信息（只读）</h2>
        <div className="grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex flex-wrap justify-between gap-2 border-b border-[#1c2440] pb-1.5">
              <span className="text-[#7f8db3]">{k}</span><span className="break-all text-right">{v}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-[#66739a]">修改这些参数请编辑 <code>docker-compose.yml</code> 的 environment 后重启容器。</p>
      </div>
      <PasswordForm />
      <div className="pv-card p-5">
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-[#8b97b8]">备份</h2>
        <p className="text-[12.5px] leading-6 text-[#a9b6d8]">在宿主机项目目录执行 <code>./scripts/backup.sh</code>，会生成 <code>backup-YYYYmmdd-HHMMSS.tar.gz</code>（包含数据库与图片）。</p>
      </div>
    </div>
  );
}
