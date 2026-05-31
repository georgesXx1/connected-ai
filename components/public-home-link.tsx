"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PublicHomeLink() {
  const pathname = usePathname();
  const hidden =
    pathname === "/" ||
    pathname === "/public-website" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/api");

  if (hidden) {
    return null;
  }

  return (
    <Link href="/public-website" className="public-home-link" aria-label="Back to public website">
      <span>Public Home</span>
    </Link>
  );
}
