import { redirect } from "next/navigation";
import { getCurrentUser } from "../features/auth/auth.server";

/**
 * Root route.
 *
 * Sends authenticated users to the private dashboard and unauthenticated users
 * to the login page.
 */
export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  redirect("/login");
}
