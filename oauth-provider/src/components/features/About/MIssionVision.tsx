'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Heart, Target, Globe, Users, Shield, HandHeart, Sparkles, ArrowRight } from 'lucide-react';

const MissionVision = () => {
    // Core values data
    const coreValues = [
        {
            icon: Heart,
            title: 'Compassion',
            description: 'Serving with empathy, kindness, and understanding, putting the needs of others before our own.',
            color: 'from-red-500 to-red-600',
            bgColor: 'bg-red-50',
            iconColor: 'text-red-600',
        },
        {
            icon: Shield,
            title: 'Integrity',
            description: 'Upholding the highest standards of honesty, transparency, and ethical conduct in all we do.',
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
        },
        {
            icon: HandHeart,
            title: 'Service',
            description: 'Dedicating ourselves to selfless service, going above and beyond to make a difference.',
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600',
        },
        {
            icon: Target,
            title: 'Excellence',
            description: 'Striving for the highest quality in every program, partnership, and interaction.',
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600',
        },
    ];

    // Community impact stats
    const communityStats = [
        { label: 'Communities Served', value: '100+', icon: Users },
        { label: 'Volunteers', value: '5,000+', icon: Sparkles },
        { label: 'Years of Service', value: '21+', icon: Target },
        { label: 'Lives Impacted', value: '50K+', icon: Heart },
    ];

    return (
        <div className="space-y-16 mb-16">
            {/* Mission & Vision Cards */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Mission Card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="group relative bg-gradient-to-br from-white to-red-50 rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500"
                >
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-200/20 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-300/20 rounded-full blur-2xl -ml-16 -mb-16 group-hover:scale-150 transition-transform duration-700" />
                    
                    <div className="relative p-8 md:p-10">
                        {/* Icon with animated background */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-red-600/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                            <div className="relative w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                                <Heart className="w-8 h-8 text-white fill-white" />
                            </div>
                        </div>

                        {/* Title with animated underline */}
                        <h3 className="text-3xl font-bold text-gray-900 mb-4 relative inline-block">
                            Our Mission
                            <motion.span
                                initial={{ width: 0 }}
                                whileInView={{ width: "100%" }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                                className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                            />
                        </h3>

                        {/* Mission statement */}
                        <p className="text-gray-700 text-lg leading-relaxed mb-6">
                            To empower communities through sustainable solutions that drive positive change, 
                            enhance quality of life, and create lasting impact. We are committed to serving 
                            those in need with compassion, integrity, and a shared vision for a better world.
                        </p>

                        {/* Key points */}
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            {['Sustainable Solutions', 'Lasting Impact', 'Compassionate Service', 'Community First'].map((point, index) => (
                                <motion.div
                                    key={point}
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 + index * 0.1 }}
                                    className="flex items-center gap-2 text-sm text-gray-600"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                    <span>{point}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Vision Card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="group relative bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500"
                >
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-300/20 rounded-full blur-2xl -ml-16 -mb-16 group-hover:scale-150 transition-transform duration-700" />
                    
                    <div className="relative p-8 md:p-10">
                        {/* Icon with animated background */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-blue-600/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                            <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                                <Globe className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        {/* Title with animated underline */}
                        <h3 className="text-3xl font-bold text-gray-900 mb-4 relative inline-block">
                            Our Vision
                            <motion.span
                                initial={{ width: 0 }}
                                whileInView={{ width: "100%" }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                                className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                            />
                        </h3>

                        {/* Vision statement */}
                        <p className="text-gray-700 text-lg leading-relaxed mb-6">
                            To create a world where every community thrives with dignity, equality, and opportunity. 
                            We envision a future where compassion drives action, where no one is left behind, 
                            and where sustainable development creates lasting positive change for generations to come.
                        </p>

                        {/* Vision pillars */}
                        <div className="flex flex-wrap gap-3 mt-6">
                            {['Dignity', 'Equality', 'Opportunity', 'Sustainability', 'Compassion'].map((pillar, index) => (
                                <motion.span
                                    key={pillar}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 + index * 0.1 }}
                                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100"
                                >
                                    {pillar}
                                </motion.span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Core Values Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
            >
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Our Core <span className="text-red-600">Values</span>
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        The principles that guide every decision, action, and interaction
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {coreValues.map((value, index) => (
                        <motion.div
                            key={value.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="group relative bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:border-transparent transition-all duration-300"
                        >
                            {/* Gradient hover effect */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${value.color} rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                            
                            {/* Icon with colored background */}
                            <div className={`w-14 h-14 ${value.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                <value.icon className={`w-7 h-7 ${value.iconColor} group-hover:scale-110 transition-transform duration-300`} />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors duration-300">
                                {value.title}
                            </h3>
                            
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {value.description}
                            </p>

                            {/* Animated bottom line */}
                            <motion.div
                                initial={{ width: 0 }}
                                whileHover={{ width: "40px" }}
                                className={`h-1 bg-gradient-to-r ${value.color} rounded-full mt-4`}
                            />
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Community Impact Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-3xl overflow-hidden"
            >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32" />
                
                <div className="relative p-8 md:p-12">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Community <span className="text-red-200">Impact</span>
                        </h2>
                        <p className="text-red-100 text-lg max-w-2xl mx-auto">
                            Together, we&apos;re making a difference in communities across the Philippines
                        </p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {communityStats.map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.5 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ 
                                    delay: index * 0.1,
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 20
                                }}
                                className="text-center group"
                            >
                                <div className="relative mb-3">
                                    <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                                    <div className="relative w-16 h-16 mx-auto bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-300">
                                        <stat.icon className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                                
                                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-red-200">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="text-center mt-10"
                    >
                        <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-red-600 rounded-full font-semibold hover:bg-red-50 transition-all duration-300 shadow-lg hover:shadow-xl group">
                            Join Our Community
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </button>
                    </motion.div>
                </div>
            </motion.div>

            {/* Community Partners Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center"
            >
                <p className="text-gray-500 mb-4">Trusted by communities and partners nationwide</p>
                <div className="flex flex-wrap justify-center gap-8 items-center opacity-50">
                    {/* Add partner logos here */}
                    <div className="w-20 h-12 bg-gray-200 rounded-lg" />
                    <div className="w-20 h-12 bg-gray-200 rounded-lg" />
                    <div className="w-20 h-12 bg-gray-200 rounded-lg" />
                    <div className="w-20 h-12 bg-gray-200 rounded-lg" />
                </div>
            </motion.div>
        </div>
    );
};

export default MissionVision;