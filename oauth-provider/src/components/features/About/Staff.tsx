'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { StaffMember } from '@/types/localdb';
import { staffMembers } from '@/lib/localdb';



const StaffCard: React.FC<{ member: StaffMember }> = ({ member }) => {
  const [imageError, setImageError] = useState(false);
  
  // Function to extract initials from name
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };



  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col border border-red-100">
      <div className="relative h-48 w-full bg-gradient-to-br from-red-100 to-red-200">
        {!imageError ? (
          <Image
            src={member.image}
            alt={member.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-red-500 to-red-600">
            <div className="text-4xl font-bold text-white bg-white bg-opacity-20 rounded-full w-24 h-24 flex items-center justify-center shadow-md">
              {getInitials(member.name)}
            </div>
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold text-red-800 mb-1">{member.name}</h3>
        <p className="text-red-600 font-medium mb-1">{member.position}</p>
        <p className="text-gray-600 text-sm mb-3">{member.department} Department</p>
        <p className="text-gray-700 mb-4 flex-grow">{member.bio}</p>
        <div className="flex justify-between items-center">
          <a
            href={`mailto:${member.email}`}
            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Contact
          </a>
          <div className="flex space-x-2">
            <button className="text-gray-400 hover:text-red-600 transition-colors" aria-label="Twitter">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
              </svg>
            </button>
            <button className="text-gray-400 hover:text-red-600 transition-colors" aria-label="LinkedIn">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Staff: React.FC = () => {
  return (
    <div className="w-full py-12">
      {/* Staff Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-red-800 mb-4">Meet Our Leadership Team</h2>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Our talented leaders bring decades of experience and a shared commitment to excellence.
        </p>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {staffMembers.map((member) => (
          <StaffCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
};

export default Staff;