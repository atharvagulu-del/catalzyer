export interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number; // Index 0-3
    explanation?: string;
    hint?: string;
}

export type ResourceType = 'video' | 'pyq' | 'quiz' | 'article';

export interface Resource {
    id: string;
    title: string;
    type: ResourceType;
    duration?: string; // For videos
    questionCount?: number; // For quizzes/pyqs
    url?: string; // YouTube ID or link
    completed?: boolean;
    questions?: Question[];
}

export interface Chapter {
    id: string;
    title: string;
    description?: string;
    masteryLevel?: number; // 0 to 100
    resources: Resource[];
}

export interface Unit {
    id: string;
    title: string;
    chapters: Chapter[];
}

export interface SubjectData {
    id: string; // e.g., 'jee-maths-11'
    title: string;
    exam: 'JEE' | 'NEET';
    grade: '11th' | '12th' | 'Dropper';
    subject: 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology';
    units: Unit[];
}

// Helper to get data by slug
export const getSubjectData = (exam: string, subject: string, grade: string): SubjectData | undefined => {
    const key = `${exam}-${subject}-${grade}`.toLowerCase();
    return lectureData[key];
};

// Helper to generate mock questions for any topic with varied templates
const generateMockQuestions = (topic: string, count: number): Question[] => {
    const questionTemplates = [
        (t: string) => `What is the primary defining characteristic of ${t}?`,
        (t: string) => `Which of the following statements accurately describes ${t}?`,
        (t: string) => `Solve the following problem related to ${t}: Calculate the standard value.`,
        (t: string) => `In the context of ${t}, identify the correct property from the below options.`,
        (t: string) => `Apply the fundamental principles of ${t} to determine the outcome.`,
        (t: string) => `Which of these is a common misconception regarding ${t}?`,
        (t: string) => `Evaluated based on strict mathematical definition, what is ${t}?`
    ];

    const optionTemplates = [
        (t: string, i: number) => `It is a special case of ${t} with index ${i}.`,
        (t: string, i: number) => `The value increases proportionally with ${t}.`,
        (t: string, i: number) => `This holds true only when ${t} is positive.`,
        (t: string, i: number) => `It represents the derivative of ${t}.`,
        (t: string, i: number) => `It is independent of ${t}.`,
        (t: string, i: number) => `Zero.`,
        (t: string, i: number) => `One.`,
        (t: string, i: number) => `Undefined.`
    ];

    const explanationTemplates = [
        (t: string) => `This is a fundamental property of ${t} derived from first principles.`,
        (t: string) => `By definition, ${t} must satisfy this condition.`,
        (t: string) => `Recall the standard formula for ${t}. Substituting the values gives this result.`,
        (t: string) => `This is the only option that satisfies the continuity condition of ${t}.`
    ];

    const hintTemplates = [
        (t: string) => `Think about the basic definition of ${t}.`,
        (t: string) => `Recall the standard formula used for ${t}.`,
        (t: string) => `Try drawing a diagram to visualize ${t}.`,
        (t: string) => `Eliminate options that contradict the properties of ${t}.`
    ];

    return Array.from({ length: count }).map((_, i) => {
        const qTemplate = questionTemplates[i % questionTemplates.length];
        const hTemplate = hintTemplates[i % hintTemplates.length];
        const eTemplate = explanationTemplates[i % explanationTemplates.length];

        // Randomize correct answer position (0-3)
        const correctIndex = Math.floor(Math.random() * 4);

        // Generate options (3 distractors + 1 correct)
        const options = Array(4).fill(null);

        // Place correct option
        options[correctIndex] = optionTemplates[(i + 2) % optionTemplates.length](topic, 3); // Using a "plausible/correct" looking template
        if (options[correctIndex].includes('Undefined')) options[correctIndex] = `The exact calculated value of ${topic}.`;

        // Fill distractors
        let distractorIdx = 0;
        for (let j = 0; j < 4; j++) {
            if (j === correctIndex) continue;
            options[j] = optionTemplates[(i + distractorIdx) % optionTemplates.length](topic, distractorIdx + 1);
            if (options[j] === options[correctIndex]) options[j] = `None of the above for ${topic}.`;
            distractorIdx++;
        }

        return {
            id: `gen-${topic.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
            text: `[${topic}] Q${i + 1}: ${qTemplate(topic)}`,
            options: options,
            correctAnswer: correctIndex,
            explanation: eTemplate(topic),
            hint: hTemplate(topic)
        };
    });
};

// Helper: Select N random items from an array
const getRandomItems = <T>(arr: T[], n: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
};

export const getChallengeQuestions = (subjectId: string): Question[] => {
    const data = lectureData[subjectId];
    if (!data) return [];

    let questions: Question[] = [];

    if (subjectId.includes('math')) {
        // Specific distribution for JEE Maths
        const distribution = [
            { unitBox: 'Sets, Relations and Functions', count: 4 },
            { unitBox: 'Trigonometric Functions', count: 4 },
            { unitBox: 'Complex Numbers & Quadratic Eq', count: 4 },
            { unitBox: 'Sequence and Series', count: 4 },
            { unitBox: 'Straight Lines', count: 4 }, // Coordinate Geometry
        ];

        // 1. Collect specific topics
        distribution.forEach(dist => {
            const unit = data.units.find(u => u.title.includes(dist.unitBox) || dist.unitBox.includes(u.title));
            if (unit) {
                // Generate fresh questions for this challenge to ensure uniqueness/freshness
                questions = [...questions, ...generateMockQuestions(unit.title, dist.count)];
            } else {
                questions = [...questions, ...generateMockQuestions(dist.unitBox, dist.count)];
            }
        });

        // 2. Misc / Mixed Concepts (5 questions)
        const otherUnits = data.units.filter(u =>
            !distribution.some(d => u.title.includes(d.unitBox) || d.unitBox.includes(u.title))
        );

        if (otherUnits.length > 0) {
            questions = [...questions, ...generateMockQuestions('Mixed Concepts', 5)];
        } else {
            questions = [...questions, ...generateMockQuestions('Advanced Problems', 5)];
        }

    } else {
        // Generic distribution for Physics/Chemistry (randomize across units)
        // 5 units * 5 questions or similar
        const units = getRandomItems(data.units, 5);
        units.forEach(u => {
            questions = [...questions, ...generateMockQuestions(u.title, 5)];
        });

        // Ensure we have 25
        if (questions.length < 25) {
            questions = [...questions, ...generateMockQuestions('General Practice', 25 - questions.length)];
        }
    }

    return questions.slice(0, 25); // Hard cap at 25
};

// Original specific mock questions for "Types of Sets"
const setTheoryQuestions: Question[] = [
    {
        id: 'q1',
        text: 'If A = {x : x is a letter of the word "MATHEMATICS"} and B = {y : y is a letter of the word "STATISTICS"}, then A ∩ B is:',
        options: ['{M, A, T, H, E, I, C, S}', '{A, T, I, C, S}', '{T, I, S}', '{A, T, I, S}'],
        correctAnswer: 1,
        explanation: 'A = {M, A, T, H, E, I, C, S}, B = {S, T, A, I, C}. Intersection is common elements: {A, T, I, C, S}.',
        hint: 'Find the sets A and B first by listing distinct letters. Then find common letters.'
    },
    {
        id: 'q2',
        text: 'Which of the following is a singleton set?',
        options: ['{x : |x| < 1, x ∈ Z}', '{x : x² - 1 = 0, x ∈ N}', '{x : x² + 1 = 0, x ∈ R}', '{x : x is an even prime number}'],
        correctAnswer: 3,
        explanation: '{x : x is an even prime number} = {2}, which has exactly one element.',
        hint: 'A singleton set has exactly one element. Check which option results in a single value.'
    },
    {
        id: 'q3',
        text: 'The number of subsets of a set containing n elements is:',
        options: ['n', '2n', '2^n', 'n^2'],
        correctAnswer: 2,
        explanation: 'The number of subsets of a set with n elements is 2^n.',
        hint: 'Recall the formula for the power set of a set with n elements.'
    },
    {
        id: 'q4',
        text: 'If A ⊂ B, then A ∪ B is equal to:',
        options: ['A', 'B', 'A ∩ B', 'None of these'],
        correctAnswer: 1,
        explanation: 'Since A is a subset of B, all elements of A are in B. Thus, their union is B.',
        hint: 'Draw a Venn diagram where one circle is completely inside the other.'
    },
    {
        id: 'q5',
        text: 'In a group of 400 people, 250 can speak Hindi and 200 can speak English. How many people can speak both Hindi and English?',
        options: ['40', '50', '60', '80'],
        correctAnswer: 1,
        explanation: 'n(H ∪ E) = n(H) + n(E) - n(H ∩ E). 400 = 250 + 200 - x => x = 450 - 400 = 50.',
        hint: 'Use the formula n(A ∪ B) = n(A) + n(B) - n(A ∩ B).'
    }
];

const mockQuestions = setTheoryQuestions;

export const lectureData: Record<string, SubjectData> = {
    'jee-mathematics-11': {
        id: 'jee-mathematics-11',
        title: 'Mathematics Class 11 (JEE)',
        exam: 'JEE',
        grade: '11th',
        subject: 'Mathematics',
        units: [
            {
                id: 'sets-relations-functions',
                title: 'Sets, Relations and Functions',
                chapters: [
                    {
                        id: 'sets-intro',
                        title: 'Introduction to Sets',
                        description: 'Definition, Representation (Roster & Set Builder Form).',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-sets-1', title: 'What is a Set?', type: 'video', duration: '12:30', url: 'placeholder' },
                            { id: 'p-sets-1', title: 'PYQs: Sets Basics', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Sets Basics', 5) }
                        ]
                    },
                    {
                        id: 'types-of-sets',
                        title: 'Types of Sets',
                        description: 'Empty, Finite, Infinite, Equal, and Subsets.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-sets-2', title: 'Types of Sets', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-sets-2', title: 'PYQs: Types of Sets', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Types of Sets', 5) }
                        ]
                    },
                    {
                        id: 'venn-diagrams',
                        title: 'Venn Diagrams & Operations',
                        description: 'Union, Intersection, Difference, Complement.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-sets-3', title: 'Venn Diagrams', type: 'video', duration: '20:15', url: 'placeholder' },
                            { id: 'p-sets-3', title: 'PYQs: Set Operations', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Set Operations', 5) }
                        ]
                    },
                    {
                        id: 'relations',
                        title: 'Relations',
                        description: 'Cartesian Product, Domain, Range, Codomain.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-rel-1', title: 'Cartesian Product & Relations', type: 'video', duration: '18:45', url: 'placeholder' },
                            { id: 'p-rel-1', title: 'PYQs: Relations', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Relations', 5) }
                        ]
                    },
                    {
                        id: 'functions-intro',
                        title: 'Introduction to Functions',
                        description: 'Function definition, Image, Pre-image, Graphs.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-func-1', title: 'Basics of Functions', type: 'video', duration: '14:20', url: 'placeholder' },
                            { id: 'p-func-1', title: 'PYQs: Functions Intro', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Functions Basics', 5) }
                        ]
                    },
                    {
                        id: 'functions-types',
                        title: 'Types of Functions',
                        description: 'One-one, Many-one, Onto, Into functions.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-func-2', title: 'Types of Functions', type: 'video', duration: '25:00', url: 'placeholder' },
                            { id: 'p-func-2', title: 'PYQs: Types of Functions', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Types of Functions', 5) }
                        ]
                    },
                    {
                        id: 'sets-rel-func-full-test',
                        title: 'Full Chapter Test: Sets, Relations & Functions',
                        description: 'Comprehensive test covering Sets, Relations and Functions.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'quiz-srf-full', title: 'Full Chapter Test: Sets, Relations & Functions', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Sets Relations Functions Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'trigonometric-functions',
                title: 'Trigonometric Functions',
                chapters: [
                    {
                        id: 'angles-measurement',
                        title: 'Angles & Measurement',
                        description: 'Degree and Radian measure, Conversions.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-trig-1', title: 'Angles & Measurement', type: 'video', duration: '10:00', url: 'placeholder' },
                            { id: 'p-trig-1', title: 'PYQs: Angles', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Angles', 5) }
                        ]
                    },
                    {
                        id: 'trig-functions',
                        title: 'Trigonometric Functions',
                        description: 'Signs, Domain, Range, Graphs of Trig functions.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-trig-2', title: 'Trig Functions & Graphs', type: 'video', duration: '22:30', url: 'placeholder' },
                            { id: 'p-trig-2', title: 'PYQs: Trig Basis', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Trig Functions', 5) }
                        ]
                    },
                    {
                        id: 'compound-angles',
                        title: 'Compound & Multiple Angles',
                        description: 'Sum, Difference, 2x, 3x formulae.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-trig-3', title: 'Compound Angle Formulae', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-trig-3', title: 'PYQs: Compound Angles', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Compound Angles', 5) }
                        ]
                    },
                    {
                        id: 'trig-equations',
                        title: 'Trigonometric Equations',
                        description: 'Principal and General Solutions.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-trig-4', title: 'Solving Trig Equations', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-trig-4', title: 'PYQs: Trig Equations', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Trig Equations', 5) }
                        ]
                    },
                    {
                        id: 'trig-full-test',
                        title: 'Full Chapter Test: Trigonometric Functions',
                        description: 'Comprehensive test for Trigonometry.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'quiz-trig-full', title: 'Full Chapter Test: Trigonometric Functions', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Trigonometry Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'complex-quadratic',
                title: 'Complex Numbers & Quadratic Eq.',
                chapters: [
                    {
                        id: 'complex-intro',
                        title: 'Complex Numbers Basics',
                        description: 'Iota, Algebra, Modulus, Conjugate.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-comp-1', title: 'Complex Numbers Intro', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-comp-1', title: 'PYQs: Complex Basics', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Complex Numbers', 5) }
                        ]
                    },
                    {
                        id: 'argand-plane',
                        title: 'Argand Plane & Polar Form',
                        description: 'Geometric representation, Polar form.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-comp-2', title: 'Argand Plane', type: 'video', duration: '16:00', url: 'placeholder' },
                            { id: 'p-comp-2', title: 'PYQs: Argand Plane', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Argand Plane', 5) }
                        ]
                    },
                    {
                        id: 'quadratic-eq',
                        title: 'Quadratic Equations',
                        description: 'Roots, Discriminant, Nature of roots.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-quad-1', title: 'Quadratic Equations', type: 'video', duration: '22:00', url: 'placeholder' },
                            { id: 'p-quad-1', title: 'PYQs: Quadratics', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Quadratic Equations', 5) }
                        ]
                    },
                    {
                        id: 'comp-quad-full-test',
                        title: 'Full Chapter Test: Complex & Quadratic',
                        description: 'Comprehensive test for Complex Numbers and Quadratics.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'quiz-cq-full', title: 'Full Chapter Test: Complex & Quadratic', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Complex & Quadratics Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'linear-inequalities',
                title: 'Linear Inequalities',
                chapters: [
                    {
                        id: 'inequalities-alg',
                        title: 'Algebraic Solutions',
                        description: 'Solving linear inequalities in one variable.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-ineq-1', title: 'Solving Inequalities', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-ineq-1', title: 'PYQs: Inequalities', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Inequalities', 5) }
                        ]
                    },
                    {
                        id: 'inequalities-graph',
                        title: 'Graphical Solutions',
                        description: 'Two variables, System of inequalities.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-ineq-2', title: 'Graphical Method', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-ineq-2', title: 'PYQs: Graphical Method', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Graphical Inequalities', 5) }
                        ]
                    },
                    {
                        id: 'ineq-full-test',
                        title: 'Full Chapter Test: Linear Inequalities',
                        description: 'Comprehensive test for Linear Inequalities.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'quiz-ineq-full', title: 'Full Chapter Test: Linear Inequalities', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Linear Inequalities Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'permutations-combinations',
                title: 'Permutations and Combinations',
                chapters: [
                    {
                        id: 'pnc-counting',
                        title: 'Fundamental Principle of Counting',
                        description: 'Multiplication and Addition rules.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-pnc-1', title: 'Counting Principles', type: 'video', duration: '14:00', url: 'placeholder' },
                            { id: 'p-pnc-1', title: 'PYQs: Counting', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Counting Principle', 5) }
                        ]
                    },
                    {
                        id: 'permutations',
                        title: 'Permutations',
                        description: 'Arrangement of objects (nPr).',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-pnc-2', title: 'Permutations', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-pnc-2', title: 'PYQs: Permutations', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Permutations', 5) }
                        ]
                    },
                    {
                        id: 'combinations',
                        title: 'Combinations',
                        description: 'Selection of objects (nCr).',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-pnc-3', title: 'Combinations', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-pnc-3', title: 'PYQs: Combinations', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Combinations', 5) }
                        ]
                    },
                    {
                        id: 'pnc-full-test',
                        title: 'Full Chapter Test: P & C',
                        description: 'Comprehensive test for Permutations and Combinations.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'quiz-pnc-full', title: 'Full Chapter Test: P & C', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Permutations & Combinations Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'binomial-theorem',
                title: 'Binomial Theorem',
                chapters: [
                    {
                        id: 'binomial-exp',
                        title: 'Binomial Expansion',
                        description: 'Expansion for positive integral index, Pascal\'s Triangle.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-bin-1', title: 'Binomial Expansion', type: 'video', duration: '16:00', url: 'placeholder' },
                            { id: 'p-bin-1', title: 'PYQs: Expansion', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Binomial Expansion', 5) }
                        ]
                    },
                    {
                        id: 'binomial-terms',
                        title: 'General & Middle Terms',
                        description: 'Finding specific terms, Coefficient problems.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-bin-2', title: 'Term Problems', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-bin-2', title: 'PYQs: Terms & Coefficients', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Binomial Terms', 5) }
                        ]
                    },
                    {
                        id: 'bin-full-test',
                        title: 'Full Chapter Test: Binomial Theorem',
                        description: 'Comprehensive test for Binomial Theorem.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'quiz-bin-full', title: 'Full Chapter Test: Binomial Theorem', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Binomial Theorem Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'sequence-series',
                title: 'Sequence and Series',
                chapters: [
                    {
                        id: 'ap',
                        title: 'Arithmetic Progression (AP)',
                        description: 'nth term, Sum of n terms, AM.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-seq-1', title: 'Arithmetic Progression', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-seq-1', title: 'PYQs: AP', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Arithmetic Progression', 5) }
                        ]
                    },
                    {
                        id: 'gp',
                        title: 'Geometric Progression (GP)',
                        description: 'nth term, Sum of n terms, GM, Infinite GP.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-seq-2', title: 'Geometric Progression', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-seq-2', title: 'PYQs: GP', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Geometric Progression', 5) }
                        ]
                    },
                    {
                        id: 'special-series',
                        title: 'Special Series',
                        description: 'Sum of n terms of special series.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-seq-3', title: 'Special Series', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-seq-3', title: 'PYQs: Special Series', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Special Series', 5) }
                        ]
                    },
                    {
                        id: 'seq-full-test',
                        title: 'Full Chapter Test: Sequence & Series',
                        description: 'Comprehensive test for AP, GP, and Series.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'quiz-seq-full', title: 'Full Chapter Test: Sequence & Series', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Sequence & Series Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'straight-lines',
                title: 'Straight Lines',
                chapters: [
                    {
                        id: 'lines-basics',
                        title: 'Slope & Basics',
                        description: 'Slope of a line, Parallel/Perpendicular lines.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-lines-1', title: 'Slope Concept', type: 'video', duration: '12:00', url: 'placeholder' },
                            { id: 'p-lines-1', title: 'PYQs: Slope Basics', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Slope Basics', 5) }
                        ]
                    },
                    {
                        id: 'lines-equations',
                        title: 'Forms of Line Equation',
                        description: 'Point-slope, Two-point, Slope-intercept, Intercept forms.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-lines-2', title: 'Equations of Lines', type: 'video', duration: '22:00', url: 'placeholder' },
                            { id: 'p-lines-2', title: 'PYQs: Forms of Lines', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Line Equations', 5) }
                        ]
                    },
                    {
                        id: 'lines-general',
                        title: 'General Equation & Distance',
                        description: 'General form, Normal form, Distance of point.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-lines-3', title: 'General & Normal Form', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-lines-3', title: 'PYQs: Distance & General', type: 'pyq', questionCount: 5, questions: generateMockQuestions('General Line Eq', 5) }
                        ]
                    },
                    {
                        id: 'lines-full-test',
                        title: 'Full Chapter Test: Straight Lines',
                        description: 'Comprehensive test for Straight Lines.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'quiz-lines-full', title: 'Full Chapter Test: Straight Lines', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Straight Lines Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'conic-sections',
                title: 'Conic Sections',
                chapters: [
                    {
                        id: 'circles',
                        title: 'Circles',
                        description: 'Standard equation of a circle.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-conic-1', title: 'Circles', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-conic-1', title: 'PYQs: Circles', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Circles', 5) }
                        ]
                    },
                    {
                        id: 'parabola',
                        title: 'Parabola',
                        description: 'Standard forms of Parabola.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-conic-2', title: 'Parabola', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-conic-2', title: 'PYQs: Parabola', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Parabola', 5) }
                        ]
                    },
                    {
                        id: 'ellipse',
                        title: 'Ellipse',
                        description: 'Standard equation, Vertices, Foci, Eccentricity.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-conic-3', title: 'Ellipse', type: 'video', duration: '22:00', url: 'placeholder' },
                            { id: 'p-conic-3', title: 'PYQs: Ellipse', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Ellipse', 5) }
                        ]
                    },
                    {
                        id: 'hyperbola',
                        title: 'Hyperbola',
                        description: 'Standard equation, Foci, Asymptotes.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-conic-4', title: 'Hyperbola', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-conic-4', title: 'PYQs: Hyperbola', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Hyperbola', 5) }
                        ]
                    },
                    {
                        id: 'conics-full-test',
                        title: 'Full Chapter Test: Conic Sections',
                        description: 'Comprehensive test for ALL Conic Sections.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'quiz-conic-full', title: 'Full Chapter Test: Conic Sections', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Conic Sections Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'intro-3d',
                title: 'Introduction to 3D Geometry',
                chapters: [
                    {
                        id: '3d-coords',
                        title: 'Coordinates in 3D',
                        description: 'Octants, Coordinates of a point.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-3d-1', title: '3D Coordinate System', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-3d-1', title: 'PYQs: 3D Basics', type: 'pyq', questionCount: 5, questions: generateMockQuestions('3D Basics', 5) }
                        ]
                    },
                    {
                        id: '3d-formulas',
                        title: 'Distance & Section Formula',
                        description: 'Distance between points, Section formula.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-3d-2', title: '3D Formulas', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-3d-2', title: 'PYQs: 3D Formulas', type: 'pyq', questionCount: 5, questions: generateMockQuestions('3D Formulas', 5) }
                        ]
                    },
                    {
                        id: '3d-full-test',
                        title: 'Full Chapter Test: 3D Geometry',
                        description: 'Comprehensive test for 3D Geometry.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'quiz-3d-full', title: 'Full Chapter Test: 3D Geometry', type: 'quiz', questionCount: 25, questions: generateMockQuestions('3D Geometry Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'limits-derivatives',
                title: 'Limits and Derivatives',
                chapters: [
                    {
                        id: 'limits',
                        title: 'Limits',
                        description: 'Concept, Algebra of limits, Standard limits.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-calc-1', title: 'Limits Explained', type: 'video', duration: '22:00', url: 'placeholder' },
                            { id: 'p-calc-1', title: 'PYQs: Limits', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Limits', 5) }
                        ]
                    },
                    {
                        id: 'derivatives',
                        title: 'Derivatives',
                        description: 'Derivative at a point, Measuring rate of change.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-calc-2', title: 'Derivatives Basics', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-calc-2', title: 'PYQs: Derivatives', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Derivatives', 5) }
                        ]
                    },
                    {
                        id: 'calc-full-test',
                        title: 'Full Chapter Test: Limits & Derivatives',
                        description: 'Comprehensive test for Calculus.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'quiz-calc-full', title: 'Full Chapter Test: Limits & Derivatives', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Calculus Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'mathematical-reasoning',
                title: 'Mathematical Reasoning',
                chapters: [
                    {
                        id: 'reasoning-logic',
                        title: 'Logic & Statements',
                        description: 'Statements, Negation, Compound statements.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-reason-1', title: 'Mathematical Logic', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-reason-1', title: 'PYQs: Logic', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Logic Statements', 5) }
                        ]
                    },
                    {
                        id: 'reasoning-implication',
                        title: 'Implications & Validity',
                        description: 'If-then, Contrapositive, Converse.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-reason-2', title: 'Implications', type: 'video', duration: '14:00', url: 'placeholder' },
                            { id: 'p-reason-2', title: 'PYQs: Implications', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Implications', 5) }
                        ]
                    },
                    {
                        id: 'reason-full-test',
                        title: 'Full Chapter Test: Reasoning',
                        description: 'Comprehensive test for Mathematical Reasoning.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'quiz-reason-full', title: 'Full Chapter Test: Reasoning', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Mathematical Reasoning Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'statistics',
                title: 'Statistics',
                chapters: [
                    {
                        id: 'stats-dispersion',
                        title: 'Measures of Dispersion',
                        description: 'Range, Mean Deviation.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-stat-1', title: 'Dispersion Basics', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-stat-1', title: 'PYQs: Dispersion', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Measures of Dispersion', 5) }
                        ]
                    },
                    {
                        id: 'stats-variance',
                        title: 'Variance & Standard Deviation',
                        description: 'Calculation for grouped/ungrouped data.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-stat-2', title: 'Variance & SD', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-stat-2', title: 'PYQs: Variance', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Variance & SD', 5) }
                        ]
                    },
                    {
                        id: 'stat-full-test',
                        title: 'Full Chapter Test: Statistics',
                        description: 'Comprehensive test for Statistics.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'quiz-stat-full', title: 'Full Chapter Test: Statistics', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Statistics Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'probability',
                title: 'Probability',
                chapters: [
                    {
                        id: 'prob-basics',
                        title: 'Probability Basics',
                        description: 'Random Experiments, Sample Space.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-prob-1', title: 'Intro to Probability', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-prob-1', title: 'PYQs: Basics', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Probability Basics', 5) }
                        ]
                    },
                    {
                        id: 'prob-events',
                        title: 'Events & Algebra',
                        description: 'Types of events, Axiomatic approach.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-prob-2', title: 'Events', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-prob-2', title: 'PYQs: Events', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Probability Events', 5) }
                        ]
                    },
                    {
                        id: 'prob-full-test',
                        title: 'Full Chapter Test: Probability',
                        description: 'Comprehensive test for Probability.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'quiz-prob-full', title: 'Full Chapter Test: Probability', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Probability Full Test', 25) }
                        ]
                    }
                ]
            }
        ]
    },
    'jee-physics-11': {
        id: 'jee-physics-11',
        title: 'Physics Class 11 (JEE)',
        exam: 'JEE',
        grade: '11th',
        subject: 'Physics',
        units: [
            {
                id: 'units-measurements',
                title: 'Units and Measurements',
                chapters: [
                    {
                        id: 'dim-analysis',
                        title: 'Dimensional Analysis',
                        description: 'Dimensions, Homogeneity, Applications.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-1', title: 'Dimensions Basics', type: 'video', duration: '18:20', url: 'placeholder' },
                            { id: 'p-phy-1', title: 'PYQs: Dimensions', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Dimensional Analysis', 5) }
                        ]
                    },
                    {
                        id: 'error-analysis',
                        title: 'Errors in Measurement',
                        description: 'Systematic/Random errors, Propagation, Sig Figs.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-2', title: 'Error Analysis Guide', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-phy-2', title: 'PYQs: Errors', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Error Analysis', 5) }
                        ]
                    },
                    {
                        id: 'measuring-inst',
                        title: 'Measuring Instruments',
                        description: 'Vernier Calipers, Screw Gauge.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-3', title: 'Vernier & Screw Gauge', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-phy-3', title: 'PYQs: Instruments', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Measuring Instruments', 5) }
                        ]
                    },
                    {
                        id: 'units-full-test',
                        title: 'Full Chapter Test: Units & Measurements',
                        description: 'Comprehensive test for Units, Dimensions, and Errors.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'q-phy-units-full', title: 'Full Chapter Test: Units & Measurements', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Units & Measurements Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'kinematics',
                title: 'Kinematics',
                chapters: [
                    {
                        id: 'motion-1d',
                        title: 'Motion in a Straight Line',
                        description: 'Graphs, Calculus approach to Kinematics.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-4', title: '1D Kinematics', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-phy-4', title: 'PYQs: 1D Motion', type: 'pyq', questionCount: 5, questions: generateMockQuestions('1D Motion', 5) }
                        ]
                    },
                    {
                        id: 'motion-gravity',
                        title: 'Motion Under Gravity',
                        description: 'Free fall, Vertical projection.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-5', title: 'Motion Under Gravity', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-phy-5', title: 'PYQs: Gravity', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Motion Under Gravity', 5) }
                        ]
                    },
                    {
                        id: 'vectors',
                        title: 'Vectors',
                        description: 'Addition, Dot & Cross Products.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-6', title: 'Vectors Complete Guide', type: 'video', duration: '25:00', url: 'placeholder' },
                            { id: 'p-phy-6', title: 'PYQs: Vectors', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Vectors', 5) }
                        ]
                    },
                    {
                        id: 'projectile',
                        title: 'Projectile Motion',
                        description: 'Ground-to-ground, Height-to-ground.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-7', title: 'Projectile Motion', type: 'video', duration: '22:00', url: 'placeholder' },
                            { id: 'p-phy-7', title: 'PYQs: Projectile', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Projectile Motion', 5) }
                        ]
                    },
                    {
                        id: 'relative-motion',
                        title: 'Relative Motion',
                        description: 'Rain-Man, River-Swimmer problems.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-8', title: 'Relative Velocity', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-phy-8', title: 'PYQs: Relative Motion', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Relative Motion', 5) }
                        ]
                    },
                    {
                        id: 'kinematics-full-test',
                        title: 'Full Chapter Test: Kinematics',
                        description: 'Comprehensive test for 1D, 2D, and Vectors.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'q-phy-kinematics-full', title: 'Full Chapter Test: Kinematics', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Kinematics Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'laws-of-motion',
                title: 'Laws of Motion',
                chapters: [
                    {
                        id: 'newtons-laws',
                        title: 'Newton\'s Laws Basics',
                        description: 'FBDs, Equilibrium problems.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-9', title: 'Newton\'s Laws', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-phy-9', title: 'PYQs: NLM', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Newton\'s Laws', 5) }
                        ]
                    },
                    {
                        id: 'constraints-pulleys',
                        title: 'Constraint Motion & Pulleys',
                        description: 'String, Wedge, and Pulley constraints.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-10', title: 'Pulley Problems', type: 'video', duration: '25:00', url: 'placeholder' },
                            { id: 'p-phy-10', title: 'PYQs: Pulleys', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Constraint Motion', 5) }
                        ]
                    },
                    {
                        id: 'friction',
                        title: 'Friction',
                        description: 'Static/Kinetic Friction, Two-block problems.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-11', title: 'Mastering Friction', type: 'video', duration: '22:00', url: 'placeholder' },
                            { id: 'p-phy-11', title: 'PYQs: Friction', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Friction', 5) }
                        ]
                    },
                    {
                        id: 'pseudo-force',
                        title: 'Pseudo Force',
                        description: 'Non-inertial frames, Lift problems.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-12', title: 'Pseudo Force Concept', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-phy-12', title: 'PYQs: Pseudo Force', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Pseudo Force', 5) }
                        ]
                    },
                    {
                        id: 'circular-dynamics',
                        title: 'Circular Dynamics',
                        description: 'Centripetal force, Banking of roads.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-13', title: 'Circular Motion Dynamics', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-phy-13', title: 'PYQs: Circular Dynamics', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Circular Dynamics', 5) }
                        ]
                    },
                    {
                        id: 'nlm-full-test',
                        title: 'Full Chapter Test: Laws of Motion',
                        description: 'Comprehensive test for NLM, Friction, and Constaints.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'q-phy-nlm-full', title: 'Full Chapter Test: Laws of Motion', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Laws of Motion Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'work-energy-power',
                title: 'Work, Energy and Power',
                chapters: [
                    {
                        id: 'work-energy',
                        title: 'Work & Work-Energy Theorem',
                        description: 'Variable force work, WET applications.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-14', title: 'Work-Energy Theorem', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-phy-14', title: 'PYQs: Work & Energy', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Work Energy', 5) }
                        ]
                    },
                    {
                        id: 'conservation-energy',
                        title: 'Conservation of Mechanical Energy',
                        description: 'Potential Energy, Spring force.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-15', title: 'Conservation of Energy', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-phy-15', title: 'PYQs: Energy Conservation', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Energy Conservation', 5) }
                        ]
                    },
                    {
                        id: 'power-vcm',
                        title: 'Power & Vertical Circular Motion',
                        description: 'Power, VCM critical conditions.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-16', title: 'Vertical Circular Motion', type: 'video', duration: '16:00', url: 'placeholder' },
                            { id: 'p-phy-16', title: 'PYQs: Power & VCM', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Vertical Circular Motion', 5) }
                        ]
                    },
                    {
                        id: 'collisions',
                        title: 'Collisions',
                        description: 'Elastic/Inelastic, Coeff of restitution (e).',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-17', title: 'Collision Theory', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-phy-17', title: 'PYQs: Collisions', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Collisions', 5) }
                        ]
                    },
                    {
                        id: 'wep-full-test',
                        title: 'Full Chapter Test: Work, Energy & Power',
                        description: 'Comprehensive test for WEP and Collisions.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'q-phy-wep-full', title: 'Full Chapter Test: Work, Energy & Power', type: 'quiz', questionCount: 25, questions: generateMockQuestions('WEP Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'rotational-motion',
                title: 'Rotational Motion',
                chapters: [
                    {
                        id: 'com',
                        title: 'Center of Mass',
                        description: 'Position of COM, Motion of COM.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-18', title: 'Center of Mass', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-phy-18', title: 'PYQs: COM', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Center of Mass', 5) }
                        ]
                    },
                    {
                        id: 'moi',
                        title: 'Moment of Inertia',
                        description: 'Theorems of MOI, Standard bodies.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-19', title: 'Moment of Inertia', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-phy-19', title: 'PYQs: MOI', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Moment of Inertia', 5) }
                        ]
                    },
                    {
                        id: 'torque',
                        title: 'Torque & Equilibrium',
                        description: 'Rotational equilibrium problems.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-20', title: 'Torque Concepts', type: 'video', duration: '16:00', url: 'placeholder' },
                            { id: 'p-phy-20', title: 'PYQs: Torque', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Torque', 5) }
                        ]
                    },
                    {
                        id: 'ang-mom',
                        title: 'Angular Momentum',
                        description: 'Conservation of L.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-21', title: 'Angular Momentum', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-phy-21', title: 'PYQs: Angular Momentum', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Angular Momentum', 5) }
                        ]
                    },
                    {
                        id: 'rolling',
                        title: 'Rolling Motion',
                        description: 'Pure rolling, Rolling Kinetic Energy.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-22', title: 'Rolling Motion Explained', type: 'video', duration: '24:00', url: 'placeholder' },
                            { id: 'p-phy-22', title: 'PYQs: Rolling', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Rolling Motion', 5) }
                        ]
                    },
                    {
                        id: 'rot-full-test',
                        title: 'Full Chapter Test: Rotational Motion',
                        description: 'Comprehensive test for Rotational Motion and COM.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'q-phy-rot-full', title: 'Full Chapter Test: Rotational Motion', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Rotational Motion Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'gravitation',
                title: 'Gravitation',
                chapters: [
                    {
                        id: 'grav-field',
                        title: 'Gravitational Field & Potential',
                        description: 'Newton\'s Law, g variation, Potential.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-23', title: 'Gravitation Field', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-phy-23', title: 'PYQs: Gravitation Field', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Gravitation Field', 5) }
                        ]
                    },
                    {
                        id: 'satellites',
                        title: 'Satellites & Kepler\'s Laws',
                        description: 'Orbital velocity, Escape velocity.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-24', title: 'Satellite Motion', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-phy-24', title: 'PYQs: Satellites', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Satellites', 5) }
                        ]
                    },
                    {
                        id: 'grav-full-test',
                        title: 'Full Chapter Test: Gravitation',
                        description: 'Comprehensive test for Gravitation and Satellites.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'q-phy-grav-full', title: 'Full Chapter Test: Gravitation', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Gravitation Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'properties-solids-fluids',
                title: 'Properties of Solids and Fluids',
                chapters: [
                    {
                        id: 'solids-elasticity',
                        title: 'Elasticity (Solids)',
                        description: 'Stress-Strain, Young\'s Modulus.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-25', title: 'Elasticity Basics', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-phy-25', title: 'PYQs: Elasticity', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Elasticity', 5) }
                        ]
                    },
                    {
                        id: 'fluid-statics',
                        title: 'Fluid Statics',
                        description: 'Pressure, Buoyancy, Archimedes Principle.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-26', title: 'Hydrostatics', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-phy-26', title: 'PYQs: Fluid Statics', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Fluid Statics', 5) }
                        ]
                    },
                    {
                        id: 'fluid-dynamics',
                        title: 'Fluid Dynamics',
                        description: 'Bernoulli\'s Theorem, Continuity Eq.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-27', title: 'Bernoulli\'s Principle', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-phy-27', title: 'PYQs: Fluid Dynamics', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Fluid Dynamics', 5) }
                        ]
                    },
                    {
                        id: 'viscosity',
                        title: 'Viscosity & Surface Tension',
                        description: 'Terminal velocity, Capillarity.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-28', title: 'Viscosity & Surface Tension', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-phy-28', title: 'PYQs: Viscosity', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Viscosity', 5) }
                        ]
                    },
                    {
                        id: 'fluids-full-test',
                        title: 'Full Chapter Test: Solids & Fluids',
                        description: 'Comprehensive test for Fluids and Solids.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'q-phy-fluids-full', title: 'Full Chapter Test: Solids & Fluids', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Solids & Fluids Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'thermal-physics',
                title: 'Thermal Physics',
                chapters: [
                    {
                        id: 'thermal-exp',
                        title: 'Thermal Expansion & Calorimetry',
                        description: 'Expansion, Mixing problems.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-29', title: 'Calorimetry Basics', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-phy-29', title: 'PYQs: Calorimetry', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Calorimetry', 5) }
                        ]
                    },
                    {
                        id: 'heat-transfer',
                        title: 'Heat Transfer',
                        description: 'Conduction, Convection, Radiation.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-30', title: 'Heat Transfer Mechanisms', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-phy-30', title: 'PYQs: Heat Transfer', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Heat Transfer', 5) }
                        ]
                    },
                    {
                        id: 'ktg',
                        title: 'Kinetic Theory of Gases',
                        description: 'Ideal Gas, RMS speed, DOF.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-31', title: 'KTG Explained', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-phy-31', title: 'PYQs: KTG', type: 'pyq', questionCount: 5, questions: generateMockQuestions('KTG', 5) }
                        ]
                    },
                    {
                        id: 'thermodynamics',
                        title: 'Thermodynamics',
                        description: 'Processes, Graphs, Heat Engines.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-32', title: 'Thermodynamics Processes', type: 'video', duration: '22:00', url: 'placeholder' },
                            { id: 'p-phy-32', title: 'PYQs: Thermodynamics', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Thermodynamics', 5) }
                        ]
                    },
                    {
                        id: 'thermal-full-test',
                        title: 'Full Chapter Test: Thermal Physics',
                        description: 'Comprehensive test for Thermal Properties, KTG, and Thermodynamics.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'q-phy-thermal-full', title: 'Full Chapter Test: Thermal Physics', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Thermal Physics Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'oscillations-waves',
                title: 'Oscillations and Waves',
                chapters: [
                    {
                        id: 'shm',
                        title: 'Simple Harmonic Motion (SHM)',
                        description: 'Equation of SHM, Phasors.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-33', title: 'SHM Basics', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-phy-33', title: 'PYQs: SHM', type: 'pyq', questionCount: 5, questions: generateMockQuestions('SHM', 5) }
                        ]
                    },
                    {
                        id: 'springs',
                        title: 'Spring & Pendulum Systems',
                        description: 'Time period of Spring-block systems.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-34', title: 'Spring Systems', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-phy-34', title: 'PYQs: Springs', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Spring Systems', 5) }
                        ]
                    },
                    {
                        id: 'waves',
                        title: 'Wave Mechanics',
                        description: 'Traveling waves, Speed of sound.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-35', title: 'Traveling Waves', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-phy-35', title: 'PYQs: Waves', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Wave Mechanics', 5) }
                        ]
                    },
                    {
                        id: 'superposition',
                        title: 'Superposition & Standing Waves',
                        description: 'Interference, Beats, Organ pipes.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-36', title: 'Standing Waves', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-phy-36', title: 'PYQs: Superposition', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Superposition', 5) }
                        ]
                    },
                    {
                        id: 'doppler',
                        title: 'Doppler Effect',
                        description: 'Source/Observer moving cases.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-phy-37', title: 'Doppler Effect', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-phy-37', title: 'PYQs: Doppler Effect', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Doppler Effect', 5) }
                        ]
                    },
                    {
                        id: 'waves-full-test',
                        title: 'Full Chapter Test: Oscillation & Waves',
                        description: 'Comprehensive test for SHM and Waves.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'q-phy-waves-full', title: 'Full Chapter Test: Oscillation & Waves', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Oscillations & Waves Full Test', 25) }
                        ]
                    }
                ]
            }
        ]
    },
    'jee-chemistry-11': {
        id: 'jee-chemistry-11',
        title: 'Chemistry Class 11 (JEE)',
        exam: 'JEE',
        grade: '11th',
        subject: 'Chemistry',
        units: [
            {
                id: 'basic-concepts',
                title: 'Some Basic Concepts of Chemistry',
                chapters: [
                    {
                        id: 'mole-concept',
                        title: 'Mole Concept',
                        description: 'Molar mass, Formula mass, Mole calculations.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-01', title: 'Mole Concept Basics', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-chem-01', title: 'PYQs: Mole Concept', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Mole Concept', 5) }
                        ]
                    },
                    {
                        id: 'stoichiometry',
                        title: 'Stoichiometry',
                        description: 'Limiting reagent, Percent yield analysis.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-02', title: 'Stoichiometry & Limiting Reagent', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-chem-02', title: 'PYQs: Stoichiometry', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Stoichiometry', 5) }
                        ]
                    },
                    {
                        id: 'concentration',
                        title: 'Concentration Terms',
                        description: 'Molarity, Molality, Mole fraction calculations.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-03', title: 'Concentration Terms', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-chem-03', title: 'PYQs: Concentration Terms', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Concentration Terms', 5) }
                        ]
                    },
                    {
                        id: 'basic-full-test',
                        title: 'Full Chapter Test: Basic Concepts',
                        description: 'Comprehensive test for Mole Concept and Stoichiometry.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'q-chem-basic-full', title: 'Full Chapter Test: Basic Concepts', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Basic Concepts Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'structure-atom',
                title: 'Structure of Atom',
                chapters: [
                    {
                        id: 'atomic-models',
                        title: 'Atomic Models',
                        description: 'Dalton, Thomson, Rutherford, Bohr models.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-04', title: 'Bohr\'s Model', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-chem-04', title: 'PYQs: Atomic Models', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Atomic Models', 5) }
                        ]
                    },
                    {
                        id: 'quantum-model',
                        title: 'Quantum Mechanical Model',
                        description: 'Quantum numbers, Shapes of Orbitals.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-05', title: 'Quantum Numbers', type: 'video', duration: '25:00', url: 'placeholder' },
                            { id: 'p-chem-05', title: 'PYQs: Quantum Model', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Quantum Model', 5) }
                        ]
                    },
                    {
                        id: 'electronic-config',
                        title: 'Electronic Configuration',
                        description: 'Aufbau principle, Pauli exclusion, Hund\'s rule.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-06', title: 'Electronic Configuration Rules', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-chem-06', title: 'PYQs: Electronic Config', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Electronic Configuration', 5) }
                        ]
                    },
                    {
                        id: 'atom-full-test',
                        title: 'Full Chapter Test: Structure of Atom',
                        description: 'Comprehensive test for Atomic Structure.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'q-chem-atom-full', title: 'Full Chapter Test: Structure of Atom', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Structure of Atom Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'periodicity',
                title: 'Classification of Elements & Periodicity',
                chapters: [
                    {
                        id: 'periodic-table',
                        title: 'Periodic Table Basics',
                        description: 'History and Modern Periodic Law.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-07', title: 'Modern Periodic Table', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-chem-07', title: 'PYQs: Periodic Table', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Periodic Table', 5) }
                        ]
                    },
                    {
                        id: 'periodic-trends',
                        title: 'Periodic Trends',
                        description: 'Atomic radius, Ionization Energy, Electron Gain Enthalpy.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-08', title: 'Periodic Trends Explained', type: 'video', duration: '22:00', url: 'placeholder' },
                            { id: 'p-chem-08', title: 'PYQs: Periodic Trends', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Periodic Trends', 5) }
                        ]
                    },
                    {
                        id: 'chemical-properties',
                        title: 'Chemical Properties Trends',
                        description: 'Valency, Oxidation states, Chemical reactivity.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-09', title: 'Trends in Chemical Properties', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-chem-09', title: 'PYQs: Chemical Properties', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Chemical Properties', 5) }
                        ]
                    },
                    {
                        id: 'periodicity-full-test',
                        title: 'Full Chapter Test: Periodicity',
                        description: 'Comprehensive test for Periodic Classification.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'q-chem-periodicity-full', title: 'Full Chapter Test: Periodicity', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Periodicity Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'bonding',
                title: 'Chemical Bonding & Molecular Structure',
                chapters: [
                    {
                        id: 'ionic-bonding',
                        title: 'Ionic Bonding',
                        description: 'Lattice energy, Octet rule, Properties.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-10', title: 'Ionic Bonds', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-chem-10', title: 'PYQs: Ionic Bonding', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Ionic Bonding', 5) }
                        ]
                    },
                    {
                        id: 'covalent-vsepr',
                        title: 'Covalent Bonding & VSEPR',
                        description: 'Lewis structures, VSEPR Theory, Molecular shapes.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-11', title: 'VSEPR Theory', type: 'video', duration: '25:00', url: 'placeholder' },
                            { id: 'p-chem-11', title: 'PYQs: VSEPR', type: 'pyq', questionCount: 5, questions: generateMockQuestions('VSEPR', 5) }
                        ]
                    },
                    {
                        id: 'hybridization',
                        title: 'Hybridization & VBT',
                        description: 'Valence Bond Theory, Types of Hybridization.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-12', title: 'Hybridization Concepts', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-chem-12', title: 'PYQs: Hybridization', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Hybridization', 5) }
                        ]
                    },
                    {
                        id: 'mot',
                        title: 'Molecular Orbital Theory (MOT)',
                        description: 'MO diagrams, Bond order, Magnetic properties.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-13', title: 'MOT Explained', type: 'video', duration: '22:00', url: 'placeholder' },
                            { id: 'p-chem-13', title: 'PYQs: MOT', type: 'pyq', questionCount: 5, questions: generateMockQuestions('MOT', 5) }
                        ]
                    },
                    {
                        id: 'bonding-full-test',
                        title: 'Full Chapter Test: Chemical Bonding',
                        description: 'Comprehensive test for Chemical Bonding.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'q-chem-bonding-full', title: 'Full Chapter Test: Chemical Bonding', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Chemical Bonding Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'thermodynamics',
                title: 'Thermodynamics',
                chapters: [
                    {
                        id: 'first-law',
                        title: 'First Law of Thermodynamics',
                        description: 'Internal energy, Work, Heat, Enthalpy.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-14', title: 'First Law Basics', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-chem-14', title: 'PYQs: First Law', type: 'pyq', questionCount: 5, questions: generateMockQuestions('First Law Thermodynamics', 5) }
                        ]
                    },
                    {
                        id: 'thermochemistry',
                        title: 'Thermochemistry',
                        description: 'Hess\'s Law, Enthalpies of formation/combustion.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-15', title: 'Hess\'s Law & Enthalpy', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-chem-15', title: 'PYQs: Thermochemistry', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Thermochemistry', 5) }
                        ]
                    },
                    {
                        id: 'entropy-second-law',
                        title: 'Entropy & Second Law',
                        description: 'Spontaneity, Entropy change.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-16', title: 'Entropy & Spontaneity', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-chem-16', title: 'PYQs: Entropy', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Entropy', 5) }
                        ]
                    },
                    {
                        id: 'gibbs-energy',
                        title: 'Gibbs Energy',
                        description: 'Gibbs free energy change, Relation to K.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-17', title: 'Gibbs Energy', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-chem-17', title: 'PYQs: Gibbs Energy', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Gibbs Energy', 5) }
                        ]
                    },
                    {
                        id: 'thermo-full-test',
                        title: 'Full Chapter Test: Thermodynamics',
                        description: 'Comprehensive test for Chemical Thermodynamics.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'q-chem-thermo-full', title: 'Full Chapter Test: Thermodynamics', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Thermodynamics Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'equilibrium',
                title: 'Equilibrium',
                chapters: [
                    {
                        id: 'chemical-equilibrium',
                        title: 'Chemical Equilibrium',
                        description: 'Law of Mass Action, Kc, Kp, Le Chatelier.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-18', title: 'Chemical Equilibrium Constants', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-chem-18', title: 'PYQs: Chemical Equilibrium', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Chemical Equilibrium', 5) }
                        ]
                    },
                    {
                        id: 'ionic-equilibrium',
                        title: 'Ionic Equilibrium',
                        description: 'Acids & Bases, pH scale, pOH.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-19', title: 'Ionic Equilibrium & pH', type: 'video', duration: '22:00', url: 'placeholder' },
                            { id: 'p-chem-19', title: 'PYQs: Ionic Equilibrium', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Ionic Equilibrium', 5) }
                        ]
                    },
                    {
                        id: 'buffer-solutions',
                        title: 'Buffer Solutions',
                        description: 'Types of buffers, Henderson-Hasselbalch.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-20', title: 'Buffer Solutions', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-chem-20', title: 'PYQs: Buffers', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Buffer Solutions', 5) }
                        ]
                    },
                    {
                        id: 'solubility-product',
                        title: 'Solubility Product (Ksp)',
                        description: 'Solubility equilibria, Common ion effect.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-21', title: 'Solubility Product', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-chem-21', title: 'PYQs: Ksp', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Solubility Product', 5) }
                        ]
                    },
                    {
                        id: 'equilib-full-test',
                        title: 'Full Chapter Test: Equilibrium',
                        description: 'Comprehensive test for Equilibrium.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'q-chem-equilib-full', title: 'Full Chapter Test: Equilibrium', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Equilibrium Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'redox',
                title: 'Redox Reactions',
                chapters: [
                    {
                        id: 'oxidation-number',
                        title: 'Oxidation Number',
                        description: 'Rules for calc, Types of redox.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-22', title: 'Oxidation Numbers', type: 'video', duration: '15:00', url: 'placeholder' },
                            { id: 'p-chem-22', title: 'PYQs: Oxidation Number', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Oxidation Number', 5) }
                        ]
                    },
                    {
                        id: 'balancing-redox',
                        title: 'Balancing Redox Reactions',
                        description: 'Ion-electron method, Half-reaction method.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-23', title: 'Balancing Redox', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-chem-23', title: 'PYQs: Balancing Redox', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Balancing Redox', 5) }
                        ]
                    },
                    {
                        id: 'electrochem-cells',
                        title: 'Electrochemical Cells Basics',
                        description: 'Galvanic cells, Electrode potential.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-24', title: 'Electrochemical Cells', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-chem-24', title: 'PYQs: Cells', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Electrochemical Cells', 5) }
                        ]
                    },
                    {
                        id: 'redox-full-test',
                        title: 'Full Chapter Test: Redox Reactions',
                        description: 'Comprehensive test for Redox Reactions.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'q-chem-redox-full', title: 'Full Chapter Test: Redox Reactions', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Redox Reactions Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'goc',
                title: 'Organic Chemistry: Basic Principles (GOC)',
                chapters: [
                    {
                        id: 'nomenclature',
                        title: 'IUPAC Nomenclature',
                        description: 'Naming of organic compounds.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-25', title: 'IUPAC Naming', type: 'video', duration: '25:00', url: 'placeholder' },
                            { id: 'p-chem-25', title: 'PYQs: Nomenclature', type: 'pyq', questionCount: 5, questions: generateMockQuestions('IUPAC Nomenclature', 5) }
                        ]
                    },
                    {
                        id: 'isomerism',
                        title: 'Isomerism',
                        description: 'Structural and Stereoisomerism basics.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-26', title: 'Isomerism Basics', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-chem-26', title: 'PYQs: Isomerism', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Isomerism', 5) }
                        ]
                    },
                    {
                        id: 'electronic-effects',
                        title: 'Electronic Effects',
                        description: 'Inductive, Mesomeric, Hyperconjugation.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-27', title: 'Mechanism Effects', type: 'video', duration: '22:00', url: 'placeholder' },
                            { id: 'p-chem-27', title: 'PYQs: Electronic Effects', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Electronic Effects', 5) }
                        ]
                    },
                    {
                        id: 'reaction-intermediates',
                        title: 'Reaction Intermediates',
                        description: 'Carbocations, Carbanions, Free radicals.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-28', title: 'Reaction Intermediates', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-chem-28', title: 'PYQs: Intermediates', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Reaction Intermediates', 5) }
                        ]
                    },
                    {
                        id: 'goc-full-test',
                        title: 'Full Chapter Test: GOC',
                        description: 'Comprehensive test for Organic Basics.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'q-chem-goc-full', title: 'Full Chapter Test: GOC', type: 'quiz', questionCount: 25, questions: generateMockQuestions('GOC Full Test', 25) }
                        ]
                    }
                ]
            },
            {
                id: 'hydrocarbons',
                title: 'Hydrocarbons',
                chapters: [
                    {
                        id: 'alkanes',
                        title: 'Alkanes',
                        description: 'Prep, Properties, Conformations.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-29', title: 'Alkanes', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-chem-29', title: 'PYQs: Alkanes', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Alkanes', 5) }
                        ]
                    },
                    {
                        id: 'alkenes',
                        title: 'Alkenes',
                        description: 'Prep, Reactions, Markownikoff rule.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-30', title: 'Alkenes', type: 'video', duration: '22:00', url: 'placeholder' },
                            { id: 'p-chem-30', title: 'PYQs: Alkenes', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Alkenes', 5) }
                        ]
                    },
                    {
                        id: 'alkynes',
                        title: 'Alkynes',
                        description: 'Acidic nature, Prep, Reactions.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-31', title: 'Alkynes', type: 'video', duration: '18:00', url: 'placeholder' },
                            { id: 'p-chem-31', title: 'PYQs: Alkynes', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Alkynes', 5) }
                        ]
                    },
                    {
                        id: 'aromatic',
                        title: 'Aromatic Hydrocarbons',
                        description: 'Benzene, Aromaticity, EAS.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'v-chem-32', title: 'Benzene & Aromaticity', type: 'video', duration: '20:00', url: 'placeholder' },
                            { id: 'p-chem-32', title: 'PYQs: Benzene', type: 'pyq', questionCount: 5, questions: generateMockQuestions('Aromatic Hydrocarbons', 5) }
                        ]
                    },
                    {
                        id: 'hydro-full-test',
                        title: 'Full Chapter Test: Hydrocarbons',
                        description: 'Comprehensive test for Hydrocarbons.',
                        masteryLevel: 0,
                        resources: [
                            { id: 'q-chem-hydro-full', title: 'Full Chapter Test: Hydrocarbons', type: 'quiz', questionCount: 25, questions: generateMockQuestions('Hydrocarbons Full Test', 25) }
                        ]
                    }
                ]
            }
        ]
    }
};
