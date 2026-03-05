'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { AboutPage } from '@/lib/localdb';

const History = () => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    // Get data from AboutPage
    const aboutData = AboutPage();
    const companyImages = aboutData.image.map(img => img.image);
    const paragraphs = aboutData.paragraph;

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % companyImages.length);
        }, 3000); // Change image every 3 seconds

        return () => clearInterval(interval);
    }, [companyImages.length]);

    // Fallback images in case Google Drive images fail to load
    const fallbackImages = [
        '/images/placeholder1.jpg',
        '/images/placeholder2.jpg',
        '/images/placeholder3.jpg',
        '/images/placeholder4.jpg',
        '/images/placeholder5.jpg',
        '/images/placeholder6.jpg',
        '/images/placeholder7.jpg',
    ];

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16 border border-red-100">
            <h2 className="text-3xl font-bold text-red-800 mb-6 text-center">Our History</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                    {/* Display paragraphs dynamically */}
                    {paragraphs.map((para, index) => (
                        <p key={index} className="text-gray-700 mb-4">
                            {para.description}
                        </p>
                    ))}
                </div>
                
                {/* Continuous Auto-changing Carousel */}
                <div className="relative h-96 rounded-xl overflow-hidden">
                    {/* Main Image with smooth transition */}
                    <div className="relative w-full h-full">
                        {companyImages.length > 0 && (
                            <Image
                                src={companyImages[currentImageIndex]}
                                alt={`Company history image ${currentImageIndex + 1}`}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover transition-opacity duration-1000"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = fallbackImages[currentImageIndex % fallbackImages.length];
                                }}
                            />
                        )}
                        
                        {/* Semi-transparent overlay with stats */}
                        <div className="absolute inset-0 bg-black/30 bg-opacity-30 flex items-center justify-center">
                            <div className="text-center text-white">
                                <div className="text-6xl font-bold mb-2">10+</div>
                                <div className="text-xl font-semibold mb-1">Years of Excellence</div>
                                <div className="text-red-200">Serving clients since 2010</div>
                            </div>
                        </div>
                    </div>

                    {/* Progress indicator at the bottom */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                        {companyImages.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1 rounded-full transition-all duration-300 ${
                                    index === currentImageIndex 
                                        ? 'bg-red-600 w-8' 
                                        : 'bg-white bg-opacity-50 w-4'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default History;

// Note: You'll need to implement SetImageGoogleById function or import it
// This function should return the actual image URL from Google Drive