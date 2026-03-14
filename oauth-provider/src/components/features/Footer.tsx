import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Facebook, Heart, ArrowRight, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import SetImageGoogleById from "@/utils/SetImageGoogleById";

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/donation", label: "Donate" },
];

const programs = [
  { href: "/program/misyonero", label: "Misyonero" },
  { href: "/program/youthalive", label: "Youth Alive" },
  { href: "/program/kids-activity", label: "Kid's Activity" },
  { href: "/program/gap-year", label: "Gap Year" },
];

const impact = [
  { href: "/OurImpact/CollegeGraduates", label: "College Graduates" },
  { href: "/OurImpact/ScholarsStories", label: "Scholars Stories" },
  { href: "/OurImpact/Testimonials", label: "Testimonials" },
];

const contactInfo = [
  {
    icon: MapPin,
    label: "Address",
    value: "Phase 3, Payatas B, Quezon City",
    href: "https://maps.app.goo.gl/c5RPie3VQHuboSDU7",
    external: true,
  },
  {
    icon: Phone,
    label: "Phone",
    value: "09351538415",
    href: "tel:09351538415",
    external: false,
  },
  {
    icon: Mail,
    label: "Email",
    value: "pnapayatas@gmail.com",
    href: "mailto:pnapayatas@gmail.com",
    external: false,
  },
];

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300">


      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden py-20">
        <div className="absolute inset-0">
          <Image
            src={SetImageGoogleById("1gBF5WwexzZRNLdNPpRuH5QQ-K7cFMyr_")}
            fill
            alt="CTA background"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-r from-red-950/90 via-red-900/85 to-red-950/90" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8 }}
          className="relative max-w-3xl mx-auto px-4 text-center flex flex-col items-center gap-6"
        >
          <div className="bg-white/15 backdrop-blur-sm p-3 rounded-2xl">
            <Heart className="w-8 h-8 text-white fill-white/50" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Be Part of Something Bigger
          </h2>
          <p className="text-red-100/90 text-lg max-w-xl">
            Join us in spreading God&apos;s love to those who need it most.
            Every act of generosity changes a life forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/donation"
                className="px-8 py-4 bg-white text-red-700 font-bold rounded-2xl shadow-xl hover:bg-red-50 transition-colors duration-300 flex items-center gap-2"
              >
                Donate Now <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

          </div>
        </motion.div>
      </div>

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

        {/* Brand */}
        <div className="flex flex-col gap-5">
          <Link href="/" className="flex items-center gap-3 group w-fit">
            <div className="relative w-10 h-10 shrink-0">
              <Image
                src="/logo.jpg"
                fill
                alt="PNA Logo"
                className="object-cover rounded-full ring-2 ring-red-800 group-hover:ring-red-600 transition-all"
              />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Puso ng Ama</p>
              <p className="text-gray-500 text-xs">Foundation Inc.</p>
            </div>
          </Link>

          <p className="text-gray-400 text-sm leading-relaxed">
            Established in 2005 by Father Paul Uwemedimo in Payatas, PNA — Heart of the Father —
            works toward personal and social transformation of individuals, families, and communities.
          </p>

          <div className="flex items-center gap-3">
            <Link
              href="https://www.facebook.com/pusongama"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-800 hover:bg-red-700 text-gray-300 hover:text-white p-2.5 rounded-xl transition-all duration-200"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-5">
          <h3 className="text-white font-semibold text-sm uppercase tracking-widest">
            Quick Links
          </h3>
          <ul className="flex flex-col gap-2.5">
            {quickLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-gray-400 hover:text-red-400 text-sm flex items-center gap-2 group transition-colors duration-200"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-red-500 transition-colors" />
                  {label}
                </Link>
              </li>
            ))}
            <li className="pt-1">
              <p className="text-gray-600 text-xs uppercase tracking-wider mb-2">Programs</p>
              {programs.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-gray-400 hover:text-red-400 text-sm flex items-center gap-2 group transition-colors duration-200 py-0.5"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-red-500 transition-colors" />
                  {label}
                </Link>
              ))}
            </li>
          </ul>
        </div>

        {/* Our Impact */}
        <div className="flex flex-col gap-5">
          <h3 className="text-white font-semibold text-sm uppercase tracking-widest">
            Our Impact
          </h3>
          <ul className="flex flex-col gap-2.5">
            {impact.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-gray-400 hover:text-red-400 text-sm flex items-center gap-2 group transition-colors duration-200"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-red-500 transition-colors" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-2 border border-gray-800 rounded-2xl p-4 bg-gray-900/50">
            <p className="text-xs text-gray-500 mb-1">Serving since</p>
            <p className="text-2xl font-black text-white">21+</p>
            <p className="text-xs text-red-400 font-medium">Years of Service</p>
          </div>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-5">
          <h3 className="text-white font-semibold text-sm uppercase tracking-widest">
            Contact Us
          </h3>
          <ul className="flex flex-col gap-4">
            {contactInfo.map(({ icon: Icon, label, value, href, external }) => (
              <li key={label}>
                <Link
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex items-start gap-3 group"
                >
                  <div className="bg-gray-800 group-hover:bg-red-700 p-2 rounded-lg transition-colors duration-200 mt-0.5 shrink-0">
                    <Icon className="w-3.5 h-3.5 text-red-400 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">{label}</p>
                    <p className="text-gray-300 group-hover:text-white text-sm transition-colors flex items-center gap-1">
                      {value}
                      {external && <ExternalLink className="w-3 h-3 text-gray-600" />}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-600 text-xs text-center sm:text-left">
            © 2025 Puso ng Ama Foundation Inc. All rights reserved.
          </p>
          <p className="text-gray-700 text-xs flex items-center gap-1.5">
            Made with <Heart className="w-3 h-3 text-red-700 fill-red-700" /> for the community
          </p>
        </div>
      </div>

    </footer>
  );
}
