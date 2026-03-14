'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { StaffMember } from '@/types/localdb';
import { staffMembers } from '@/lib/localdb';
import { 
    Mail, Linkedin, Twitter, Github, MapPin, 
    Calendar, Award, ChevronRight, X, Users,
    Briefcase, GraduationCap, Heart, MessageCircle,
    Phone, ExternalLink
} from 'lucide-react';

const StaffCard: React.FC<{ member: StaffMember; index: number }> = ({ member, index }) => {
    const [imageError, setImageError] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    
    // Function to extract initials from name
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    // Generate a consistent color based on name
    const getGradientColor = (name: string) => {
        const colors = [
            'from-red-500 to-red-600',
            'from-blue-500 to-blue-600',
            'from-green-500 to-green-600',
            'from-purple-500 to-purple-600',
            'from-amber-500 to-orange-600',
            'from-indigo-500 to-indigo-600',
            'from-pink-500 to-rose-600',
            'from-teal-500 to-cyan-600',
        ];
        
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[index % colors.length];
    };

    const gradientColor = getGradientColor(member.name);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className="group relative bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-100 cursor-pointer"
                onClick={() => setShowDetails(true)}
            >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-100 to-transparent rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-100 to-transparent rounded-full blur-2xl -ml-16 -mb-16 group-hover:scale-150 transition-transform duration-700" />
                
                {/* Image section with overlay */}
                <div className="relative h-64 w-full overflow-hidden">
                    {!imageError ? (
                        <>
                            <Image
                                src={member.image}
                                alt={member.name}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                onError={() => setImageError(true)}
                            />
                            {/* Gradient overlay that appears on hover */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isHovered ? 0.6 : 0 }}
                                className={`absolute inset-0 bg-gradient-to-t ${gradientColor}`}
                            />
                        </>
                    ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${gradientColor} flex items-center justify-center`}>
                            <div className="text-5xl font-bold text-white bg-white/20 backdrop-blur-sm rounded-full w-28 h-28 flex items-center justify-center shadow-xl">
                                {getInitials(member.name)}
                            </div>
                        </div>
                    )}

                    {/* Department badge */}
                    <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-red-600 rounded-full text-xs font-semibold shadow-lg border border-white/20">
                            {member.department}
                        </span>
                    </div>

                    {/* Social links - appear on hover */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
                        className="absolute bottom-4 right-4 flex gap-2"
                    >
                        <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 shadow-lg">
                            <Mail className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-lg">
                            <Linkedin className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-sky-500 hover:bg-sky-500 hover:text-white transition-all duration-300 shadow-lg">
                            <Twitter className="w-4 h-4" />
                        </button>
                    </motion.div>
                </div>

                {/* Content section */}
                <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-red-600 transition-colors duration-300">
                        {member.name}
                    </h3>
                    <p className={`text-sm font-semibold bg-gradient-to-r ${gradientColor} bg-clip-text text-transparent mb-3`}>
                        {member.position}
                    </p>
                    
                    {/* Bio preview */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {member.bio}
                    </p>

                    {/* Quick info badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {member.expertise?.slice(0, 3).map((skill, i) => (
                            <span 
                                key={i}
                                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>

                    {/* View profile button */}
                    <motion.button
                        whileHover={{ x: 5 }}
                        className="inline-flex items-center gap-1 text-red-600 text-sm font-medium group"
                    >
                        View Profile
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                </div>

                {/* Status indicator */}
                <div className="absolute top-4 right-4">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                </div>
            </motion.div>

            {/* Detailed Modal */}
            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowDetails(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setShowDetails(false)}
                                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-all duration-300 shadow-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex flex-col md:flex-row">
                                {/* Left column - Image */}
                                <div className="md:w-2/5 relative h-80 md:h-auto">
                                    {!imageError ? (
                                        <Image
                                            src={member.image}
                                            alt={member.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className={`w-full h-full bg-gradient-to-br ${gradientColor} flex items-center justify-center`}>
                                            <div className="text-7xl font-bold text-white bg-white/20 backdrop-blur-sm rounded-full w-40 h-40 flex items-center justify-center shadow-2xl">
                                                {getInitials(member.name)}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right column - Details */}
                                <div className="md:w-3/5 p-8">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{member.name}</h2>
                                    <p className={`text-xl font-semibold bg-gradient-to-r ${gradientColor} bg-clip-text text-transparent mb-4`}>
                                        {member.position}
                                    </p>
                                    
                                    <p className="text-gray-600 mb-6 leading-relaxed">
                                        {member.bio}
                                    </p>

                                    {/* Details grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Briefcase className="w-4 h-4 text-red-500" />
                                            <span className="text-sm">{member.department} Dept</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Mail className="w-4 h-4 text-red-500" />
                                            <span className="text-sm">{member.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Phone className="w-4 h-4 text-red-500" />
                                            <span className="text-sm">{member.phone || '+63 XXX XXX XXXX'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <MapPin className="w-4 h-4 text-red-500" />
                                            <span className="text-sm">Manila, Philippines</span>
                                        </div>
                                    </div>

                                    {/* Expertise section */}
                                    {member.expertise && (
                                        <div className="mb-6">
                                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                <Award className="w-4 h-4 text-red-500" />
                                                Areas of Expertise
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {member.expertise.map((skill, i) => (
                                                    <span 
                                                        key={i}
                                                        className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm border border-red-100"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Contact buttons */}
                                    <div className="flex gap-3">
                                        <a
                                            href={`mailto:${member.email}`}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-300"
                                        >
                                            <Mail className="w-4 h-4" />
                                            Email
                                        </a>
                                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-600 text-red-600 rounded-xl hover:bg-red-50 transition-colors duration-300">
                                            <MessageCircle className="w-4 h-4" />
                                            Message
                                        </button>
                                    </div>

                                    {/* Social links */}
                                    <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                                        <button className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors">
                                            <Linkedin className="w-4 h-4" />
                                            <span className="text-sm">LinkedIn</span>
                                        </button>
                                        <button className="flex items-center gap-1 text-gray-600 hover:text-sky-500 transition-colors">
                                            <Twitter className="w-4 h-4" />
                                            <span className="text-sm">Twitter</span>
                                        </button>
                                        <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors">
                                            <ExternalLink className="w-4 h-4" />
                                            <span className="text-sm">Portfolio</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

const Staff: React.FC = () => {
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Get unique departments for filter
    const departments = ['all', ...new Set(staffMembers.map(m => m.department))];

    // Filter staff members
    const filteredStaff = staffMembers.filter(member => {
        const matchesDepartment = filter === 'all' || member.department === filter;
        const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             member.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             member.bio.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesDepartment && matchesSearch;
    });

    return (
        <div className="w-full py-16 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header with animation */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Meet Our <span className="text-red-600 relative inline-block">Leadership Team
                            <motion.span
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                            />
                        </span>
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Dedicated professionals committed to driving positive change and excellence in everything we do.
                    </p>
                </motion.div>

                {/* Stats bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
                >
                    {[
                        { icon: Users, label: 'Team Members', value: staffMembers.length },
                        { icon: Briefcase, label: 'Years Combined', value: '100+' },
                        { icon: Award, label: 'Awards Won', value: '25+' },
                        { icon: Heart, label: 'Communities Served', value: '50+' },
                    ].map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-100 p-2 rounded-lg">
                                    <stat.icon className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                                    <div className="text-xs text-gray-500">{stat.label}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Search and filter bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col md:flex-row gap-4 mb-10"
                >
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search team members..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 transition-all duration-300"
                        />
                        <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        {departments.map((dept) => (
                            <button
                                key={dept}
                                onClick={() => setFilter(dept)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                                    filter === dept
                                        ? 'bg-red-600 text-white shadow-lg'
                                        : 'bg-white text-gray-600 hover:bg-red-50 border border-gray-200'
                                }`}
                            >
                                {dept.charAt(0).toUpperCase() + dept.slice(1)}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Staff Grid */}
                {filteredStaff.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredStaff.map((member, index) => (
                            <StaffCard key={member.id} member={member} index={index} />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No team members found</h3>
                        <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                    </motion.div>
                )}

                {/* Join our team CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-16 text-center bg-gradient-to-r from-red-600 to-red-700 rounded-3xl p-8 shadow-2xl"
                >
                    <h3 className="text-2xl font-bold text-white mb-2">Join Our Team</h3>
                    <p className="text-red-100 mb-6">Be part of something bigger. Help us make a difference.</p>
                    <button className="px-8 py-3 bg-white text-red-600 rounded-full font-semibold hover:bg-red-50 transition-all duration-300 shadow-lg hover:shadow-xl">
                        View Open Positions
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default Staff;