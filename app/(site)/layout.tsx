import "@/components/concepts/concepts.css";
import "./site.css";
import { SiteShell } from "./_components/shell";

// The live marketing site (/, /about, /weddings, /events, /gallery, /reviews).
// A route group, so it adds no URL segment. Metadata comes from the root layout.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
