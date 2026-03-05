"use client"

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link'
import { ArrowRight, Award } from 'lucide-react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon 
} from '@heroicons/react/24/outline';
import { Graduate } from '@/types/localdb';
import GraduateCard from './Graduates/GraduateCard';


interface FeaturedGraduatesProps {
    graduates: Graduate[];
}


export default function Featured({ graduates }: FeaturedGraduatesProps) {
    const scrollContainer = useRef<HTMLDivElement>(null);
    const [isMobileView, setIsMobileView] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const transitionTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobileView(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const goToPrevious = () => {
        if(isTransitioning) return;

        setIsTransitioning(true);
        setCurrentIndex((prevIndex) => prevIndex === 0 ? graduates.length - 1 : prevIndex - 1)

        transitionTimer.current = setTimeout(() => {
            setIsTransitioning(false)
        }, 700)
    }

    const goToNext = () => {
        if(isTransitioning) return;

        setIsTransitioning(true);
        setCurrentIndex((prevIndex) => prevIndex >= graduates.length - 1  ? 0 : prevIndex + 1)

        transitionTimer.current = setTimeout(() => {
            setIsTransitioning(false);
        }, 700)
    }


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if(e.key === 'ArrowLeft' &&  !isMobileView){
                goToPrevious();
            } else if (e.key === 'ArrowRight' && !isMobileView){
                goToNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isMobileView])


    return(
        <section className='py-16 bg-gray-50'>
            <div className='container mx-auto px-4'>

                {/* Header Section */}
                <div className='text-center max-w-4xl mx-auto mb-16'>

                    <div className='inline-flex items-center bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm'>
                        <Award className='w-4 h-4 mr-2'/>
                        Our Success Stories
                    </div>

                    <h2 className='text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight animate-fadeInUp' style={{animationDelay: '0.1s'}}>
                        Congratulations to Our
                        <span className='text-red-600 block md:inline md:ml-3'>Graduates</span>
                    </h2>

                    <div className='w-24 h-1 bg-gradient-to-r from-red-500 to-red-600 mx-auto mb-8 rounded-full animate-fadeInUp' style={{animationDelay: '0.2s'}}>
                    </div>

                    <p className='text-xs md:text-lg text-gray-600 leading-relaxed animate-fadeInUp' style={{animationDelay: '0.3s'}}>
                        Hear from our graduates whose lives have been eternally transformed by the gift of education, 
                        made possible through the PNA Foundation. These students are hardworking, resilient, and deeply 
                        committed to their future, grateful for the opportunities they&apos;ve been given.
                    </p>
                </div>
            </div>

            <div className='container mx-auto px-4 py-8'>
                <h2 className='text-2xl md:text-3xl font-bold text-center text-gray-800 mb-12'>
                    Featured Graduates
                </h2>

                {/* Desktop Carousel (3 iotems with focus effect) */}
                {!isMobileView && (
                    <div className='hidden md:flex items-center justify-center space-x-8'>
                        <button
                            onClick={goToPrevious}
                            disabled={isTransitioning}
                            className='p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-all duration-300 z-10 disabled:opacity-50 disabled:cursor-not-allowed'
                            aria-label='Previous graduates'
                        >
                            <ChevronLeftIcon className='h-6 w-6 text-gray-700'/>
                        </button>

                        <div className='flex items-center justify-center space-x-6 relative w-full max-w-5xl h-110 overflow-hidden'>
                            {graduates.map((graduate, index) => {
                                
                                const position = (index - currentIndex);
                                const isCenter = position === 0;
                                const isLeft = position === 1;
                                const isRight = position === 2;
                                const isVisible = position >= 0 && position <= 2;

                                return (
                                    <div
                                        key={graduate.id}
                                        className={`absolute transition-all duration-700 ease-in-out ${
                                            isCenter
                                                ? 'scale-150 z-20 filter-none'
                                                : (isLeft || isRight)
                                                    ? 'scale-80 z-10 filter blur-sm opacity-80'
                                                    : 'opacity-0 scale-75'
                                        }`}
                                        style={{
                                            width: isCenter ? '' : '',
                                            left: isCenter
                                                ? '50%'
                                                : isRight
                                                    ? 'calc(50% - 300px)'
                                                    : isLeft
                                                        ? 'calc(50% + 240px)'
                                                        : '50%',
                                            transform: isCenter
                                                ? 'translateX(-35%)'
                                                : isRight
                                                    ? 'translateX(-50%)'
                                                    : isLeft
                                                        ? 'translateX(-50%)'
                                                        : 'translateX(-50%)',
                                            transitionProperty: 'transform, opacity, filter, left, scale',
                                            transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                                        }}
                                    >
                                        <GraduateCard graduate={graduate}/>
                                    </div>
                                );
                            })

                            }

                            
                        </div>
        
                        <button 
                            onClick={goToNext}
                            disabled={isTransitioning}
                            className='p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-all duration-300 z-10 disabled:opacity-50 disabled:cursor-not-allowed'
                            aria-label='Next graduates'
                        >
                            <ChevronRightIcon className='h-6 w-6 text-gray-700'/>
                        </button>
                    </div>
                )}


                {isMobileView && (
                    <div className='relative md:hidden'>
                        <button 
                            className='absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-2'
                        >
                            <ChevronLeftIcon className='h-6 w-6 text-gray-700'/>
                        </button>

                        <button
                            className='absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-2'
                        >
                            <ChevronRightIcon className='h-6 w-6 text-gray-700'/>
                        </button>

                        <div
                            ref={scrollContainer}
                            className='flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth'
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                        >
                            {graduates.map((graduate) => (
                                <div
                                    key={graduate.id}
                                    className='snap-start mx-4 first:ml-6 last:mr-6 transition-transform duration-300 hover:scale-105'
                                >
                                    <GraduateCard graduate={graduate}/>     
                                </div>
                            ))}
                        </div>
                    </div>
                )

                }


                {!isMobileView && graduates.length > 3 && (
                    <div className='hidden md:flex justify-center mt-6 space-x-2'>
                        {Array.from({ length: graduates.length - 2}).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    if(!isTransitioning){
                                        setIsTransitioning(true)
                                        setCurrentIndex(index)
                                        transitionTimer.current = setTimeout(() => {
                                            setIsTransitioning(false)
                                        }, 700)
                                    }
                                }}
                                className=''
                            />
                        ))}

                    </div>
                )}


                <div className='text-center space-y-4'>
                    <p className='text-red-600 text-xs md:text-base'>
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
    )

}

