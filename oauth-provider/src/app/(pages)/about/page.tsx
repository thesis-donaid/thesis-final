import History from "@/components/features/About/History";
import MissionVision from "@/components/features/About/MIssionVision";
import Staff from "@/components/features/About/Staff";
import RecentDonations from "@/components/features/Home/LiveDonation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {


    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header - Adjusted spacing */}
          <div className="text-center mb-20 mt-20">
            <h1 className="text-5xl font-bold text-red-800 mb-6">Puso ng Ama Foundation</h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              For over a decade, we&apos;ve been dedicated to excellence, innovation, and building lasting relationships with our clients.
            </p>
          </div>

          <History />
          <MissionVision/>
          <Staff/>

        </div>
      </div>
    )
}