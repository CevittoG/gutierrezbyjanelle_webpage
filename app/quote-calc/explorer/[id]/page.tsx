import { redirect } from "next/navigation";

// Per-quote detail moved to /quotes/[id]. Back-compat redirect.
export default function ExplorerDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/quotes/${encodeURIComponent(params.id)}`);
}
