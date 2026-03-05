// components/Home/Graduates/FeaturedGraduates.tsx
"use client"

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link'
import { ArrowRight, Award } from 'lucide-react';
import { 
  AcademicCapIcon, 
  BookOpenIcon, 
  CalendarIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon 
} from '@heroicons/react/24/outline';
import { Graduate } from '@/types/localdb';

interface FeaturedGraduatesProps {
  graduates: Graduate[];
}

export default function FeaturedGraduates({ graduates }: FeaturedGraduatesProps) {
  const scrollContainer = useRef<HTMLDivElement>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const featuredGraduates = graduates.slice(0, 6); // Show first 6 graduates

  // Check if we're in mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobileView();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobileView);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  const scrollLeft = () => {
    if (scrollContainer.current) {
      scrollContainer.current.scrollBy({ 
        left: -scrollContainer.current.offsetWidth * 0.8, 
        behavior: 'smooth' 
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainer.current) {
      scrollContainer.current.scrollBy({ 
        left: scrollContainer.current.offsetWidth * 0.8, 
        behavior: 'smooth' 
      });
    }
  };

  return (
    <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
           
            {/* Header Section */}
            <div className="text-center max-w-4xl mx-auto mb-16">
                <div className="inline-flex items-center bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium mb-4 animate-fadeInUp">
                    <Award className="w-4 h-4 mr-2" />
                    Our Success Stories
                </div>
            
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight animate-fadeInUp" style={{animationDelay: '0.1s'}}>
                    Congratulations to Our 
                    <span className="text-red-600 block md:inline md:ml-3">
                    Graduates
                    </span>
                </h2>
            
                <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-red-600 mx-auto mb-8 rounded-full animate-fadeInUp" style={{animationDelay: '0.2s'}}></div>
                
                <p className="text-lg text-gray-600 leading-relaxed animate-fadeInUp" style={{animationDelay: '0.3s'}}>
                    Hear from our graduates whose lives have been eternally transformed by the gift of education, 
                    made possible through the PNA Foundation. These students are hardworking, resilient, and deeply 
                    committed to their future, grateful for the opportunities they&apos;ve been given.
                </p>
            </div>
       
        </div>
    
        <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-12">Featured Graduates</h2>
            
            <div className="relative">
            {/* Navigation Buttons - Only show in mobile view */}
            {isMobileView && (
                <>
                <button 
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                    onClick={scrollLeft}
                >
                    <ChevronLeftIcon className="h-6 w-6 text-gray-700" />
                </button>
                
                <button 
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                    onClick={scrollRight}
                >
                    <ChevronRightIcon className="h-6 w-6 text-gray-700" />
                </button>
                </>
            )}

            {/* Scrollable Container */}
            <div 
                ref={scrollContainer}
                className="flex overflow-x-auto pb-6 md:pb-8 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:gap-8 md:overflow-x-visible"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {/* Hide scrollbar for Webkit browsers */}
                <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-default::-webkit-scrollbar {
                    display: block;
                    height: 8px;
                }
                .scrollbar-default::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .scrollbar-default::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 10px;
                }
                .scrollbar-default::-webkit-scrollbar-thumb:hover {
                    background: #a8a8a8;
                }
                `}</style>

                {featuredGraduates.map((graduate) => (
                <div 
                    key={graduate.id} 
                    className="flex-shrink-0 w-80 md:w-auto snap-start md:snap-none mx-4 md:mx-0 first:ml-6 md:first:ml-0 last:mr-6 md:last:mr-0 group bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                    <div className="relative h-80 overflow-hidden">
                    <Image
                        src={graduate.image || '/default-avatar.png'}
                        alt={graduate.name}
                        fill
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                        <div>
                        <h3 className="text-white text-xl font-semibold">{graduate.name}</h3>
                        <p className="text-red-200">{graduate.school}</p>
                        </div>
                    </div>
                    
                    {/* Story Overlay - Appears on Hover */}
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6 cursor-pointer">
                        <div className="text-white text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <BookOpenIcon className="h-8 w-8 mx-auto mb-3 text-red-400" />
                            <h4 className="font-semibold mb-2">Success Story</h4>
                            <p className="text-sm line-clamp-5 ">
                                {graduate.story || `After completing ${graduate.degree.toLowerCase()}, ${graduate.name.split(' ')[0]} has made significant contributions to the field of ${graduate.school}.`}
                            </p>
                            <button className="mt-3 text-red-300 text-xs font-medium hover:text-red-100 transition-colors">
                                Read Full Story →
                            </button>
                        </div>
                    </div>
                    </div>
                    
                    <div className="p-6">
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                        <AcademicCapIcon className="h-4 w-4 mr-1" />
                        <span>{graduate.degree}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>Class of {graduate.graduationYear}</span>
                    </div>
                    {graduate.achievements && graduate.achievements.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                        {graduate.achievements.map((achievement, index) => (
                            <span 
                            key={index} 
                            className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full"
                            >
                            {achievement}
                            </span>
                        ))}
                        </div>
                    )}
                    </div>
                </div>
                ))}
            </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-5 space-y-4">
            <p className='text-red-600 text-xs md:text-md'>
                Read their stories, be inspired by their journeys, and consider becoming a sponsor to help shape the future for more deserving students. Together, we can continue to make a lasting difference.
            </p>
            <Link 
              href="/graduates" 
              className="inline-flex items-center px-8 py-3 bg-red-600 text-white font-medium rounded-lg transition-colors duration-300 hover:bg-red-700 shadow-md hover:shadow-lg"
            >
              View All Graduates
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
        </div>
        
      </div>
      
    </section>
  );
}