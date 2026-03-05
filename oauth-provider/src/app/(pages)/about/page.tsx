import RecentDonations from "@/components/features/Home/LiveDonation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {


    return (

      <RecentDonations/>
    )
}