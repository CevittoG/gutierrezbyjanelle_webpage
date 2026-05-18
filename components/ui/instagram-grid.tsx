import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import type { InstagramPost, InstagramConfig } from "@/config/site";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="3" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

interface InstagramGridProps {
  config: InstagramConfig;
  className?: string;
}

export function InstagramGrid({ config, className }: InstagramGridProps) {
  if (config.posts.length === 0) {
    return (
      <div className={cn("flex flex-col items-center gap-6 py-12 text-center", className)}>
        <InstagramIcon className="w-10 h-10 text-muted-foreground/50" />
        <p className="text-muted-foreground max-w-sm">
          Follow along for the latest designs, behind-the-scenes, and wedding inspiration.
        </p>
        <Button asChild variant="outline" size="lg">
          <a
            href={config.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2"
          >
            <InstagramIcon className="w-4 h-4" />
            @{config.handle}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {config.posts.map((post) => (
          <InstagramPostCard key={post.id} post={post} />
        ))}
      </div>
      <div className="flex justify-center">
        <Button asChild variant="outline">
          <a
            href={config.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2"
          >
            <InstagramIcon className="w-4 h-4" />
            See all on Instagram
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}

function InstagramPostCard({ post }: { post: InstagramPost }) {
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block aspect-square rounded-lg border overflow-hidden relative transition-transform duration-200 hover:scale-[1.02]"
    >
      {post.src ? (
        <Image
          src={post.src}
          alt={post.caption}
          fill
          className="object-cover transition-opacity duration-200 group-hover:opacity-90"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-accent to-primary/30" />
      )}
      <div className="absolute inset-x-0 bottom-0 px-3 py-2 bg-background/40 backdrop-blur-sm">
        <span className="block text-xs uppercase tracking-widest text-foreground/60 text-center truncate">
          {post.caption}
        </span>
      </div>
    </a>
  );
}
