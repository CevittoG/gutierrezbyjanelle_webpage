// Proofs for the public quote view. Images render in a responsive grid; PDFs
// (e.g. the printed-quote snapshot) list as links. Every src/href points at the
// same-origin streaming proxy — raw Drive URLs are never exposed.

import type { PublicQuoteFile } from "@/lib/quote-calc-portal";

export function ProofsGallery({
  images,
  pdfs,
}: {
  images: PublicQuoteFile[];
  pdfs: PublicQuoteFile[];
}) {
  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <a
              key={img.id}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-lg overflow-hidden border border-border bg-muted/30 aspect-square"
              title={img.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </a>
          ))}
        </div>
      )}

      {pdfs.length > 0 && (
        <ul className="space-y-2">
          {pdfs.map((pdf) => (
            <li key={pdf.id}>
              <a
                href={pdf.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm normal-case tracking-normal hover:border-accent transition-colors"
              >
                <span aria-hidden className="text-accent">▢</span>
                <span className="truncate">{pdf.name}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
