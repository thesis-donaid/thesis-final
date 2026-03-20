"use client";

import { Heart } from "lucide-react";

export default function DashboardFooter() {
  return (
    <footer className="w-full py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-100 bg-white/50 backdrop-blur-sm mt-12">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
          <p className="text-gray-400 text-[11px] text-center sm:text-left">
            © {new Date().getFullYear()} Puso ng Ama Foundation Inc.
          </p>
          <div className="h-3 w-px bg-gray-200 hidden sm:block" />
          <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">
            Powered By DonAid
          </p>
        </div>
        <div className="flex items-center gap-1.5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
          <p className="text-gray-400 text-[11px]">
            Made with <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" /> for the community
          </p>
        </div>
      </div>
    </footer>
  );
}
