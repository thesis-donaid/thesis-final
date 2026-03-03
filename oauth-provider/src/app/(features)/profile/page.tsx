"use client";

import { authOptions } from "@/lib/auth";
import { SessionData } from "@/types/session";
import { getServerSession } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";


export default function ProfilePage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    // const [sessionData, setSessionData] = useState<SessionData | null>(null);
    // const [checkingSession, setCheckingSession] = useState(true);


    // Check session from our custom API (works for both NextAuth and beneficiary login)
    // useEffect(() => {
    //     fetch("/api/auth/session-check")
    //         .then(res => res.json())
    //         .then((data: SessionData) => {
    //             setSessionData(data);
    //             setCheckingSession(false);
    //         })
    //         .catch(err => {
    //             console.error(err);
    //             setCheckingSession(false);
    //         });
    // }, []);

    const { data: session, status } = useSession();




        



    const handleBeneficiaryLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/beneficiary/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Login failed");
                return;
            }

            // Reload the page to check the new session
            window.location.href = "/profile";
        } catch {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        // Clear session cookie via API
        await fetch("/api/auth/logout", { method: "POST" });
        // Also sign out from NextAuth if needed
        signOut({ callbackUrl: "/" });
    };


    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
                <div className="w-full max-w-md p-8 border rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold mb-6 text-center">Beneficiary Login</h1>
                    
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleBeneficiaryLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t text-center">
                        <p className="text-gray-600 text-sm mb-3">Not a beneficiary?</p>
                        <button
                            onClick={() => router.push("/auth/signin")}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            Sign In with Other Methods
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const user = session?.user;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <div className="w-full max-w-md p-8 border rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold mb-6 text-center">Profile</h1>

            <div className="flex flex-col items-center mb-6">
                {user?.image && (
                <Image
                    src={user.image}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full mb-4"
                />
                )}
                <h2 className="text-xl font-semibold">{user?.name || user?.beneficiary?.firstName || "User"}</h2>
                <p className="text-gray-600">{user?.email || user?.beneficiary?.username}</p>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg mb-6 text-black">
                <h3 className="font-semibold mb-2">Session Data:</h3>
                <pre className="text-xs overflow-auto max-h-48">
                {JSON.stringify(session, null, 2)}
                </pre>
            </div>

            <div className="space-y-2 text-sm">
                <p><strong>User ID:</strong> {user?.id || "N/A"}</p>
                <p><strong>Role:</strong> {user?.role || "N/A"}</p>
                {user?.beneficiary && (
                    <>
                        <p><strong>Username:</strong> {user.beneficiary.username}</p>
                        <p><strong>Type:</strong> {user.beneficiary.type}</p>
                    </>
                )}
            </div>

            <button
                onClick={handleSignOut}
                className="w-full mt-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
                Sign Out
            </button>
            </div>
        </div>
    );

}
