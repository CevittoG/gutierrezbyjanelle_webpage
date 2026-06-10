// API: GET /quote-calc/api/portal/[id]/file/[fileId]
// Admin-side streaming proxy for a quote's proof files. Cookie-gated, so it
// works regardless of public-link state (lets Janelle preview proofs before she
// ever generates a client link). Same membership check + streaming as the
// public proxy.

import { isQuoteAuthValid } from "@/lib/quote-calc-auth";
import { getPortalMetaById } from "@/lib/quote-calc-sheets";
import { listFolderFiles, streamFile } from "@/lib/quote-calc-drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: { id: string; fileId: string } }) {
  if (!isQuoteAuthValid()) return new Response("Unauthorized", { status: 401 });
  const { id, fileId } = ctx.params;

  const meta = await getPortalMetaById(id);
  if (!meta?.driveFolderId) return new Response("Not found", { status: 404 });

  try {
    const files = await listFolderFiles(meta.driveFolderId);
    if (!files.some((f) => f.id === fileId)) return new Response("Not found", { status: 404 });
    const stream = await streamFile(fileId);
    const headers = new Headers({
      "Content-Type": stream.contentType,
      "Cache-Control": "private, max-age=300",
    });
    if (stream.contentLength) headers.set("Content-Length", stream.contentLength);
    return new Response(stream.body, { status: 200, headers });
  } catch (err) {
    console.warn("[/quote-calc/api/portal/file] failed", err);
    return new Response("Not found", { status: 404 });
  }
}
