// Public streaming proxy for a quote's proof files. Never exposes a raw Drive
// URL: the SA authenticates and the bytes are re-streamed (not buffered, to
// respect Render's RAM ceiling).
//
// Security: re-verify the token AND confirm the requested fileId actually lives
// in *this* quote's folder. The SA holds drive.readonly over the whole tree, so
// without the membership check a valid token could stream another client's
// proofs by fileId.

import { findByPublicToken } from "@/lib/quote-calc-sheets";
import { isLinkActive } from "@/lib/quote-calc-portal";
import { listFolderFiles, streamFile } from "@/lib/quote-calc-drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function notFound(): Response {
  return new Response("Not found", { status: 404 });
}

export async function GET(
  _req: Request,
  ctx: { params: { token: string; fileId: string } },
) {
  const { token, fileId } = ctx.params;

  const meta = await findByPublicToken(token);
  if (!meta || !isLinkActive(meta) || !meta.driveFolderId) return notFound();

  // Membership: the file must belong to this quote's folder.
  try {
    const files = await listFolderFiles(meta.driveFolderId);
    if (!files.some((f) => f.id === fileId)) return notFound();
  } catch (err) {
    console.warn("[/q/file] membership check failed", err);
    return notFound();
  }

  try {
    const stream = await streamFile(fileId);
    const headers = new Headers({
      "Content-Type": stream.contentType,
      "Cache-Control": "private, max-age=300",
    });
    if (stream.contentLength) headers.set("Content-Length", stream.contentLength);
    return new Response(stream.body, { status: 200, headers });
  } catch (err) {
    console.warn("[/q/file] stream failed", err);
    return notFound();
  }
}
