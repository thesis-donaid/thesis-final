"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const referenceCode = searchParams.get("ref");

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Thank You for Your Donation!
        </h1>
        
        <p className="text-gray-600 mb-4">
          Your payment has been processed successfully.
        </p>
        
        {referenceCode && (
          <div className="bg-gray-100 p-3 rounded-md mb-4">
            <p className="text-sm text-gray-500">Reference Code</p>
            <p className="font-mono font-bold text-gray-800">{referenceCode}</p>
          </div>
        )}
        
        <p className="text-sm text-gray-500 mb-6">
          A confirmation email will be sent to you shortly.
        </p>
        
        <Link
          href="/"
          className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

export default function DonationSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
