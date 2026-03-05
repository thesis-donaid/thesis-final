"use client";

import { motion, useInView } from "motion/react";
import { ArrowRight, Heart, Target, Eye, Users} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { programs } from "@/lib/localdb";
import SetImageGoogleById from "@/utils/SetImageGoogleById";

const values = [
  { icon: Heart,   label: "Compassion",  desc: "Love in action for every person" },
  { icon: Target,  label: "Mission",     desc: "Purposeful service to the poor" },
  { icon: Eye,     label: "Vision",      desc: "A transformed and dignified life" },
  { icon: Users,   label: "Community",   desc: "Together toward a better world" },
];

function SectionLabel({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 text-sm font-semibold tracking-widest uppercase ${light ? "text-red-200" : "text-red-600"}`}>
      <span className={`w-6 h-px inline-block ${light ? "bg-red-200" : "bg-red-600"}`} />
      {children}
      <span className={`w-6 h-px inline-block ${light ? "bg-red-200" : "bg-red-600"}`} />
    </span>
  );
}

export default function MissionVisionSection() {
  const missionRef = useRef(null);
  const visionRef  = useRef(null);
  const programRef = useRef(null);
  const valuesRef  = useRef(null);

  const missionInView = useInView(missionRef, { once: true, margin: "-80px" });
  const visionInView  = useInView(visionRef,  { once: true, margin: "-80px" });
  const programInView = useInView(programRef, { once: true, margin: "-80px" });
  const valuesInView  = useInView(valuesRef,  { once: true, margin: "-80px" });

  return (
    <section className="w-full overflow-hidden bg-white">

      {/* ── MISSION ─────────────────────────────────────────────────────── */}
      <div ref={missionRef} className="relative max-w-7xl mx-auto px-4 md:px-10 py-20 md:py-28">
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-red-50/60 blur-3xl" />

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={missionInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative w-full lg:w-1/2 shrink-0"
          >
            <div className="relative h-80 md:h-120 rounded-3xl overflow-hidden shadow-2xl shadow-red-900/15">
              <Image
                src="https://drive.google.com/uc?export=view&id=1zc1VoQ3aD9QsS1kruZmUTcriLkZsG69j"
                fill
                alt="PNA Mission"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-tr from-red-950/50 via-transparent to-transparent" />

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={missionInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-xl flex items-center gap-3"
              >
                <div className="bg-red-600 p-2 rounded-xl">
                  <Heart className="w-5 h-5 text-white fill-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Est. since</p>
                  <p className="text-gray-900 font-bold text-sm">Puso Ng Ama</p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30, x: 30 }}
              animate={missionInView ? { opacity: 1, y: 0, x: 0 } : {}}
              transition={{ delay: 0.35, duration: 0.7 }}
              className="absolute -bottom-8 -right-4 lg:-right-8 w-44 h-36 rounded-2xl overflow-hidden shadow-2xl border-4 border-white hidden md:block"
            >
              <Image
                src={SetImageGoogleById("1DMrHrQqxG-ASzk0lCC_UPQPl0PmmlBTP")}
                fill
                alt="Community"
                className="object-cover"
              />
            </motion.div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={missionInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="w-full lg:w-1/2 flex flex-col gap-6"
          >
            <SectionLabel>Mission Statement</SectionLabel>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              What We{" "}
              <span className="text-red-600 relative">
                Do
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 80 8" fill="none">
                  <path d="M2 6 Q40 2 78 6" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                </svg>
              </span>
            </h2>

            <div className="relative pl-6 border-l-4 border-red-600">
              <p className="text-gray-600 text-lg italic leading-relaxed">
                &ldquo;The mission of the PNA is to help people, especially those who are materially poor
                to experience, know, accept, be reconciled by, be healed by, be transformed by and be
                compelled to actions by God&apos;s steadfast, merciful, gracious and infinite love.&rdquo;
              </p>
            </div>

            <p className="text-gray-500 leading-relaxed">
              We believe that every person, regardless of their circumstance, deserves to
              experience the fullness of God&apos;s love — and we are committed to being
              instruments of that love in every community we serve.
            </p>

            <Link
              href="/about"
              className="inline-flex items-center gap-2 self-start mt-2 text-red-600 font-semibold group"
            >
              <span className="border-b-2 border-red-200 group-hover:border-red-600 transition-colors duration-300">
                Learn more about PNA
              </span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>
          </motion.div>

        </div>
      </div>

      {/* ── VISION ──────────────────────────────────────────────────────── */}
      <div className="bg-linear-to-br from-red-700 via-red-800 to-red-950 py-20 md:py-28 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-lg h-128 rounded-full border border-white/5 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-3xl h-192 rounded-full border border-white/5 translate-x-1/3 translate-y-1/3" />

        <div ref={visionRef} className="relative max-w-7xl mx-auto px-4 md:px-10">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={visionInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="text-center mb-14"
          >
            <SectionLabel light>Vision Statement</SectionLabel>
            <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Where We&apos;re Going
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 items-center">

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={visionInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-3xl p-8 md:p-10 flex flex-col gap-6"
            >
              <div className="bg-white/15 rounded-2xl p-4 self-start">
                <Eye className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Our Vision</h3>
              <p className="text-red-100/90 text-lg italic leading-relaxed">
                &ldquo;We envision communities where every person experiences the transforming
                power of God&apos;s love — communities that are just, compassionate, and alive
                with hope.&rdquo;
              </p>
              <p className="text-red-200/80 leading-relaxed text-sm">
                Through faith-driven action, we work toward a Philippines where no one is
                left behind, and where the poor and marginalized are lifted into dignity.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={visionInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="grid grid-cols-2 gap-3"
            >
              {[
                { src: "/images/educational_support_1772187215069.png", alt: "Education", span: "col-span-2 h-48" },
                { src: "/images/health_wellness_1772187277594.png",      alt: "Health",   span: "h-32" },
                { src: "/images/youth_empowerment_1772187330023.png",    alt: "Youth",    span: "h-32" },
              ].map(({ src, alt, span }, i) => (
                <motion.div
                  key={alt}
                  initial={{ opacity: 0, y: 20 }}
                  animate={visionInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                  className={`relative overflow-hidden rounded-2xl shadow-xl ${span}`}
                >
                  <Image src={src} fill alt={alt} className="object-cover" />
                  <div className="absolute inset-0 bg-linear-to-t from-red-950/60 to-transparent" />
                  <p className="absolute bottom-3 left-4 text-white text-xs font-semibold tracking-wide">{alt}</p>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </div>
      </div>

      {/* ── PROGRAMS ────────────────────────────────────────────────────── */}
      <div ref={programRef} className="max-w-7xl mx-auto px-4 md:px-10 py-20 md:py-28">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={programInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <SectionLabel>Our Programs</SectionLabel>
          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
            How We Serve
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            Four pillars of service that carry Puso Ng Ama&apos;s mission to every corner of need.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {programs.map(({ title, description, image, icon: Icon, color }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 40 }}
              animate={programInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group relative h-80 rounded-3xl overflow-hidden shadow-lg cursor-pointer"
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
            >
              <Image
                src={image}
                fill
                alt={title}
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className={`absolute inset-0 bg-linear-to-t ${color} transition-opacity duration-300 group-hover:opacity-95`} />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 self-start mb-3">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg leading-tight mb-2">{title}</h3>
                <p className="text-white/80 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-h-0 group-hover:max-h-24 overflow-hidden">
                  {description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── VALUES ──────────────────────────────────────────────────────── */}
      <div ref={valuesRef} className="bg-gray-50 border-y border-gray-100 py-14">
        <div className="max-w-7xl mx-auto px-4 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {values.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 30 }}
                animate={valuesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="flex flex-col items-center text-center gap-3 group"
              >
                <motion.div
                  whileHover={{ scale: 1.12, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-white border border-gray-100 shadow-md rounded-2xl p-4 group-hover:border-red-100 transition-all duration-300"
                >
                  <Icon className="w-7 h-7 text-red-600" />
                </motion.div>
                <p className="font-bold text-gray-900">{label}</p>
                <p className="text-sm text-gray-500 leading-snug">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>


    </section>
  );
}
