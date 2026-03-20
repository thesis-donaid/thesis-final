"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";
import DashboardFooter from "./DashboardFooter";

export default function FooterWrapper() {
  const pathname = usePathname();

  const hiddenRoutes = ["/login", "/signup", "/auth/verify", "/beneficiary", "/donor", "/admin", "/unauthorized", "/donation"];

  // Check if the current pathname starts with any of the hidden routes
  const isDashboardRoute = hiddenRoutes.some(route => pathname.startsWith(route));

  if (isDashboardRoute) {
    // We still hide the BIG footer on these pages, but show the SMALL dashboard footer
    // EXCEPT for login/signup/verify which usually have no footer at all
    const authPages = ["/login", "/signup", "/auth/verify"];
    if (authPages.some(page => pathname.startsWith(page))) return null;
    
    return <DashboardFooter />;
  }

  return <Footer />;
}
