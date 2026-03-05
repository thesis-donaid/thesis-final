import Featured from "@/components/features/Home/Featured";

import Hero from "@/components/features/Home/Hero";
import RecentDonations from "@/components/features/Home/LiveDonation";

import MissionVision from "@/components/features/Home/MissionVision";
import StorySection from "@/components/features/Home/StorySection";
import {GraduateData} from "@/lib/localdb";


export default function Home() {

  const featuredGradute = GraduateData();
  return (
    <div>
      <Hero/>
      <MissionVision/>
      <Featured graduates={featuredGradute}/>
      <RecentDonations/>
      <StorySection/>
    </div>
  );
}
