import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <section className="container flex flex-col items-center justify-center py-24 px-4 md:px-8 text-center space-y-6">
      <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
        {siteConfig.name}
      </h1>
      <p className="max-w-[600px] text-lg text-muted-foreground">
        {siteConfig.description}
      </p>
    </section>
  );
}
