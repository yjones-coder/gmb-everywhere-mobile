"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { trpc } from "../../lib/trpc";

export default function CreditsPage() {
    const router = useRouter();
    const { data: user, isLoading } = trpc.auth.me.useQuery();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login");
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">Credits Management</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <a href="/" className="text-blue-600 hover:text-blue-500">Back to Dashboard</a>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Credits</h2>
                        <p className="text-gray-600">Credits management functionality coming soon...</p>
                    </div>
                </div>
            </main>
        </div>
    );
}