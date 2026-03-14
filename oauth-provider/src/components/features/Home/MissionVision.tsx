"use client";

import { motion, useInView } from "motion/react";
import { ArrowRight, Heart, Target, Eye, Users, Sparkles, Globe, BookOpen, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { programs } from "@/lib/localdb";
import SetImageGoogleById from "@/utils/SetImageGoogleById";

const values = [
  { icon: Heart, label: "Compassion", desc: "Love in action for every person", color: "from-rose-500 to-red-600" },
  { icon: Target, label: "Mission", desc: "Purposeful service to the poor", color: "from-amber-500 to-orange-600" },
  { icon: Eye, label: "Vision", desc: "A transformed and dignified life", color: "from-emerald-500 to-teal-600" },
  { icon: Users, label: "Community", desc: "Together toward a better world", color: "from-blue-500 to-indigo-600" },
];

function SectionLabel({ children, light = false, className = "" }: { children: React.ReactNode; light?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 text-sm font-semibold tracking-widest uppercase ${light ? "text-red-200" : "text-red-600"} ${className}`}>
      <span className={`w-8 h-[2px] rounded-full ${light ? "bg-red-200" : "bg-red-600"}`} />
      {children}
      <span className={`w-8 h-[2px] rounded-full ${light ? "bg-red-200" : "bg-red-600"}`} />
    </span>
  );
}

function FloatingShape({ delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 0.6, scale: 1 }}
      transition={{ duration: 1, delay }}
      className={`absolute rounded-full mix-blend-multiply filter blur-xl ${className}`}
    />
  );
}

// Fixed particles component that doesn't use random values during render
function BackgroundParticles() {
  // Only render on client to avoid hydration mismatch
  if (typeof window === "undefined") return null;

  // Generate fixed positions for particles
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: `${(i * 7) % 100}%`,
    top: `${(i * 13) % 100}%`,
    delay: i * 0.2,
    duration: 4 + (i % 3),
  }));

  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.2, 0], y: [0, -30, 0] }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
          }}
          className="absolute w-1 h-1 bg-blue-200/40 rounded-full"
          style={{
            left: particle.left,
            top: particle.top,
          }}
        />
      ))}
    </>
  );
}

export default function MissionVisionSection() {
  const missionRef = useRef(null);
  const visionRef = useRef(null);
  const programRef = useRef(null);
  const valuesRef = useRef(null);
  const [hoveredProgram, setHoveredProgram] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const missionInView = useInView(missionRef, { once: true, margin: "-80px" });
  const visionInView = useInView(visionRef, { once: true, margin: "-80px" });
  const programInView = useInView(programRef, { once: true, margin: "-80px" });
  const valuesInView = useInView(valuesRef, { once: true, margin: "-80px" });

  return (
    <section className="w-full overflow-hidden bg-white relative">
      
      {/* Background decorative elements */}
      <FloatingShape delay={0} className="w-96 h-96 -top-48 -left-48 bg-red-100/30" />
      <FloatingShape delay={0.2} className="w-96 h-96 -bottom-48 -right-48 bg-amber-100/30" />

      {/* ── MISSION ─────────────────────────────────────────────────────── */}
      <div ref={missionRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
        
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 xl:gap-20">

          {/* Image with enhanced animations */}
          <motion.div
            initial={{ opacity: 0, x: -60, rotateY: -10 }}
            animate={missionInView ? { opacity: 1, x: 0, rotateY: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full lg:w-1/2 shrink-0 perspective-1000"
          >
            <div className="relative h-80 md:h-[500px] rounded-3xl overflow-hidden shadow-2xl shadow-red-900/20 group">
              <Image
                src="https://drive.google.com/uc?export=view&id=1hB3wNPIDezjhCuPobErdWIO991H_ewi-"
                fill
                alt="PNA Mission"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-red-950/70 via-red-900/30 to-transparent" />
              
              {/* Animated overlay elements */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={missionInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute inset-0 bg-gradient-to-t from-red-950/50 to-transparent"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={missionInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.7, duration: 0.5, type: "spring" }}
                className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md rounded-2xl px-5 py-3 shadow-xl flex items-center gap-3 border border-white/20"
              >
                <div className="bg-gradient-to-br from-red-600 to-red-700 p-2.5 rounded-xl shadow-lg">
                  <Heart className="w-5 h-5 text-white fill-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Est. since</p>
                  <p className="text-gray-900 font-bold text-base">Puso Ng Ama</p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 40, x: 40, rotate: 5 }}
              animate={missionInView ? { opacity: 1, y: 0, x: 0, rotate: 0 } : {}}
              transition={{ delay: 0.8, duration: 0.7, type: "spring" }}
              className="absolute -bottom-6 -right-4 lg:-right-8 w-48 h-40 rounded-2xl overflow-hidden shadow-2xl border-4 border-white hidden md:block group cursor-pointer"
            >
              <Image
                src={SetImageGoogleById("1vbDP9a12go_DcgxRykoq4pCK-2oH_myX")}
                fill
                alt="Community"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-red-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          </motion.div>

          {/* Text with improved typography */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={missionInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full lg:w-1/2 flex flex-col gap-6"
          >
            <SectionLabel>Mission Statement</SectionLabel>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              What We{" "}
              <span className="text-red-600 relative inline-block">
                Do
                <motion.span
                  initial={{ width: 0 }}
                  animate={missionInView ? { width: "100%" } : {}}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                />
              </span>
            </h2>

            <div className="relative pl-6 border-l-4 border-red-600 bg-red-50/30 rounded-r-2xl p-4">
              <p className="text-gray-700 text-lg md:text-xl italic leading-relaxed font-medium">
                &ldquo;The mission of the PNA is to help people, especially those who are materially poor
                to experience, know, accept, be reconciled by, be healed by, be transformed by and be
                compelled to actions by God&apos;s steadfast, merciful, gracious and infinite love.&rdquo;
              </p>
            </div>

            <p className="text-gray-600 leading-relaxed text-lg">
              We believe that every person, regardless of their circumstance, deserves to
              experience the fullness of God&apos;s love — and we are committed to being
              instruments of that love in every community we serve.
            </p>

            <Link
              href="/about"
              className="inline-flex items-center gap-3 self-start mt-4 text-red-600 font-semibold group relative overflow-hidden"
            >
              <span className="relative z-10 px-6 py-3 bg-gradient-to-r from-red-50 to-transparent rounded-full border border-red-200 group-hover:border-red-300 transition-all duration-300">
                Learn more about PNA
                <ArrowRight className="inline-block ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
              </span>
            </Link>
          </motion.div>

        </div>
      </div>

      {/* ── VISION ──────────────────────────────────────────────────────── */}
      {/* Soft, calming gradient background - easier on the eyes */}
      <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 py-20 md:py-28 lg:py-32 relative overflow-hidden">
        
        {/* Subtle decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-100/20 rounded-full blur-3xl" />
        </div>

        {/* Animated particles - only render on client to avoid hydration mismatch */}
        {mounted && <BackgroundParticles />}

        <div ref={visionRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={visionInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <SectionLabel>Vision Statement</SectionLabel>
            <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Where We&apos;re <span className="text-red-600">Going</span>
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-stretch">

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={visionInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-3xl p-8 md:p-10 flex flex-col gap-6 hover:bg-white/90 transition-all duration-500 shadow-xl shadow-gray-200/50 group"
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 self-start shadow-lg"
              >
                <Eye className="w-7 h-7 text-white" />
              </motion.div>
              
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800">Our Vision for Tomorrow</h3>
              
              <p className="text-gray-700 text-xl italic leading-relaxed">
                &ldquo;We envision communities where every person experiences the transforming
                power of God&apos;s love — communities that are just, compassionate, and alive
                with hope.&rdquo;
              </p>
              
              <p className="text-gray-600 leading-relaxed text-base">
                Through faith-driven action, we work toward a Philippines where no one is
                left behind, and where the poor and marginalized are lifted into dignity.
              </p>

              <div className="mt-4 flex gap-3">
                {['Faith', 'Hope', 'Love'].map((word) => (
                  <span key={word} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-100">
                    {word}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={visionInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="grid grid-cols-2 gap-4 auto-rows-fr"
            >
              {[
                { src: "/images/educational_support_1772187215069.png", alt: "Education", span: "row-span-2", title: "Education" },
                { src: "/images/health_wellness_1772187277594.png", alt: "Health", title: "Health & Wellness" },
                { src: "/images/youth_empowerment_1772187330023.png", alt: "Youth", title: "Youth Empowerment" },
              ].map((item, i) => (
                <motion.div
                  key={item.alt}
                  initial={{ opacity: 0, y: 30 }}
                  animate={visionInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
                  className={`relative overflow-hidden rounded-2xl shadow-xl group cursor-pointer ${item.span || ''}`}
                  style={{ minHeight: item.span ? '300px' : '140px' }}
                >
                  <Image src={item.src} fill alt={item.alt} className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-gray-900/20 to-transparent opacity-70 group-hover:opacity-80 transition-opacity" />
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="absolute bottom-0 left-0 right-0 p-4"
                  >
                    <p className="text-white font-semibold text-lg drop-shadow-lg">{item.title}</p>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </div>
      </div>

      {/* ── PROGRAMS ────────────────────────────────────────────────────── */}
      <div ref={programRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-32">

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={programInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <SectionLabel>Our Programs</SectionLabel>
          <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
            How We <span className="text-red-600">Serve</span>
          </h2>
          <p className="mt-4 text-gray-600 text-lg max-w-2xl mx-auto">
            Four pillars of service that carry Puso Ng Ama&apos;s mission to every corner of need.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {programs.map(({ title, description, image, icon: Icon, color }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 50 }}
              animate={programInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              onHoverStart={() => setHoveredProgram(i)}
              onHoverEnd={() => setHoveredProgram(null)}
              className="group relative h-96 rounded-3xl overflow-hidden shadow-xl cursor-pointer"
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <Image
                src={image}
                fill
                alt={title}
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              <motion.div 
                className={`absolute inset-0 bg-gradient-to-t ${color} transition-opacity duration-300`}
                animate={{ opacity: hoveredProgram === i ? 0.95 : 0.8 }}
              />
              
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: hoveredProgram === i ? 1.1 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white/20 backdrop-blur-md rounded-xl p-3 self-start mb-4 border border-white/30"
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
                
                <h3 className="text-white font-bold text-xl leading-tight mb-2">{title}</h3>
                
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ 
                    opacity: hoveredProgram === i ? 1 : 0,
                    height: hoveredProgram === i ? 'auto' : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="text-white/90 text-sm leading-relaxed"
                >
                  {description}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: hoveredProgram === i ? 1 : 0, x: hoveredProgram === i ? 0 : -10 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="mt-3 flex items-center gap-1 text-white/80 text-xs"
                >
                  <span>Learn more</span>
                  <ChevronRight className="w-3 h-3" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={programInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-12"
        >
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-xl group"
          >
            View All Programs
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
        </motion.div>
      </div>

      {/* ── VALUES ──────────────────────────────────────────────────────── */}
      <div ref={valuesRef} className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-100 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={valuesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <SectionLabel>Core Values</SectionLabel>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold text-gray-900">
              What Drives Us Forward
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {values.map(({ icon: Icon, label, desc, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 40 }}
                animate={valuesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                whileHover={{ y: -5 }}
                className="flex flex-col items-center text-center gap-4 group"
              >
                <motion.div
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className={`bg-gradient-to-br ${color} p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </motion.div>
                
                <div>
                  <p className="font-bold text-gray-900 text-lg mb-1">{label}</p>
                  <p className="text-sm text-gray-500 leading-snug">{desc}</p>
                </div>

                <motion.div
                  initial={{ width: 0 }}
                  whileHover={{ width: "40px" }}
                  className={`h-1 bg-gradient-to-r ${color} rounded-full`}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}