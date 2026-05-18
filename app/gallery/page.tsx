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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {siteConfig.gallery.map((item) => (
          <div key={item.id} className="aspect-square rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
            <span className="text-sm text-muted-foreground">{item.alt}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
