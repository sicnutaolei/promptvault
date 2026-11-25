import PasswordForm from '@/components/admin/PasswordForm';
import SiteSettingsForm from '@/components/admin/SiteSettingsForm';
import { DB_PATH, DATA_DIR } from '@/lib/db';
import { getSlogan } from '@/lib/settings';

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
    <div className="mx-auto max-w-[760px] space-y-4">
      <h1 className="text-[20px] font-semibold text-[#2f3a4a]">设置</h1>
      <SiteSettingsForm initialSlogan={getSlogan()} />
      <PasswordForm />
      <div className="pv-card p-5">
        <h2 className="mb-3 text-[13px] font-medium text-[#6b7789]">站点信息（只读）</h2>
        <div className="grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex flex-wrap justify-between gap-2 border-b border-[#eef2f7] pb-1.5">
              <span className="text-[#8a95a6]">{k}</span><span className="break-all text-right text-[#3d4859]">{v}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-[#98a3b3]">修改这些参数请编辑 <code>docker-compose.yml</code> 的 environment 后重启容器。</p>
      </div>
      <div className="pv-card p-5">
        <h2 className="mb-2 text-[13px] font-medium text-[#6b7789]">备份</h2>
        <p className="text-[12.5px] leading-6 text-[#6b7789]">在宿主机项目目录执行 <code>./scripts/backup.sh</code>，会生成 <code>backup-YYYYmmdd-HHMMSS.tar.gz</code>（包含数据库与图片）。</p>
      </div>
    </div>
  );
}