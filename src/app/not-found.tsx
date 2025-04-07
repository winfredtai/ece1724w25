"use client";

import { useRouter } from "next/navigation";

export default function CatchAllPage() {
  const router = useRouter();
  router.push("/home");
  return null;
}
