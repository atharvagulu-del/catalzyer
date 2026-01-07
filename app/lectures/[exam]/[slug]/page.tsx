"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { lectureData } from "@/lib/lectureData";
import { notFound } from "next/navigation";
import UnitCard from "@/components/lectures/UnitCard";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface PageProps {
    params: {
        exam: string;
        slug: string;
    };
}

export default function SubjectPage({ params }: PageProps) {
    // Key construction matching lectureData keys
    const key = `${params.exam}-${params.slug}`.toLowerCase();

    // Simple lookup (handle potential key mismatches roughly)
    const subjectData = lectureData[key] ||
        lectureData[`${params.exam}-${params.slug.replace('mathematics', 'maths')}`];

    if (!subjectData) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Coming Soon</h1>
                    <p className="text-gray-600 mb-6 max-w-md">
                        We are currently adding specialized courses for this subject. Please check back later!
                    </p>
                    <Link href="/lectures" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                        Browse Other Courses
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            <div className="border-b bg-white sticky top-16 z-40 shadow-sm">
                <div className="container px-4 md:px-6 py-4 flex items-center text-sm text-gray-600">
                    <Link href="/lectures" className="hover:text-primary">Courses</Link>
                    <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
                    <span className="font-semibold text-gray-900 capitalize">{params.exam.toUpperCase()}</span>
                    <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
                    <span className="font-semibold text-gray-900">{subjectData.title}</span>
                </div>
            </div>

            <main className="flex-grow container px-4 md:px-6 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar / Info */}
                    <div className="md:w-64 flex-shrink-0 space-y-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{subjectData.subject}</h1>
                            <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm font-semibold text-gray-600">
                                Class {subjectData.grade}
                            </div>
                        </div>

                        <div className="p-5 bg-blue-50 rounded-xl border border-blue-100">
                            <h3 className="font-bold text-blue-900 mb-2 text-lg">Course Challenge</h3>
                            <p className="text-sm text-blue-800 mb-4 leading-relaxed">
                                Test your knowledge of the entire course with a comprehensive challenge.
                            </p>
                            <Link
                                href={`/lectures/${params.exam}/${params.slug}/challenge`}
                                className="block w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm text-center"
                            >
                                Start Course Challenge
                            </Link>
                        </div>
                    </div>

                    {/* Main Content - Units Grid */}
                    <div className="flex-grow grid grid-cols-1 gap-6">
                        {subjectData.units.map((unit) => (
                            <UnitCard
                                key={unit.id}
                                unit={unit}
                                exam={params.exam}
                                slug={params.slug}
                            />
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
