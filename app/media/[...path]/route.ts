import fs from 'node:fs';
import { Readable } from 'node:stream';
import { mediaContentType, resolveUploadPath } from '@/lib/media';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function forbidden() {
  return new Response('Forbidden', { status: 403 });
}

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = (await params).path || [];
  const BS = String.fromCharCode(92);
  const NUL = String.fromCharCode(0);
  if (!segments.length || segments.some((s) => s === '..' || s === '.' || s.includes(BS) || s.includes(NUL))) {
    return forbidden();
  }
  const rel = segments.join('/');
  const abs = resolveUploadPath(rel);
  if (!abs) return forbidden();
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return new Response('Not Found', { status: 404 });
  const stream = Readable.toWeb(fs.createReadStream(abs)) as ReadableStream;
  return new Response(stream, {
    headers: {
      'Content-Type': mediaContentType(abs),
      'Content-Length': String(fs.statSync(abs).size),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

export function POST() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }); }
export function PUT() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }); }
export function DELETE() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }); }
