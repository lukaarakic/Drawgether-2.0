"use server";

import { logout } from "@/app/lib/auth-utils";

export async function logoutAction() {
  await logout();
}
