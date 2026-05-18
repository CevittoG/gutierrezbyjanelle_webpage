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
          className="aspect-square rounded-lg border bg-muted flex items-center justify-center overflow-hidden"
        >
          <span className="text-sm text-muted-foreground">{item.alt}</span>
        </div>
      ))}
    </div>
  );
}
