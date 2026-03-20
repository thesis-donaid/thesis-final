import { Metadata } from "next";
import { ShieldX } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Unauthorized",
};

export default function unauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center max-w-md w-full">
        <ShieldX className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 text-center mb-6">
          You do not have permission to view this page.
          <br />Please log in or return to the homepage.
        </p>
        <Link href="/" className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md">
          Go to Home
        </Link>
      </div>
    </div>
  );
}