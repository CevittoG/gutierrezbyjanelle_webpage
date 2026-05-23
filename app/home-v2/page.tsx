import { redirect } from "next/navigation";

// This route has been promoted to the main homepage.
export default function HomeV2Redirect() {
  redirect("/");
}
