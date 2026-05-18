import { GalleryGrid } from "@/components/ui/gallery-grid";
import { siteConfig } from "@/config/site";

export default function GalleryPage() {
  return (
    <section className="container py-12 px-4 md:px-8">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mb-12">
        <h1 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">Gallery</h1>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          A look at recent work.
        </p>
      </div>
      <GalleryGrid items={siteConfig.gallery} className="max-w-5xl mx-auto" />
    </section>
  );
}
