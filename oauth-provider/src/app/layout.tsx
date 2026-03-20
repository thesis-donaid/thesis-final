import type { Metadata } from "next";
import { Roboto, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import NavbarWrapper from "@/components/features/NavbarWrapper";
import FooterWrapper from "@/components/features/FooterWrapper";

const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  variable: "--font-roboto",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: {
    default: "Puso Ng Ama Foundation Inc.",
    template: "%s | Puso Ng Ama Foundation Inc.",
  },
  description: "Personal and social transformation of individuals, families, and communities through faith-driven action.",
};

import Notification from "@/components/notification/Notification";
import NavigationLoader from "@/components/ui/NavigationLoader";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  
  return (
    <html lang="en">
      <body
        className={`${roboto.variable} ${geistMono.variable} antialiased`}
      >
        <Providers session={session}>
          <NavigationLoader />
          <Notification />
          <NavbarWrapper />
          {children}
          <FooterWrapper />
        </Providers>
      </body>
    </html>
  );
}
