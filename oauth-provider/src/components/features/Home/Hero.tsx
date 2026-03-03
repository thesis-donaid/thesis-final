"use client"
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useTransform, useSpring, useScroll } from 'motion/react'
import { Heart, ArrowDown, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import Image from 'next/image'

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(0) // -1 for left, 1 for right
  const [isClient, setIsClient] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [particles, setParticles] = useState<Array<{ x: number; y: number; duration: number; delay: number }>>([])
  const containerRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  useEffect(() => {
    setIsClient(true)
    // Generate particles with random values once on client
    const newParticles = [...Array(15)].map(() => ({
      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1024),
      y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 768),
      duration: 5 + Math.random() * 5,
      delay: Math.random() * 5,
    }))
    setParticles(newParticles)
  }, [])

  // Parallax effects based on scroll
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.2])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -100])
  const springConfig = { damping: 20, stiffness: 100 }
  const springTextY = useSpring(textY, springConfig)

  // Carousel items with enhanced metadata
  const carouselItems = [
    {
      id: 1,
      image: "https://drive.google.com/uc?export=download&id=1UzGiXpzKlDVZ8OAnkwHiZ2n0k5sOrM1Y",
      title: "Building Hope, Changing Lives",
      subtitle: "Together, we create lasting impact in communities around the world",
      description: "In 2005 father Paul Uwemedimo responded to the situation in Payatas and established the PNA foundation which means HEART OF THE FATHER with the aim of personal and social transformation of individuals, families and communities.",
      highlight: "Changing Lives",
      color: "from-red-400 to-orange-400",
      stats: "21+ Years of Service"
    },
    {
      id: 2,
      image: "https://drive.google.com/uc?export=view&id=1s5R80sQQt1rIqSM1kjsLYYM4SqEKav_P",
      title: "Transforming Communities",
      subtitle: "Through compassion, dedication, and unwavering commitment",
      description: "We focus on child and youth development, education, human and spiritual formation to create meaningful change in the communities we serve.",
      highlight: "Transforming Communities",
      color: "from-blue-400 to-purple-400",
      stats: "10K+ Lives Impacted"
    },
    {
      id: 3,
      image: "https://drive.google.com/uc?export=view&id=1VO0zTH9JMgOVIJXmuTsE7mPIrk0uUVcl",
      title: "Empowering Futures",
      subtitle: "Creating opportunities for growth and sustainable development",
      description: "Through community development, income generation, health and property ownership programs, we empower families to build sustainable futures.",
      highlight: "Empowering Futures",
      color: "from-green-400 to-teal-400",
      stats: "50+ Communities"
    }
  ]

  const nextSlide = () => {
    setDirection(1)
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length)
  }

  const prevSlide = () => {
    setDirection(-1)
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length)
  }

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1)
    setCurrentSlide(index)
  }

  // Handle touch/swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dragEndX = e.changedTouches[0].clientX
    const difference = dragStartX - dragEndX

    if (Math.abs(difference) > 50) {
      if (difference > 0) {
        nextSlide()
      } else {
        prevSlide()
      }
    }
  }

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1)
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [carouselItems.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevSlide()
      if (e.key === 'ArrowRight') nextSlide()
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Slide variants for animations - Smooth fade/blend effect
  const slideVariants = {
    enter: {
      opacity: 0,
    },
    center: {
      opacity: 1,
    },
    exit: {
      opacity: 0,
    }
  }

  // Text animation variants - Enhanced with more dynamic motion
  const textVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: custom * 0.15,
        duration: 0.8,
      }
    }),
    exit: { opacity: 0, y: -20, scale: 0.95 }
  }

  return (
    <motion.section 
      ref={containerRef}
      id="hero" 
      className="relative mt-0 md:mt-23 w-full min-h-screen md:min-h-[calc(100vh-5.75rem)] flex justify-center items-center overflow-hidden"
      style={{ opacity: heroOpacity }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Animated Background with Parallax */}
      <div className="absolute inset-0">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            {/* Image with Parallax */}
            <motion.div 
              className="relative w-full h-full"
              style={{ scale: heroScale }}
            >
              <Image 
                src={carouselItems[currentSlide].image}
                fill
                alt="Foundation Hero"
                className="object-cover object-top"
                priority
                sizes="100vw"
              />
            </motion.div>
            
            {/* Gradient Overlay with Animation */}
            <motion.div 
              className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-black/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            />
            {/* Dynamic overlay with gradient based on slide */}
            <motion.div 
              className={`absolute inset-0 bg-linear-to-r ${carouselItems[currentSlide].color} opacity-0`}
              animate={{ opacity: [0.05, 0.1, 0.05] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Particles Effect - Client side only */}
      {isClient && particles.length > 0 && (
        <div className="absolute inset-0 pointer-events-none hidden md:block">
          {particles.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              initial={{
                x: particle.x,
                y: particle.y,
              }}
              animate={{
                y: [null, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* Navigation Arrows with Animation - Hidden on mobile */}
      <motion.div 
        className="hidden lg:flex absolute inset-y-0 left-0 z-30 items-center justify-start pl-4 lg:pl-12"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
      >
        <motion.button 
          onClick={prevSlide}
          className="p-3 md:p-4 rounded-full bg-white/15 hover:bg-white/30 transition-all duration-300 backdrop-blur-md group border border-white/20"
          whileHover={{ scale: 1.2, backgroundColor: "rgba(255,255,255,0.4)" }}
          whileTap={{ scale: 0.85 }}
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 md:w-7 h-6 md:h-7 group-hover:scale-125 transition-transform text-white" />
        </motion.button>
      </motion.div>
      
      <motion.div 
        className="hidden lg:flex absolute inset-y-0 right-0 z-30 items-center justify-end pr-4 lg:pr-12"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
      >
        <motion.button 
          onClick={nextSlide}
          className="p-3 md:p-4 rounded-full bg-white/15 hover:bg-white/30 transition-all duration-300 backdrop-blur-md group border border-white/20"
          whileHover={{ scale: 1.2, backgroundColor: "rgba(255,255,255,0.4)" }}
          whileTap={{ scale: 0.85 }}
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 md:w-7 h-6 md:h-7 group-hover:scale-125 transition-transform text-white" />
        </motion.button>
      </motion.div>

      {/* Hero Content with Spring Animations */}
      <motion.div 
        className="relative z-20 text-white px-4 sm:px-6 flex flex-col w-full max-w-6xl items-center"
        style={{ y: springTextY }}
      >
        <div className="w-full max-w-5xl">
          {/* Main Title */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`title-${currentSlide}`}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={textVariants}
              custom={0}
              className="mb-4 sm:mb-6 md:mb-8"
            >
              <motion.h1 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black leading-tight md:leading-tight tracking-tight"
              >
                {carouselItems[currentSlide].title.split(', ').map((part, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 + 0.2, duration: 0.6 }}
                  >
                    {part}
                  </motion.div>
                ))}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <motion.span 
                  className={`block bg-linear-to-r ${carouselItems[currentSlide].color} bg-clip-text text-transparent text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black mt-2 drop-shadow-lg`}
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
                >
                  {carouselItems[currentSlide].highlight}
                </motion.span>
              </motion.div>
            </motion.div>
          </AnimatePresence>
          
          {/* Subtitle */}
          <AnimatePresence mode="wait">
            <motion.p 
              key={`subtitle-${currentSlide}`}
              className="text-sm sm:text-lg md:text-xl mb-5 leading-relaxed opacity-95 max-w-3xl font-medium"
              variants={textVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              custom={1}
            >
              {carouselItems[currentSlide].subtitle}
            </motion.p>
          </AnimatePresence>

          {/* Description */}
          <AnimatePresence mode="wait">
            <motion.p 
              key={`description-${currentSlide}`}
              className="text-xs sm:text-sm md:text-base mb-7 max-w-3xl leading-relaxed opacity-90 text-white/85"
              variants={textVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              custom={2}
            >
              {carouselItems[currentSlide].description}
            </motion.p>
          </AnimatePresence>

          {/* Stats Badge with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`stats-${currentSlide}`}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-linear-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-md rounded-full text-xs sm:text-sm font-bold border border-amber-400/50 shadow-lg shadow-amber-500/20 mb-6 md:mb-8"
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <motion.div 
                className="w-2 h-2 bg-amber-400 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.8, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              {carouselItems[currentSlide].stats}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CTA Buttons with Hover Animations - Improved responsive */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 sm:gap-5 md:gap-8 mb-8 md:mb-12 w-full sm:w-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button 
            className="group relative px-8 sm:px-10 py-3.5 sm:py-4 md:py-4 bg-linear-to-r from-red-500 via-red-600 to-red-700 rounded-xl md:rounded-2xl text-sm md:text-base font-bold overflow-hidden whitespace-nowrap shadow-lg shadow-red-500/50"
            whileHover={{ scale: 1.08, boxShadow: "0 20px 40px rgba(239, 68, 68, 0.6)" }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span 
              className="absolute inset-0 bg-linear-to-r from-red-700 to-red-800"
              initial={{ x: "-100%" }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.4 }}
            />
            <motion.span 
              className="absolute inset-0 bg-white opacity-0"
              whileHover={{ opacity: 0.1 }}
              transition={{ duration: 0.4 }}
            />
            <span className="relative flex items-center justify-center gap-2">
              Make a Donation
              <motion.span
                animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 3 }}
              >
                <Heart className="w-5 sm:w-6 h-5 sm:h-6" fill="currentColor" />
              </motion.span>
            </span>
          </motion.button>
          
          <motion.button 
            className="group relative px-8 sm:px-10 py-3.5 sm:py-4 md:py-4 border-2 border-white/90 rounded-xl md:rounded-2xl text-sm md:text-base font-bold overflow-hidden whitespace-nowrap backdrop-blur-sm"
            whileHover={{ scale: 1.08, borderColor: "rgba(255,255,255,1)" }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span 
              className="absolute inset-0 bg-white"
              initial={{ y: "100%" }}
              whileHover={{ y: 0 }}
              transition={{ duration: 0.4 }}
            />
            <motion.span 
              className="absolute inset-0 border border-white/50"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="relative flex items-center gap-2 group-hover:text-red-600 transition-colors duration-300">
              Learn Our Story
              <motion.span 
                className="group-hover:translate-x-1 transition-transform"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Play className="w-5 sm:w-6 h-5 sm:h-6" />
              </motion.span>
            </span>
          </motion.button>
        </motion.div>

        {/* Carousel Indicators with Spring Animation */}
        <motion.div 
          className="flex gap-3 md:gap-4 mb-8 md:mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {carouselItems.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-3 rounded-full transition-all backdrop-blur-sm ${
                index === currentSlide 
                  ? 'bg-linear-to-r from-red-500 to-orange-500 shadow-lg shadow-red-500/50' 
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              animate={{
                width: index === currentSlide ? 40 : 10,
              }}
              whileHover={{ scale: 1.15, opacity: 1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Logo with Floating Animation - Adjusted responsive positioning */}
      <motion.div 
        className='absolute w-16 h-16 sm:w-24 sm:h-24 bottom-12 right-4 md:bottom-auto md:top-20 md:right-8 md:w-80 md:h-80 rounded-full -z-5 opacity-40 md:opacity-50'
        animate={{
          y: [0, -15, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Image
          src='https://drive.google.com/uc?export=view&id=1GYeMYHzSAjCAA4X72AS6MF9IwYar9JlW'
          alt='Logo'
          fill
          className='rounded-full object-cover'
        />
      </motion.div>

      {/* Scroll Indicator with Bounce Animation - Hidden on mobile */}
      <motion.div 
        className="hidden md:block absolute bottom-6 md:bottom-8 left-1/2 right-1/2 transform -translate-x-1/2 z-20"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ArrowDown className="w-5 h-5 md:w-6 md:h-6 text-white/80" />
          </motion.div>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <motion.div 
        className="absolute bottom-0 left-0 h-1 bg-linear-to-r from-red-500 to-orange-500 z-30"
        initial={{ width: "0%" }}
        animate={{ width: `${((currentSlide + 1) / carouselItems.length) * 100}%` }}
        transition={{ duration: 0.5 }}
      />
    </motion.section>
  )}