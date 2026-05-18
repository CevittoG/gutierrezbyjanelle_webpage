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
          className="aspect-square rounded-lg border overflow-hidden bg-gradient-to-br from-accent to-primary/30 flex items-end"
        >
          <span className="w-full px-3 py-2 text-xs uppercase tracking-widest text-foreground/50 bg-background/40 backdrop-blur-sm text-center">
            {item.alt}
          </span>
        </div>
      ))}
    </div>
  );
}
