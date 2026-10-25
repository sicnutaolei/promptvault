export interface UploadedImage {
  filePath: string;
  thumbPath: string;
  url: string;
}

export async function uploadImage(file: File, role: 'example' | 'reference' | 'generated'): Promise<UploadedImage> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('role', role);
  const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '上传失败');
  return data as UploadedImage;
}

export async function deleteUpload(filePath: string, thumbPath: string): Promise<void> {
  await fetch('/api/admin/upload', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath, thumbPath }),
  });
}
