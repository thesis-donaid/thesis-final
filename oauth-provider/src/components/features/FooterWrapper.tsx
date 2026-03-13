"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();

  const hiddenRoutes = ["/login", "/signup", "/auth/verify", "/beneficiary", "/donor", "/admin", "/unauthorized", "/donation"];

  // Check if the current pathname starts with any of the hidden routes

  const shouldHideFooter = hiddenRoutes.some(route => pathname.startsWith(route))

  if (shouldHideFooter) return null;

  return <Footer />;
}
