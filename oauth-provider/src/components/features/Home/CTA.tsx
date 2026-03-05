import { motion } from "framer-motion"
import { ArrowRight, Heart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function CTA() {
    return(
      <div className="relative overflow-hidden py-20">
        <div className="absolute inset-0">
          <Image
            src="/images/youth_empowerment_1772187330023.png"
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
                href="/donate"
                className="px-8 py-4 bg-white text-red-700 font-bold rounded-2xl shadow-xl hover:bg-red-50 transition-colors duration-300 flex items-center gap-2"
              >
                Donate Now <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

          </div>
        </motion.div>
      </div>
    )
}