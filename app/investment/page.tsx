import { redirect } from "next/navigation";

// Investment pricing lives in the #collections section of /weddings and /events.
// Keep this path as a back-compat redirect for any existing bookmarks/links.
export default function InvestmentPage() {
  redirect("/weddings#collections");
}
