"use client"

import { Graduate, GraduateListProps } from '@/types/localdb';
import GraduateCard from './GraduateCard';
import { useState } from 'react';

const GraduateList: React.FC<GraduateListProps> = ({ graduates }) => {
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredGraduates = graduates.filter((graduate: Graduate) => {
    // Filter by degree type
    const degreeMatch = filter === 'all' || 
      graduate.degree.toLowerCase().includes(filter.toLowerCase());
    
    // Filter by search query
    const searchMatch = searchQuery === '' || 
      graduate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      graduate.school.toLowerCase().includes(searchQuery.toLowerCase())
    
    return degreeMatch && searchMatch;
  });

  return (
    <section className="py-8">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Our Graduates</h2>
      
      <div className="flex justify-center mb-8">
        <input
          type="text"
          placeholder="Search graduates by name, major, or research area..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded w-full max-w-md focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      
      <div className="flex justify-center gap-4 mb-8 flex-wrap">
        <button 
          className={`px-4 py-2 rounded transition-colors ${
            filter === 'all' 
              ? 'bg-red-600 text-white' 
              : 'bg-white text-red-600 border border-red-600 hover:bg-red-50'
          }`}
          onClick={() => setFilter('all')}
        >
          All Graduates
        </button>
        <button 
          className={`px-4 py-2 rounded transition-colors ${
            filter === 'master' 
              ? 'bg-red-600 text-white' 
              : 'bg-white text-red-600 border border-red-600 hover:bg-red-50'
          }`}
          onClick={() => setFilter('master')}
        >
          Master&apos;s
        </button>
        <button 
          className={`px-4 py-2 rounded transition-colors ${
            filter === 'phd' 
              ? 'bg-red-600 text-white' 
              : 'bg-white text-red-600 border border-red-600 hover:bg-red-50'
          }`}
          onClick={() => setFilter('phd')}
        >
          PhD
        </button>
        <button 
          className={`px-4 py-2 rounded transition-colors ${
            filter === 'bachelor' 
              ? 'bg-red-600 text-white' 
              : 'bg-white text-red-600 border border-red-600 hover:bg-red-50'
          }`}
          onClick={() => setFilter('bachelor')}
        >
          Bachelor&apos;s
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGraduates.map((graduate) => (
          <GraduateCard key={graduate.id} graduate={graduate} />
        ))}
      </div>
      
      {filteredGraduates.length === 0 && (
        <p className="text-center mt-8 text-gray-500">
          No graduates found matching your criteria.
        </p>
      )}
    </section>
  );
};

export default GraduateList;