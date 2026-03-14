'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { AboutPage } from '@/lib/localdb';
import { Calendar, MapPin, Users, Award, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

const History = () => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [direction, setDirection] = useState(0);
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
    
    // Get data from AboutPage
    const aboutData = AboutPage();
    const companyImages = aboutData.image.map(img => img.image);
    const paragraphs = aboutData.paragraph;

    // Milestone data (you can make this dynamic too)
    const milestones = [
        { year: '2010', title: 'Founded', description: 'Started with a vision to serve' },
        { year: '2014', title: 'Expanded', description: 'Opened second location' },
        { year: '2018', title: 'Milestone', description: 'Served 10,000+ families' },
        { year: '2023', title: 'Recognition', description: 'National award recipient' },
    ];

    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        if (isPlaying) {
            interval = setInterval(() => {
                setDirection(1);
                setCurrentImageIndex((prevIndex) => (prevIndex + 1) % companyImages.length);
            }, 4000);
        }

        return () => clearInterval(interval);
    }, [isPlaying, companyImages.length]);

    const handlePrevious = () => {
        setDirection(-1);
        setCurrentImageIndex((prevIndex) => 
            prevIndex === 0 ? companyImages.length - 1 : prevIndex - 1
        );
    };

    const handleNext = () => {
        setDirection(1);
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % companyImages.length);
    };

    const handleImageError = (index: number) => {
        setImageErrors(prev => new Set(prev).add(index));
    };

    // Fallback colors for images that fail to load
    const fallbackColors = [
        'from-red-500 to-red-600',
        'from-blue-500 to-blue-600',
        'from-green-500 to-green-600',
        'from-purple-500 to-purple-600',
        'from-yellow-500 to-yellow-600',
        'from-indigo-500 to-indigo-600',
        'from-pink-500 to-pink-600',
    ];

    // Fixed variants with proper typing
    const variants: Variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.8,
            transition: {
                duration: 0.5,
            },
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.5,
                type: "spring",
                stiffness: 300,
                damping: 30,
            },
        },
        exit: (direction: number) => ({
            x: direction > 0 ? -1000 : 1000,
            opacity: 0,
            scale: 0.8,
            transition: {
                duration: 0.5,
            },
        }),
    };

    return (
        <div className="bg-gradient-to-br from-white to-red-50 rounded-3xl shadow-2xl p-8 md:p-10 mb-16 border border-red-100 relative overflow-hidden group">
            
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-200/20 rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl -ml-20 -mb-20" />
            
            {/* Header with animated underline */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-10 relative"
            >
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    Our <span className="text-red-600 relative inline-block">Journey
                        <motion.span
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                        />
                    </span>
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                    A decade of dedication, compassion, and transforming lives through service
                </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-10 items-start">
                
                {/* Left Column - Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="space-y-6"
                >
                    {/* Timeline-like paragraphs */}
                    <div className="relative pl-8 space-y-6">
                        {/* Vertical timeline line */}
                        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-red-600 via-red-400 to-transparent" />
                        
                        {paragraphs.map((para, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                className="relative"
                            >
                                {/* Timeline dot */}
                                <div className="absolute -left-8 top-1.5 w-4 h-4 rounded-full bg-red-600 border-4 border-red-200" />
                                
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                                    <p className="text-gray-700 leading-relaxed">
                                        {para.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Milestone stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
                        {milestones.map((milestone, index) => (
                            <motion.div
                                key={milestone.year}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                className="text-center p-3 rounded-xl bg-white shadow-md border border-gray-100 hover:border-red-200 transition-all duration-300 group"
                            >
                                <div className="text-sm font-bold text-red-600">{milestone.year}</div>
                                <div className="text-xs font-semibold text-gray-800">{milestone.title}</div>
                                <div className="text-[10px] text-gray-500 mt-1">{milestone.description}</div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Right Column - Enhanced Carousel */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="relative"
                >
                    {/* Main carousel container */}
                    <div className="relative h-[450px] rounded-2xl overflow-hidden shadow-2xl group/carousel">
                        
                        {/* Image with animation */}
                        <AnimatePresence initial={false} custom={direction} mode="wait">
                            <motion.div
                                key={currentImageIndex}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                className="absolute inset-0"
                            >
                                {!imageErrors.has(currentImageIndex) ? (
                                    <Image
                                        src={companyImages[currentImageIndex]}
                                        alt={`Company history image ${currentImageIndex + 1}`}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="object-cover"
                                        onError={() => handleImageError(currentImageIndex)}
                                        priority={currentImageIndex === 0}
                                    />
                                ) : (
                                    <div className={`w-full h-full bg-gradient-to-br ${fallbackColors[currentImageIndex % fallbackColors.length]} flex items-center justify-center`}>
                                        <span className="text-white text-2xl font-bold opacity-50">
                                            PNA {currentImageIndex + 1}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            </motion.div>
                        </AnimatePresence>

                        {/* Stats overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
                            <motion.div
                                key={currentImageIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="space-y-2"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm">{milestones[currentImageIndex % milestones.length].year}</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm">Philippines</span>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold">{milestones[currentImageIndex % milestones.length].title}</h3>
                                <p className="text-white/90 text-sm max-w-xs">
                                    {milestones[currentImageIndex % milestones.length].description}
                                </p>
                            </motion.div>
                        </div>

                        {/* Navigation buttons */}
                        <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between z-20 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handlePrevious}
                                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all duration-300 border border-white/30"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleNext}
                                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all duration-300 border border-white/30"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </motion.button>
                        </div>

                        {/* Play/Pause button */}
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all duration-300 z-20 border border-white/30"
                        >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Thumbnail strip */}
                    <div className="flex gap-2 mt-4 justify-center">
                        {companyImages.map((_, index) => (
                            <motion.button
                                key={index}
                                whileHover={{ scale: 1.1, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setDirection(index > currentImageIndex ? 1 : -1);
                                    setCurrentImageIndex(index);
                                }}
                                className={`relative w-12 h-12 rounded-lg overflow-hidden transition-all duration-300 ${
                                    index === currentImageIndex 
                                        ? 'ring-2 ring-red-600 ring-offset-2 scale-110' 
                                        : 'opacity-50 hover:opacity-100'
                                }`}
                            >
                                {!imageErrors.has(index) ? (
                                    <Image
                                        src={companyImages[index]}
                                        alt={`Thumbnail ${index + 1}`}
                                        fill
                                        sizes="48px"
                                        className="object-cover"
                                        onError={() => handleImageError(index)}
                                    />
                                ) : (
                                    <div className={`w-full h-full bg-gradient-to-br ${fallbackColors[index % fallbackColors.length]}`} />
                                )}
                            </motion.button>
                        ))}
                    </div>

                    {/* Image counter */}
                    <div className="absolute -bottom-2 -right-2 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                        {currentImageIndex + 1} / {companyImages.length}
                    </div>
                </motion.div>
            </div>

            {/* Quick stats bar at the bottom */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-6 border-t border-gray-200"
            >
                {[
                    { icon: Calendar, label: 'Years Active', value: '13+' },
                    { icon: Users, label: 'Lives Impacted', value: '50K+' },
                    { icon: MapPin, label: 'Communities', value: '100+' },
                    { icon: Award, label: 'Awards', value: '15+' },
                ].map((stat, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                            <stat.icon className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                            <div className="text-xs text-gray-500">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

export default History;