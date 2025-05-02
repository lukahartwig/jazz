"use client";

import { useAuth } from "@/contexts/Auth";
import { redirect } from "next/navigation";

export default function Page() {
  const cloudAuth = useAuth();
  cloudAuth.signIn().then(redirect("/"));
  return null;
}
