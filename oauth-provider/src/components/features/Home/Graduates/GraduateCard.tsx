
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { BookOpenIcon } from 'lucide-react';
import { Graduate } from '@/types/localdb';

interface GraduateCardProps {
  graduate: Graduate;
}



const GraduateCard: React.FC<GraduateCardProps> = ({ graduate }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [achievementsVisible, setAchievementsVisible] = useState(false);

  useEffect(() => {
    //Small delay to stagger animations
    const timer = setTimeout(() => {
        setAchievementsVisible(true);
    }, 100);
  })

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md transition-all duration-500 hover:shadow-xl hover:-translate-y-2 flex flex-col w-full group">
        {/* Header with gradient background */}
        <div className="h-40 w-30 md:h-70 md:w-60 bg-gradient-to-r from-red-600 to-red-500 text-white p-4 flex flex-col items-center relative">
            
            {/* Shimmer effect while image loads */}
            {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-200 animate-pulse" />
            )}
            
            {/* Image container with proper aspect ratio */}

            
            <Image
            src={graduate.image || '/default-avatar.png'}
            alt={graduate.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-opacity duration-500"
            style={{ opacity: imageLoaded ? 1 : 0 }}
            onLoad={() => setImageLoaded(true)}
            priority={false}
            />

            
            <div className='absolute bottom-2 left-2 z-50 flex flex-col items-start'>

                <h3 className="text-xs md:text-lg text-white font-semibold text-center mb-1 line-clamp-1 transition-all duration-500 group-hover:text-shadow-md">
                {graduate.name}
                </h3>
                <p className="text-[10px] md:text-xs opacity-90 text-center mb-1 line-clamp-1">{graduate.degree}</p>
                <p className="text-[10px] md:text-xs font-medium text-center line-clamp-1">{graduate.school}</p>


            </div>

        </div>

        {/* Story Overlay - Appears on Hover */}
        <div className='absolute z-100 inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6 cursor-pointer'>
            <div className='text-white text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300'>

                <BookOpenIcon className='h-8 w-8 mx-auto mb-3 text-red-400'/>
                <h4 className='font-semibold mb-2'>Success Story</h4>
                <p className='text-xs line-clamp-5'>
                    {graduate.story || `After completing ${graduate.degree.toLowerCase()}, ${graduate.name.split(' ')[0]} has made significant contributions to the field of ${graduate.school}.`}
                </p>
                <button className='mt-3 text-red-300 text-xs font-medium hover:text-red-100 transition-colors'>
                    Read Full Story →
                </button>
            </div>
        </div>
      
      
      {/* Add these styles for the animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease forwards;
          opacity: 0;
        }
        .group:hover .animate-fadeIn {
          animation: fadeIn 0.5s ease forwards;
        }
      `}</style>
    </div>
  );
};

export default GraduateCard;