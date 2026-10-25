'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { PromptDetail, PromptImage } from '@/lib/types';
import { deleteUpload, uploadImage } from './upload';

export type ImageInput = { role: 'example' | 'reference' | 'generated'; filePath: string; thumbPath: string };

const ROLE_LABEL: Record<ImageInput['role'], string> = { example: '示例图', reference: '参考图', generated: '生成结果' };

export default function PromptForm({ mode, initial }: { mode: 'create' | 'edit'; initial?: PromptDetail }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || '');
  const [type, setType] = useState<'text2img' | 'img2img'>(initial?.type || 'text2img');
  const [positive, setPositive] = useState(initial?.positive_prompt || '');
  const [negative, setNegative] = useState(initial?.negative_prompt || '');
  const [model, setModel] = useState(initial?.model || '');
  const [sampler, setSampler] = useState(initial?.sampler || '');
  const [steps, setSteps] = useState(initial?.steps?.toString() || '');
  const [cfg, setCfg] = useState(initial?.cfg_scale?.toString() || '');
  const [seed, setSeed] = useState(initial?.seed || '');
  const [width, setWidth] = useState(initial?.width?.toString() || '');
  const [height, setHeight] = useState(initial?.height?.toString() || '');
  const [lora, setLora] = useState(initial?.lora || '');
  const [sourceUrl, setSourceUrl] = useState(initial?.source_url || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [visibility, setVisibility] = useState<'public' | 'private'>(initial?.visibility || 'public');
  const [tags, setTags] = useState((initial?.tags || []).join(', '));
  const [images, setImages] = useState<ImageInput[]>(
    (initial?.images || []).map((i: PromptImage) => ({ role: i.role, filePath: i.file_path, thumbPath: i.thumb_path })),
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const fileRefs = {
    example: useRef<HTMLInputElement>(null),
    reference: useRef<HTMLInputElement>(null),
    generated: useRef<HTMLInputElement>(null),
  };

  async function addFiles(role: ImageInput['role'], files: FileList) {
    setErr(''); setBusy(true);
    try {
      const added: ImageInput[] = [];
      for (const file of Array.from(files)) {
        const up = await uploadImage(file, role);
        added.push({ role, filePath: up.filePath, thumbPath: up.thumbPath });
      }
      setImages((prev) => [...prev, ...added]);
      setMsg(`已上传 ${added.length} 张${ROLE_LABEL[role]}`);
    } catch (e) { setErr(e instanceof Error ? e.message : '上传失败'); }
    finally {
      setBusy(false);
      const ref = fileRefs[role].current; if (ref) ref.value = '';
    }
  }

  async function removeImage(index: number) {
    const img = images[index];
    await deleteUpload(img.filePath, img.thumbPath);
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setMsg('');
    if (!title.trim()) { setErr('标题必填'); return; }
    if (!positive.trim()) { setErr('正向提示词必填'); return; }
    if (type === 'img2img' && !images.some((i) => i.role === 'reference')) {
      setErr('图生图建议至少上传一张参考图');
      return;
    }
    setBusy(true);
    try {
      const body = {
        title: title.trim(), type, positive_prompt: positive, negative_prompt: negative || null,
        model: model || null, sampler: sampler || null, steps: steps ? Number(steps) : null,
        cfg_scale: cfg ? Number(cfg) : null, seed: seed || null, width: width ? Number(width) : null,
        height: height ? Number(height) : null, lora: lora || null, source_url: sourceUrl || null,
        notes: notes || null, visibility,
        tags: Array.from(new Set(tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean))),
        images,
      };
      const res = await fetch(mode === 'edit' ? `/api/admin/prompts/${initial!.id}` : '/api/admin/prompts', {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '保存失败');
      router.push('/admin/prompts');
      router.refresh();
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : '保存失败'); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[20px] font-bold">{mode === 'edit' ? '编辑提示词' : '新建提示词'}</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => router.push('/admin/prompts')} className="pv-btn">返回</button>
          <button type="submit" disabled={busy} className="pv-btn pv-btn-primary">{busy ? '保存中…' : '保存'}</button>
        </div>
      </div>
      {msg ? <p className="rounded-lg border border-[#204b3a] bg-[#10241d] px-3 py-2 text-[12.5px] text-[#7ee2b8]">{msg}</p> : null}
      {err ? <p className="rounded-lg border border-[#6b2436] bg-[#3a1520] px-3 py-2 text-[12.5px] text-[#ff9db0]">{err}</p> : null}

      <div className="pv-card grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="pv-label" htmlFor="title">标题 *</label>
          <input id="title" className="pv-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="pv-label" htmlFor="type">类型 *</label>
          <select id="type" className="pv-input" value={type} onChange={(e) => setType(e.target.value as 'text2img' | 'img2img')}>
            <option value="text2img">文生图 text2img</option>
            <option value="img2img">图生图 img2img</option>
          </select>
        </div>
        <div>
          <label className="pv-label" htmlFor="vis">可见性</label>
          <select id="vis" className="pv-input" value={visibility} onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}>
            <option value="public">公开（游客可见）</option>
            <option value="private">私有（仅加入公开收藏夹后可见）</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="pv-label" htmlFor="pos">正向提示词 *</label>
          <textarea id="pos" className="pv-input min-h-[110px]" value={positive} onChange={(e) => setPositive(e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label className="pv-label" htmlFor="neg">负向提示词</label>
          <textarea id="neg" className="pv-input min-h-[80px]" value={negative} onChange={(e) => setNegative(e.target.value)} />
        </div>
        <div>
          <label className="pv-label" htmlFor="model">模型</label>
          <input id="model" className="pv-input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="SDXL / Flux / …" />
        </div>
        <div>
          <label className="pv-label" htmlFor="sampler">采样器</label>
          <input id="sampler" className="pv-input" value={sampler} onChange={(e) => setSampler(e.target.value)} placeholder="DPM++ 2M Karras" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="pv-label" htmlFor="steps">步数</label><input id="steps" type="number" className="pv-input" value={steps} onChange={(e) => setSteps(e.target.value)} /></div>
          <div><label className="pv-label" htmlFor="cfg">CFG</label><input id="cfg" type="number" step="0.1" className="pv-input" value={cfg} onChange={(e) => setCfg(e.target.value)} /></div>
        </div>
        <div><label className="pv-label" htmlFor="seed">Seed</label><input id="seed" className="pv-input" value={seed} onChange={(e) => setSeed(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="pv-label" htmlFor="w">宽</label><input id="w" type="number" className="pv-input" value={width} onChange={(e) => setWidth(e.target.value)} /></div>
          <div><label className="pv-label" htmlFor="h">高</label><input id="h" type="number" className="pv-input" value={height} onChange={(e) => setHeight(e.target.value)} /></div>
        </div>
        <div><label className="pv-label" htmlFor="lora">LoRA</label><input id="lora" className="pv-input" value={lora} onChange={(e) => setLora(e.target.value)} /></div>
        <div className="sm:col-span-2"><label className="pv-label" htmlFor="src">来源链接</label><input id="src" className="pv-input" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" /></div>
        <div className="sm:col-span-2"><label className="pv-label" htmlFor="tags">标签（逗号分隔）</label><input id="tags" className="pv-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="portrait, cinematic, 赛博朋克" /></div>
        <div className="sm:col-span-2"><label className="pv-label" htmlFor="notes">备注</label><textarea id="notes" className="pv-input min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      </div>

      <div className="pv-card space-y-4 p-5">
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#8b97b8]">图片（{images.length}）</h2>
          <p className="mt-1 text-[11.5px] text-[#66739a]">支持 jpg / png / webp，单张不超过 {process.env.NEXT_PUBLIC_UPLOAD_MAX_MB || '10'} MB；不支持 SVG。</p>
        </div>
        {(['example', 'reference', 'generated'] as const).map((role) => (
          <div key={role} className="rounded-xl border border-[#232b45] p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[12.5px] text-[#a9b6d8]">{ROLE_LABEL[role]}
                {role === 'reference' ? <span className="ml-2 text-[11px] text-[#66739a]">图生图输入图</span> : null}
              </span>
              <div className="flex gap-2">
                <input ref={fileRefs[role]} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={(e) => { if (e.target.files?.length) addFiles(role, e.target.files); }} />
                <button type="button" onClick={() => fileRefs[role].current?.click()} disabled={busy} className="pv-btn px-3 py-1 text-[11.5px]">
                  上传{ROLE_LABEL[role]}
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              {images.map((img, index) => img.role === role ? (
                <div key={img.filePath} className="group relative overflow-hidden rounded-lg border border-[#232b45]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/media/${img.thumbPath}`} alt={ROLE_LABEL[role]} className="aspect-square w-full object-cover" />
                  <button type="button" onClick={() => removeImage(index)}
                    className="absolute right-1 top-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] text-[#ff9db0] opacity-90">删除</button>
                </div>
              ) : null)}
              {images.every((i) => i.role !== role) ? <p className="text-[11.5px] text-[#56628a]">暂无</p> : null}
            </div>
          </div>
        ))}
      </div>
    </form>
  );
}
