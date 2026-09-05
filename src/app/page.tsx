import { redirect } from "next/navigation";

// TODO: once auth exists, send signed-in users to /home instead.
export default function RootPage() {
  redirect("/onboarding");
}
