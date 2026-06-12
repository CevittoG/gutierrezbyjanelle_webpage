import { redirect } from "next/navigation";

// The Explorer was absorbed into the /quotes dashboard. Back-compat redirect.
export default function ExplorerRedirect() {
  redirect("/quotes");
}
