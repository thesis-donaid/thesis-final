"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FailedContent() {
  const searchParams = useSearchParams();
  const referenceCode = searchParams.get("ref");

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Payment Cancelled
        </h1>
        
        <p className="text-gray-600 mb-4">
          Your donation was not completed. No charges were made.
        </p>
        
        {referenceCode && (
          <div className="bg-gray-100 p-3 rounded-md mb-4">
            <p className="text-sm text-gray-500">Reference Code</p>
            <p className="font-mono font-bold text-gray-800">{referenceCode}</p>
          </div>
        )}
        
        <p className="text-sm text-gray-500 mb-6">
          If you experienced any issues, please try again or contact support.
        </p>
        
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-block bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition"
          >
            Return Home
          </Link>
          <a
            href="/donate"
            className="inline-block bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition"
          >
            Try Again
          </a>
        </div>
      </div>
    </div>
  );
}

export default function DonationFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <FailedContent />
    </Suspense>
  );
}
