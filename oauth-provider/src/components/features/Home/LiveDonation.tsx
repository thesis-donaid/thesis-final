"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Heart, Clock, Users, ChevronRight } from "lucide-react";
import PusherClient from "pusher-js";

interface Donation {
  id: string;
  donorName: string;
  amount: number;
  currency: string;
  message: string | null;
  paidAt: string;
  isAnonymous: boolean;
}

export default function RecentDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await fetch('/api/donation/recent');
      if (!response.ok) {
        throw new Error('Failed to fetch donations');
      }

      const data = await response.json();
      setDonations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Initialize Pusher Client
    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe("public-donations");
    
    channel.bind("new-donation", (newDonation: Donation) => {
      setDonations((prev) => {
        // Prevent duplicate entries
        if (prev.some(d => d.id === newDonation.id)) return prev;
        
        // Add new donation and keep latest
        const updated = [newDonation, ...prev];
        return updated.slice(0, 6); 
      });
    });

    return () => {
      pusher.unsubscribe("public-donations");
      pusher.disconnect();
    };
  }, [fetchDashboardData]);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-gradient-to-b from-white to-red-50 py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-10">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-red-200 rounded-full" />
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-white to-red-50 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 md:px-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-3 text-red-600 text-sm font-semibold tracking-widest uppercase">
            <span className="w-8 h-px bg-red-600/30" />
            Recent Supporters
            <span className="w-8 h-px bg-red-600/30" />
          </span>
          
          <h2 className="mt-6 text-4xl md:text-5xl font-bold text-gray-900">
            Latest <span className="text-red-600">Donations</span>
          </h2>
          
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Every gift makes a difference. Here are some of our recent supporters who are helping transform lives.
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-6 py-3 rounded-2xl text-sm">
              <Heart className="w-4 h-4" />
              Unable to load donations. Please try again later.
            </div>
          </div>
        )}

        {/* Empty state */}
        {!error && donations.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex bg-red-50 rounded-full p-5 mb-5">
              <Heart className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Be the First to Give</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">
              No donations yet — but every great movement starts with one generous heart.
            </p>
            <a
              href="/donation"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-7 py-3 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 shadow-md"
            >
              <Heart className="w-4 h-4 fill-white" />
              Make the First Donation
            </a>
          </div>
        )}

        {/* Donations Grid */}
        {!error && donations.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {donations.map((donation) => (
                <div
                  key={donation.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="p-6">
                    {/* Donor Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-red-100 to-red-50 p-3 rounded-full">
                          <Users className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {donation.donorName}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(donation.paidAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Amount Badge */}
                      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl font-bold shadow-md">
                        {formatAmount(donation.amount, donation.currency)}
                      </div>
                    </div>

                    {/* Message */}
                    {donation.message && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-sm text-gray-600 italic leading-relaxed">
                          &quot;{donation.message}&quot;
                        </p>
                      </div>
                    )}

                    {/* Impact Tag */}
                    <div className="mt-4 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                      <span className="text-xs text-gray-500">
                        Making a difference in Payatas
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Link */}
            <div className="text-center mt-12">
              <a
                href="/donations"
                className="inline-flex items-center gap-2 text-red-600 font-semibold group"
              >
                <span>View all donations</span>
                <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </div>
          </>
        )}

      </div>
    </div>
  );
}