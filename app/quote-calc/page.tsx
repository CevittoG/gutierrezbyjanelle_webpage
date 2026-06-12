import { redirect } from "next/navigation";

// The quote tools moved to /quotes (dashboard) and /quote/new (calculator).
// Keep this path as a back-compat redirect for any existing bookmarks.
export default function QuoteCalcPage() {
  redirect("/quotes");
}
