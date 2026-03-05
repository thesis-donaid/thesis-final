"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();

  const hiddenRoutes = ["/login", "/signup", "/auth/verify"];

  if (hiddenRoutes.includes(pathname)) return null;

  return <Footer />;
}
