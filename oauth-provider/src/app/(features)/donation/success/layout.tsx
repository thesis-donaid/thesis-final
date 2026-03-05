import { Metadata } from "next";

export const metadata: Metadata = { title: "Donation Successful" };

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
