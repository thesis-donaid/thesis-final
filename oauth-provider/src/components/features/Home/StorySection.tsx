"use client";

import Link from "next/link";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Facebook, Play, ArrowRight, Quote } from "lucide-react";

const stats = [
  { value: "21+", label: "Years of Service" },
  { value: "500+", label: "Scholars Supported" },
  { value: "100+", label: "College Graduates" },
  { value: "50+", label: "Communities Reached" },
];

export default function StorySection() {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section className="relative bg-red-50 overflow-hidden py-24 md:py-32">

      {/* Background texture - lighter version */}
      <div className="absolute inset-0 bg-linear-to-br from-red-100/80 via-red-50/90 to-orange-50/90" />
      <div className="pointer-events-none absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-red-300/50 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-red-300/50 to-transparent" />

      {/* Decorative orbs - softer, lighter colors */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-red-200/40 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-orange-200/40 blur-3xl" />

      <div ref={sectionRef} className="relative max-w-7xl mx-auto px-4 md:px-10">

        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="inline-flex items-center gap-2 text-red-600 text-sm font-semibold tracking-widest uppercase mb-5">
            <span className="w-8 h-px bg-red-400 inline-block" />
            Impact Stories
            <span className="w-8 h-px bg-red-400 inline-block" />
          </span>

          <h2 className="text-4xl md:text-6xl font-black text-red-950 leading-tight mb-6">
            Behind Every Scholar,{" "}
            <br className="hidden md:block" />
            <span className="text-red-600">A Life Changed</span>
          </h2>

          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            How much difference can the Scholarship program have on the lives of
            Payatas&apos; youth? Let&apos;s hear directly from the beneficiaries of Puso ng Ama.
          </p>
        </motion.div>

        {/* ── Pull quote ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="max-w-3xl mx-auto mb-12 md:mb-16"
        >
          <div className="relative bg-white/80 backdrop-blur-sm border border-red-200 rounded-3xl px-8 md:px-12 py-8 text-center shadow-lg">
            <Quote className="absolute top-5 left-7 w-8 h-8 text-red-300" />
            <p className="text-red-900/80 text-lg md:text-xl italic leading-relaxed">
              &ldquo;Education is the most powerful weapon you can use to change the world —
              and PNA handed that weapon to us.&rdquo;
            </p>
            <p className="mt-4 text-red-600 text-sm font-semibold tracking-wide">
              — PNA Scholar, Batch 2022
            </p>
          </div>
        </motion.div>

        {/* ── Video ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Glow ring - lighter */}
          <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-red-300 via-red-400 to-red-300 opacity-40 blur-md" />

          {/* Video wrapper */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-red-200/50 border border-red-200 aspect-video bg-gray-100">
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/-3m44GZQLQA?si=2pWyEiv63syvaX2c&start=1"
              title="Puso ng Ama - Payatas Mission"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />

            {/* Corner badge - updated for light background */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-red-200">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-900 text-xs font-medium">Official Feature</span>
            </div>
          </div>
        </motion.div>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
        >
          <Link
            href="https://www.facebook.com/pusongama"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white font-semibold px-7 py-3.5 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-red-400/40 hover:-translate-y-0.5 group"
          >
            <Facebook className="w-5 h-5" />
            More Stories on Facebook
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <Link
            href="/OurImpact/Testimonials"
            className="inline-flex items-center gap-3 bg-white border border-red-200 hover:bg-red-50 text-red-800 font-semibold px-7 py-3.5 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md group"
          >
            <Play className="w-4 h-4 text-red-500" />
            View All Testimonials
          </Link>
        </motion.div>

        {/* ── Stats strip ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-20 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-px bg-red-200/50 rounded-3xl overflow-hidden border border-red-200"
        >
          {stats.map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.35 + i * 0.08 }}
              className="flex flex-col items-center justify-center gap-1 bg-white/90 px-6 py-8 text-center"
            >
              <span className="text-3xl md:text-4xl font-black text-red-800">{value}</span>
              <span className="text-red-600 text-xs font-semibold tracking-widest uppercase">{label}</span>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}