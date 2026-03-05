import Featured from "@/components/features/Home/Featured";
import Hero from "@/components/features/Home/Hero";
import RecentDonations from "@/components/features/Home/LiveDonation";
import MissionVision from "@/components/features/Home/MissionVision";
import StorySection from "@/components/features/Home/StorySection";
import { GraduateData } from "@/lib/localdb";

export default function Home() {
  const featuredGraduates = GraduateData();

  return (
    <main className="overflow-hidden">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <Hero />

      {/* ── Mission & Vision ─────────────────────────────────── */}
      <MissionVision />

      {/* ── Fr. Paul Video ───────────────────────────────────── */}
      <section className="relative bg-white py-24 md:py-32">
        {/* Subtle background blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-red-50/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-orange-50/70 blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 md:px-10">

          {/* Section label */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-3 text-red-600 text-sm font-semibold tracking-widest uppercase">
              <span className="w-8 h-px bg-red-400" />
              Our Foundation
              <span className="w-8 h-px bg-red-400" />
            </span>

            <h2 className="mt-5 text-4xl md:text-5xl font-black text-gray-900 leading-tight">
              The Story of{" "}
              <span className="text-red-600">Payatas</span>
            </h2>

            <p className="mt-4 text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
              Father Paul Uwemedimo shares what moved him to establish Puso ng Ama —
              a mission born from love in the heart of Payatas.
            </p>
          </div>

          {/* Responsive video wrapper */}
          <div className="relative">
            {/* Decorative glow ring */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-red-300 via-red-400 to-orange-300 opacity-30 blur-md" />

            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-red-200/40 border border-red-100 aspect-video bg-gray-100">
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/ggwtsRSwHcI"
                title="Fr Paul - Situation in Payatas Philippines"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      {/* Thin section divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-red-200 to-transparent" />

      {/* ── Featured Graduates ───────────────────────────────── */}
      <Featured graduates={featuredGraduates} />

      {/* ── Recent Donations ─────────────────────────────────── */}
      <RecentDonations />

      {/* ── Story Section ─────────────────────────────────────── */}
      <StorySection />

    </main>
  );
}
