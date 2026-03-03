import React from 'react';
import { LayoutDashboard, FileText } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50/50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
        
        {/* Header Section Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="h-10 w-64 bg-gray-200 rounded-2xl"></div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
              <div className="h-4 w-48 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
          <div className="h-14 w-40 bg-gray-200 rounded-2xl shadow-sm"></div>
        </div>

        {/* Dashboard Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column Skeleton */}
          <div className="lg:col-span-1 space-y-8">
            {/* Profile Card Skeleton */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
              <div className="w-20 h-20 bg-gray-200 rounded-2xl"></div>
              <div className="space-y-3">
                <div className="h-6 w-32 bg-gray-200 rounded-lg"></div>
                <div className="h-4 w-48 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="pt-8 border-t border-gray-100 flex items-center justify-between">
                <div className="h-3 w-12 bg-gray-100 rounded-lg"></div>
                <div className="h-6 w-20 bg-gray-100 rounded-full"></div>
              </div>
            </div>

            {/* Total Spending Card Skeleton */}
            <div className="bg-gray-200 rounded-3xl p-8 h-64 shadow-sm relative overflow-hidden">
               <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 bg-gray-300 rounded-2xl"></div>
                  <div className="w-20 h-6 bg-gray-300 rounded-full"></div>
               </div>
               <div className="space-y-4">
                  <div className="h-4 w-32 bg-gray-300 rounded-lg"></div>
                  <div className="h-10 w-48 bg-gray-300 rounded-lg"></div>
               </div>
               <div className="absolute bottom-4 left-8 right-8 h-10 bg-gray-300 rounded-2xl"></div>
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="lg:col-span-2 space-y-8">
            {/* Summary Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl"></div>
                  <div className="space-y-2">
                    <div className="h-6 w-8 bg-gray-200 rounded-lg"></div>
                    <div className="h-3 w-16 bg-gray-100 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Requests Section Skeleton */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-8">
              <div className="flex items-center justify-between">
                <div className="h-7 w-40 bg-gray-200 rounded-lg"></div>
                <div className="h-4 w-16 bg-gray-100 rounded-lg"></div>
              </div>

              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-5 rounded-2xl border border-gray-50 gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl"></div>
                      <div className="space-y-2">
                        <div className="h-5 w-48 bg-gray-200 rounded-lg"></div>
                        <div className="h-3 w-32 bg-gray-100 rounded-lg"></div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-6">
                      <div className="space-y-2 text-right">
                        <div className="h-5 w-16 bg-gray-200 rounded-lg ml-auto"></div>
                        <div className="h-3 w-12 bg-gray-100 rounded-lg ml-auto"></div>
                      </div>
                      <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
