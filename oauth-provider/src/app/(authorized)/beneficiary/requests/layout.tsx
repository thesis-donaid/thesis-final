import { Metadata } from "next";

export const metadata: Metadata = { title: "My Requests" };

export default function RequestsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
