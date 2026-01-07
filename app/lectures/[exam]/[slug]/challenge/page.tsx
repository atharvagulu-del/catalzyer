"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { lectureData, getChallengeQuestions } from "@/lib/lectureData";
import { notFound, useRouter } from "next/navigation"; // Added useRouter
import Link from "next/link";
import { ChevronRight, AlertTriangle, Clock, Trophy, HelpCircle } from "lucide-react";
import ChallengeInterface from "@/components/lectures/ChallengeInterface";

interface PageProps {
    params: {
        exam: string;
        slug: string;
    };
}

export default function ChallengePage({ params }: PageProps) {
    const router = useRouter();
    const key = `${params.exam}-${params.slug}`.toLowerCase();
    const subjectData = lectureData[key] ||
        lectureData[`${params.exam}-${params.slug.replace('mathematics', 'maths')}`];

    const [hasStarted, setHasStarted] = useState(false);
    const [questions, setQuestions] = useState<any[]>([]);
    const [topicMap, setTopicMap] = useState<Record<string, string>>({});

    useEffect(() => {
        if (subjectData) {
            setQuestions(getChallengeQuestions(subjectData.id));

            // Generate Topic -> ID map for linking
            const map: Record<string, string> = {};
            subjectData.units.forEach(unit => {
                const firstChapterId = unit.chapters?.[0]?.id;
                if (firstChapterId) {
                    map[unit.title] = `${unit.id}/${firstChapterId}`; // Map to first chapter
                }
            });
            setTopicMap(map);
        }
    }, [subjectData]);

    if (!subjectData) {
        notFound();
    }

    if (hasStarted) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <div className="flex-grow p-4">
                    <ChallengeInterface
                        questions={questions}
                        title={`Course Challenge: ${subjectData.subject}`}
                        topicMap={topicMap}
                        baseLink={`/lectures/${params.exam}/${params.slug}`}
                        onExit={() => {
                            setHasStarted(false);
                            // Optional: router.push(...) if we want to force exit entirely
                        }}
                    />
                </div>
                {/* Footer omitted during test for focus, or added if preferred */}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <div className="flex-grow flex items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-8 text-center border-b border-gray-100 bg-gradient-to-br from-blue-50 to-white">
                        <div className="inline-block p-4 bg-blue-100 rounded-full mb-6">
                            <Trophy className="w-10 h-10 text-blue-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Challenge: {subjectData.subject}</h1>
                        <p className="text-gray-600">Test your readiness for {params.exam.toUpperCase()} with this comprehensive mock evaluation.</p>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                            <div className="flex">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                                <div>
                                    <h3 className="text-sm font-bold text-yellow-800 uppercase tracking-wide">Important Instructions</h3>
                                    <ul className="mt-2 text-sm text-yellow-800 space-y-1 list-disc list-inside">
                                        <li>You have <strong>45 minutes</strong> to complete this challenge.</li>
                                        <li>There are <strong>25 Questions</strong> in total.</li>
                                        <li><strong>+4 Marks</strong> for every correct answer.</li>
                                        <li><strong>-1 Mark</strong> for every incorrect answer (Negative Marking).</li>
                                        <li><strong>0 Marks</strong> for unattempted questions.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <Clock className="w-5 h-5 mr-3 text-gray-400" />
                                <span>Timed Environment</span>
                            </div>
                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <HelpCircle className="w-5 h-5 mr-3 text-gray-400" />
                                <span>Detailed Analysis Report</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                        <Link
                            href={`/lectures/${params.exam}/${params.slug}`}
                            className="text-gray-500 hover:text-gray-800 font-medium px-4 py-2 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            onClick={() => setHasStarted(true)}
                            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                        >
                            Start Challenge Now
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
