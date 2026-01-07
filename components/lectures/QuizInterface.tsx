"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronRight, RefreshCw, Trophy, HelpCircle, SkipForward } from 'lucide-react';
import { Question } from '@/lib/lectureData';
import confetti from 'canvas-confetti';

interface QuizInterfaceProps {
    questions: Question[];
    title: string;
    onComplete?: () => void;
}

export default function QuizInterface({ questions = [], title, onComplete }: QuizInterfaceProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect' | 'stuck'>('idle');
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [shake, setShake] = useState(0); // Key to trigger shake animation
    const [hintRevealed, setHintRevealed] = useState(false);

    // Reset state when question changes
    useEffect(() => {
        setSelectedOption(null);
        setStatus('idle');
        setHintRevealed(false);
    }, [currentIndex]);

    // Guard clause for empty questions
    if (!questions || questions.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                    <p className="text-lg font-medium">No questions available yet.</p>
                    <p className="text-sm">Check back later!</p>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    // Additional safety check if index is out of bounds (shouldn't happen with correct logic but good for safety)
    if (!currentQuestion) {
        return <div className="p-8 text-center text-red-500">Error loading question.</div>;
    }

    // Handle Option Click
    const handleOptionSelect = (index: number) => {
        if (status === 'correct') return; // Lock if already correct
        setSelectedOption(index);
        if (status === 'stuck') {
            setStatus('idle');
        } else {
            setStatus('idle');
        }
    };

    // Handle Check Button
    const handleCheck = () => {
        if (selectedOption === null) return;

        if (selectedOption === currentQuestion.correctAnswer) {
            setStatus('correct');
            setScore(prev => prev + 1);
            // Trigger simple confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.8 },
                colors: ['#1865f2', '#00a60e', '#ffffff'] // Blue, Green, White
            });
        } else {
            setStatus('incorrect');
            setShake(prev => prev + 1); // Trigger shake
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setStatus('idle');
            setSelectedOption(null);
            setHintRevealed(false);
        } else {
            setShowResult(true);
            if (onComplete) onComplete();
        }
    };

    const handleSkip = () => {
        setStatus('stuck');
    };

    const handleShowHint = () => {
        setHintRevealed(true);
    };

    const handleSkipQuestion = () => {
        // Mark as skipped (no score increase) and move next
        handleNext();
    };

    const handleRetry = () => {
        setCurrentIndex(0);
        setSelectedOption(null);
        setStatus('idle');
        setScore(0);
        setShowResult(false);
        setHintRevealed(false);
    };

    // --- Result Screen ---
    if (showResult) {
        const percentage = Math.round((score / questions.length) * 100);
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col items-center justify-center p-8 text-center min-h-[500px]">
                <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                    <Trophy className="h-12 w-12 text-yellow-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Practice Complete!</h2>
                <p className="text-gray-600 mb-8 max-w-md">
                    You&apos;ve leveled up your skills on <strong>{title}</strong>.
                    <br />
                    Score: {score}/{questions.length} ({percentage}%)
                </p>

                <div className="w-full max-w-sm bg-gray-100 rounded-full h-4 mb-8">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={`h-full rounded-full ${percentage >= 80 ? 'bg-[#00a60e]' : 'bg-[#1865f2]'}`}
                    />
                </div>

                <button
                    onClick={handleRetry}
                    className="px-8 py-3 bg-[#1865f2] text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Practice Again
                </button>
            </div>
        );
    }

    // --- Main Quiz UI ---
    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* 1. Header & Progress */}
            <div className="flex-none p-4 md:p-6 border-b border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-gray-400 text-sm tracking-wider uppercase">
                        Question {currentIndex + 1} / {questions.length}
                    </h2>
                </div>
                {/* Segmented Progress Bar */}
                <div className="flex gap-1 h-1.5 w-full">
                    {questions.map((_, idx) => (
                        <div
                            key={idx}
                            className={`flex-1 rounded-full ${idx < currentIndex ? 'bg-[#1865f2]' : idx === currentIndex ? 'bg-gray-300' : 'bg-gray-100'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* 2. Scrollable Content (Question + Options) */}
            <div className="flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar">
                <div className="max-w-2xl mx-auto w-full">
                    {/* Question Text */}
                    <div className="mb-8">
                        <p className="text-xl md:text-2xl font-serif text-gray-900 leading-relaxed antialiased">
                            {currentQuestion.text}
                        </p>
                    </div>

                    {/* Hint Display */}
                    <AnimatePresence>
                        {hintRevealed && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-900 overflow-hidden"
                            >
                                <div className="flex gap-2 mb-2">
                                    <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                                    <p className="font-bold text-sm uppercase tracking-wide text-blue-700">Hint</p>
                                </div>
                                <p className="text-blue-900/80 leading-relaxed pl-6">{currentQuestion.hint || "No hint available for this question."}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Options List */}
                    <div className="space-y-4">
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = selectedOption === index;
                            const isWrong = status === 'incorrect' && isSelected;
                            const isCorrect = status === 'correct' && index === currentQuestion.correctAnswer;

                            // Determine styles based on state
                            let containerClass = "border-2 border-gray-200 hover:border-gray-300 bg-white";
                            let iconClass = "border-2 border-gray-300";

                            if (isSelected) {
                                containerClass = "border-2 border-[#1865f2] bg-blue-50/10 shadow-[0_0_0_1px_#1865f2]";
                                iconClass = "bg-[#1865f2] border-[#1865f2]"; // Filed blue circle
                            }

                            if (isWrong) {
                                containerClass = "border-2 border-[#b01e1e] bg-red-50/10"; // Khan red
                                iconClass = "bg-[#b01e1e] border-[#b01e1e]";
                            }

                            if (status === 'correct' && index === currentQuestion.correctAnswer) {
                                containerClass = "border-2 border-[#00a60e] bg-green-50/10"; // Khan green
                                iconClass = "bg-[#00a60e] border-[#00a60e]";
                            }

                            return (
                                <motion.button
                                    key={index}
                                    onClick={() => handleOptionSelect(index)}
                                    // Shake animation only for the wrong option
                                    animate={isWrong ? { x: [-5, 5, -5, 5, 0] } : {}}
                                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                                    disabled={status === 'correct'}
                                    className={`relative w-full text-left p-5 rounded-lg transition-all duration-200 flex items-start gap-4 group outline-none ${containerClass}`}
                                >
                                    {/* Custom Radio Icon */}
                                    <div className={`flex-none w-6 h-6 rounded-full flex items-center justify-center mt-0.5 transition-colors ${iconClass}`}>
                                        {/* Inner white dot for selected state */}
                                        {isSelected && status === 'idle' && (
                                            <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                        )}
                                        {/* Icons for terminal states */}
                                        {isWrong && <X className="w-4 h-4 text-white stroke-[3]" />}
                                        {(status === 'correct' && index === currentQuestion.correctAnswer) && <Check className="w-4 h-4 text-white stroke-[4]" />}
                                    </div>

                                    <span className="text-lg text-gray-800 leading-snug pt-0.5 font-medium">
                                        {option}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 3. Sticky Bottom Action Bar (Desktop & Mobile) */}
            <div className={`flex-none p-4 md:px-8 md:py-6 border-t border-gray-200 transition-colors duration-300 ${status === 'correct' ? 'bg-[#dfffe0] border-t-transparent' :
                status === 'incorrect' ? 'bg-[#ffebe6] border-t-transparent' :
                    status === 'stuck' ? 'bg-gray-50' : 'bg-white'
                }`}>
                <div className="max-w-2xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-4">

                    {/* Feedback Message */}
                    <div className="flex-grow w-full md:w-auto min-h-[2rem]">
                        <AnimatePresence mode="wait">
                            {status === 'correct' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-start gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#00a60e] shadow-sm">
                                        <Check className="w-5 h-5 stroke-[3]" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#004d05] text-lg">Nice work!</h3>
                                        <p className="text-[#004d05]/80 text-sm">You got it right.</p>
                                    </div>
                                </motion.div>
                            )}
                            {status === 'incorrect' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-start gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#b01e1e] shadow-sm">
                                        <X className="w-5 h-5 stroke-[3]" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#700c0c] text-lg">Not quite yet...</h3>
                                        <p className="text-[#700c0c]/80 text-sm font-medium cursor-pointer hover:underline">
                                            {currentQuestion.explanation || 'Try again or get help.'}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                            {status === 'stuck' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <h3 className="font-bold text-gray-800 text-lg">Stuck?</h3>
                                    <p className="text-gray-600 text-sm">Review related articles/videos or use a hint.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Action Button */}
                    <div className="w-full md:w-auto flex items-center gap-3">
                        {status === 'stuck' ? (
                            <>
                                <button
                                    onClick={!hintRevealed ? handleShowHint : undefined}
                                    disabled={hintRevealed}
                                    className={`flex-1 md:flex-none px-6 py-3 font-bold text-[#1865f2] hover:bg-blue-50 rounded-md transition-colors ${hintRevealed ? 'opacity-50 cursor-default' : ''}`}
                                >
                                    {hintRevealed ? 'Hint shown' : 'Get a hint'}
                                </button>
                                <button
                                    onClick={handleSkipQuestion}
                                    className="flex-1 md:flex-none px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    Skip for now
                                </button>
                            </>
                        ) : status === 'correct' ? (
                            <button
                                onClick={handleNext}
                                className="w-full md:w-auto px-8 py-3 bg-[#1865f2] text-white font-bold rounded-md hover:bg-[#0b4eba] transition-shadow shadow-[0_4px_0_0_#0b4eba] active:shadow-none active:translate-y-1"
                            >
                                {currentIndex < questions.length - 1 ? 'Next question' : 'Show Summary'}
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleSkip}
                                    className="px-4 py-3 text-gray-500 font-bold hover:text-gray-900 transition-colors"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={handleCheck}
                                    disabled={selectedOption === null}
                                    className={`w-full md:w-auto flex-1 px-8 py-3 font-bold rounded-md transition-all ${selectedOption !== null
                                        ? 'bg-[#1865f2] text-white shadow-[0_4px_0_0_#0b4eba] hover:bg-[#0b4eba] active:shadow-none active:translate-y-1'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {status === 'incorrect' ? 'Try Again' : 'Check'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
