import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import NavbarWrapper from "@/components/features/NavbarWrapper";
import FooterWrapper from "@/components/features/FooterWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: {
    default: "Puso Ng Ama Foundation Inc.",
    template: "Puso Ng Ama Foundation Inc.",
  },
  description: "Personal and social transformation of individuals, families, and communities through faith-driven action.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers session={session}>
          <NavbarWrapper />
          {children}
          <FooterWrapper />
        </Providers>
      </body>
    </html>
  );
}
