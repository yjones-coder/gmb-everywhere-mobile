"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { trpc } from "../../lib/trpc";

export default function SettingsPage() {
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
                            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
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
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <p className="mt-1 text-sm text-gray-900">{user.name || "Not provided"}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <p className="mt-1 text-sm text-gray-900">{user.email || "Not provided"}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Login Method</label>
                                <p className="mt-1 text-sm text-gray-900">{user.loginMethod || "Google"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}