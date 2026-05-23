import Image from "next/image";
import { cn } from "@/utils";
import type { GalleryItem } from "@/config/site";

interface GalleryGridProps {
  items: GalleryItem[];
  className?: string;
}

export function GalleryGrid({ items, className }: GalleryGridProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6", className)}>
      {items.map((item) => (
        <div
          key={item.id}
          className="group aspect-square relative rounded-lg border overflow-hidden bg-gradient-to-br from-accent to-primary/30 flex items-end"
        >
          {/* Render real image when a src path is provided */}
          {item.src && (
            <Image
              src={item.src}
              alt={item.alt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            />
          )}

          {/* Hover overlay */}
          <div
            className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-200"
            aria-hidden="true"
          />

          {/* Caption */}
          <span className="relative z-10 w-full px-3 py-2 text-xs uppercase tracking-widest text-foreground/50 bg-background/40 backdrop-blur-sm text-center">
            {item.alt}
          </span>
        </div>
      ))}
    </div>
  );
}
