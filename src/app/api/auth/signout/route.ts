import { signOut } from "@/lib/auth";

export async function POST() {
  return signOut({ redirectTo: "/login" });
}