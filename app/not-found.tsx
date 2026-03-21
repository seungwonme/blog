"use client";

import { usePathname } from "next/navigation";
import { getPosts } from "@/entities/post";
import { HomePage } from "@/pages/home";

export default function NotFound() {
  const pathname = usePathname();
  const posts = getPosts();
  const command = pathname?.replace(/^\//, "") || "404";
  return <HomePage posts={posts} initialCommand={command} />;
}
