'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const CompanyHistory = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Sample images - replace these with your actual company images
  const companyImages = [
    '/company-images/office1.jpg',
    '/company-images/team1.jpg',
    '/company-images/event1.jpg',
    '/company-images/office2.jpg',
    '/company-images/team2.jpg',
  ];

  // Fallback images from Unsplash
  const fallbackImages = [
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&h=400&fit=crop',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % companyImages.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [companyImages.length]);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-16 border border-red-100">
      <h2 className="text-3xl font-bold text-red-800 mb-6 text-center">Our History</h2>
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-gray-700 mb-4">
            Founded in 2010 by John Smith, our company began as a small startup with a big vision: to revolutionize the industry through innovative solutions and exceptional service. What started as a team of three passionate individuals working from a garage has grown into a industry-leading organization with over 200 employees.
          </p>
          <p className="text-gray-700 mb-4">
            Our journey has been marked by significant milestones. In 2014, we launched our flagship product that quickly gained market recognition. By 2018, we had expanded to international markets, establishing offices in three countries. The COVID-19 pandemic in 2020 challenged us to adapt quickly, leading to the development of our remote collaboration tools that have since become industry standards.
          </p>
          <p className="text-gray-700">
            Today, we continue to build on our legacy of innovation while staying true to our core values of integrity, excellence, and customer focus. Our story is still being written, with each chapter focused on creating a better future for our clients, employees, and communities.
          </p>
        </div>
        
        {/* Continuous Auto-changing Carousel */}
        <div className="relative h-96 rounded-xl overflow-hidden">
          {/* Main Image with smooth transition */}
          <div className="relative w-full h-full">
            <Image
              src={companyImages[currentImageIndex]}
              alt={`Company history image ${currentImageIndex + 1}`}
              fill
              className="object-cover transition-opacity duration-1000"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = fallbackImages[currentImageIndex];
              }}
            />
            
            {/* Semi-transparent overlay with stats */}
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
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

export default CompanyHistory;