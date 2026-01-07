
"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Trophy, PlayCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import confetti from 'canvas-confetti';

interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    hint: string;
}

interface ChallengeInterfaceProps {
    questions: Question[];
    title: string;
    topicMap?: Record<string, string>;
    baseLink?: string;
    onExit: () => void;
}

interface ChapterStats {
    topic: string;
    total: number;
    correct: number;
    wrong: number;
    unattempted: number;
    wrongPercentage: number;
    status: 'Strong' | 'Needs Improvement' | 'Weak';
}

export default function ChallengeInterface({ questions, title, topicMap = {}, baseLink = '', onExit }: ChallengeInterfaceProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [showResults, setShowResults] = useState(false);
    const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes
    const [isTimerRunning, setIsTimerRunning] = useState(true);

    // Timer Logic
    useEffect(() => {
        if (timeLeft > 0 && isTimerRunning && !showResults) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && !showResults) {
            handleSubmit();
        }
    }, [timeLeft, isTimerRunning, showResults]);

    // Confetti on Results
    useEffect(() => {
        if (showResults) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }
                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
        }
    }, [showResults]);

    if (!questions || questions.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading Challenge...</p>
                </div>
            </div>
        );
    }

    const question = questions[currentQuestionIndex];
    if (!question) return null; // Safety guard

    const totalQuestions = questions.length;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')} `;
    };

    const handleOptionSelect = (optionIndex: number) => {
        if (showResults) return;
        setAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
    };

    const handleSubmit = () => {
        setIsTimerRunning(false);
        setShowResults(true);
    };

    // Calculate Score
    const calculateScore = () => {
        let score = 0;
        let correctCount = 0;
        let incorrectCount = 0;
        let unattemptedCount = 0;

        questions.forEach((q, idx) => {
            const userAnswer = answers[idx];
            if (userAnswer === undefined) {
                unattemptedCount++;
            } else if (userAnswer === q.correctAnswer) {
                score += 4;
                correctCount++;
            } else {
                score -= 1;
                incorrectCount++;
            }
        });

        return { score, correctCount, incorrectCount, unattemptedCount };
    };

    // Advanced Diagnostics Logic
    const getDiagnosticsResults = (): ChapterStats[] => {
        const statsMap: Record<string, ChapterStats> = {};

        questions.forEach((q, idx) => {
            // Extract Topic Name from generated text "[Topic Name]"
            const match = q.text.match(/^\[(.*?)\]/);
            const topic = match ? match[1] : 'Mixed Concepts';

            if (!statsMap[topic]) {
                statsMap[topic] = {
                    topic,
                    total: 0,
                    correct: 0,
                    wrong: 0,
                    unattempted: 0,
                    wrongPercentage: 0,
                    status: 'Strong'
                };
            }

            statsMap[topic].total++;
            const userAnswer = answers[idx];

            if (userAnswer === undefined) {
                statsMap[topic].unattempted++;
            } else if (userAnswer === q.correctAnswer) {
                statsMap[topic].correct++;
            } else {
                statsMap[topic].wrong++;
            }
        });

        // Determine Status based on Thresholds
        return Object.values(statsMap).map(stat => {
            // Logic: Total Attempted = Correct + Wrong (ignoring unattempted for error rate? Or total questions?)
            // User requirement: "Wrong > 50% => Weak". Usually this means Wrong/Total Questions in chapter.
            const wrongPercentage = (stat.wrong / stat.total) * 100;
            let status: ChapterStats['status'] = 'Strong';

            if (wrongPercentage <= 25) {
                status = 'Strong';
            } else if (wrongPercentage <= 50) {
                status = 'Needs Improvement';
            } else {
                status = 'Weak';
            }

            return { ...stat, wrongPercentage, status };
        });
    };

    if (showResults) {
        const { score, correctCount, incorrectCount, unattemptedCount } = calculateScore();
        const chapterStats = getDiagnosticsResults();

        return (
            <div className="max-w-5xl mx-auto p-4 md:p-8 bg-white rounded-3xl shadow-2xl mt-8">
                {/* Header Section */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="inline-flex items-center justify-center p-5 bg-yellow-100 rounded-full mb-6 shadow-sm"
                    >
                        <Trophy className="w-14 h-14 text-yellow-600" />
                    </motion.div>
                    <h2 className="text-4xl font-extrabold text-gray-900 mb-2">Challenge Complete!</h2>
                    <p className="text-gray-500 text-lg">Here is your comprehensive performance analysis.</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                    <div className="p-6 bg-blue-50/50 rounded-2xl text-center border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-4xl font-extrabold text-blue-600 mb-1">{score}</div>
                        <div className="text-xs font-bold text-blue-800 uppercase tracking-wider">Total Score</div>
                    </div>
                    <div className="p-6 bg-green-50/50 rounded-2xl text-center border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-4xl font-extrabold text-green-600 mb-1">{correctCount}</div>
                        <div className="text-xs font-bold text-green-800 uppercase tracking-wider">Correct</div>
                    </div>
                    <div className="p-6 bg-red-50/50 rounded-2xl text-center border border-red-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-4xl font-extrabold text-red-600 mb-1">{incorrectCount}</div>
                        <div className="text-xs font-bold text-red-800 uppercase tracking-wider">Incorrect</div>
                    </div>
                    <div className="p-6 bg-gray-50/50 rounded-2xl text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-4xl font-extrabold text-gray-600 mb-1">{unattemptedCount}</div>
                        <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">Unattempted</div>
                    </div>
                </div>

                {/* Chapter Analysis Table */}
                <div className="mb-12">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <AlertTriangle className="w-6 h-6 mr-3 text-blue-600" />
                        Chapter Breakdown
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {chapterStats.map((stat) => (
                            <div key={stat.topic} className="flex flex-col md:flex-row items-center justify-between p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-blue-200 transition-colors">
                                {/* Chapter Info */}
                                <div className="flex-grow mb-4 md:mb-0 text-center md:text-left">
                                    <h4 className="text-lg font-bold text-gray-900">{stat.topic}</h4>
                                    <div className="text-sm text-gray-500 mt-1 space-x-3">
                                        <span>{stat.total} Qs</span>
                                        <span className="text-red-500 font-medium">{stat.wrong} Wrong ({Math.round(stat.wrongPercentage)}%)</span>
                                        <span className="text-gray-400">|</span>
                                        <span className={
                                            stat.status === 'Strong' ? 'text-green-600 font-bold' :
                                                stat.status === 'Weak' ? 'text-red-600 font-bold' : 'text-yellow-600 font-bold'
                                        }>
                                            {stat.status === 'Strong' ? '✅ Strong Understanding' :
                                                stat.status === 'Weak' ? '❌ Weak Area' : '⚠ Needs Improvement'}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div>
                                    {stat.status === 'Strong' ? (
                                        <span className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 text-sm font-semibold rounded-lg border border-green-100">
                                            Keep it up!
                                        </span>
                                    ) : (
                                        <Link
                                            href={topicMap[stat.topic] ? `${baseLink}/${topicMap[stat.topic]}` : baseLink}
                                            className={`inline-flex items-center px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-transform active:scale-95 ${stat.status === 'Weak'
                                                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                                : 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
                                                }`}
                                        >
                                            {stat.status === 'Weak' ? 'Revise & Watch Lecture' : 'Improve this Chapter'}
                                            < ArrowRight className="w-4 h-4 ml-2" />
                                        </Link >
                                    )}
                                </div >
                            </div >
                        ))}
                    </div >
                </div >

                <div className="flex justify-center gap-4">
                    <button
                        onClick={onExit}
                        className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Back to Course
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all hover:shadow-xl"
                    >
                        Retake Challenge
                    </button>
                </div>
            </div >
        );
    }

    return (
        <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-100px)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-500">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                    <div className="h-4 w-px bg-gray-200"></div>
                    <span className={`flex items-center font-mono font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-blue-600'}`}>
                        <Clock className="w-4 h-4 mr-2" />
                        {formatTime(timeLeft)}
                    </span>
                </div>
                <button
                    onClick={handleSubmit}
                    className="px-4 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                    Submit Test
                </button>
            </div>

            <div className="flex flex-grow gap-6 overflow-hidden">
                {/* Question Area */}
                <div className="flex-grow flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-y-auto p-8">
                    <div className="mb-6">
                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                            Single Correct Type (+4, -1)
                        </span>
                        <h3 className="text-xl font-medium text-gray-900 leading-relaxed font-serif">
                            {question.text}
                        </h3>
                    </div>

                    <div className="space-y-3 max-w-2xl">
                        {question.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleOptionSelect(idx)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${answers[currentQuestionIndex] === idx
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50 text-gray-700'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 text-sm font-bold ${answers[currentQuestionIndex] === idx
                                        ? 'border-blue-500 bg-blue-500 text-white'
                                        : 'border-gray-300 text-gray-400'
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className="font-medium">{option}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto pt-8 flex justify-between">
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${currentQuestionIndex === 0
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Previous
                        </button>

                        {currentQuestionIndex < totalQuestions - 1 && (
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-shadow shadow-md hover:shadow-lg"
                            >
                                Next Question
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Question Palette Sidebar */}
                <div className="w-64 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col flex-shrink-0">
                    <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">Question Palette</h4>
                    <div className="grid grid-cols-4 gap-2 overflow-y-auto">
                        {questions.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentQuestionIndex(idx)}
                                className={`h-10 rounded-lg text-sm font-bold transition-colors ${currentQuestionIndex === idx
                                    ? 'ring-2 ring-blue-500 ring-offset-2 bg-white text-blue-600'
                                    : answers[idx] !== undefined
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                        <div className="flex items-center text-xs text-gray-600">
                            <div className="w-3 h-3 bg-blue-600 rounded-sm mr-2"></div>
                            Attempted
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                            <div className="w-3 h-3 bg-gray-100 rounded-sm mr-2"></div>
                            Unattempted
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                            <div className="w-3 h-3 ring-2 ring-blue-500 bg-white rounded-sm mr-2"></div>
                            Current
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
