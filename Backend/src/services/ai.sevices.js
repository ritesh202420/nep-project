
const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

// ======================================================
// 1. NORMALIZE ARRAY FIELDS
// ======================================================

const stringArraySchema = z.preprocess((value) => {
    if (Array.isArray(value)) {
        return value.filter(
            (item) => typeof item === "string" && item.trim().length > 0
        );
    }

    if (typeof value === "string" && value.trim()) {
        return [value.trim()];
    }

    return [];
}, z.array(z.string()).default([]));

// ======================================================
// 2. NORMALIZE QUESTION CATEGORIES
// ======================================================

const categoryValues = [
    "technical",
    "behavioral",
    "hr",
    "coding",
    "project",
    "scenario",
    "resume",
    "other",
];

const categoryMap = {
    technical: "technical",
    "technical questions": "technical",
    behavioral: "behavioral",
    behaviour: "behavioral",
    behavioural: "behavioral",
    "behavioral questions": "behavioral",
    "behavioural questions": "behavioral",
    hr: "hr",
    "hr questions": "hr",
    coding: "coding",
    "coding questions": "coding",
    "problem solving": "coding",
    project: "project",
    "project questions": "project",
    scenario: "scenario",
    situational: "scenario",
    "scenario questions": "scenario",
    resume: "resume",
    cv: "resume",
    "resume questions": "resume",
    other: "other",
};

const categorySchema = z.preprocess((value) => {
    if (typeof value !== "string") {
        return "other";
    }

    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");

    return categoryMap[normalized] || "other";
}, z.enum(categoryValues));

// ======================================================
// 3. QUESTION SCHEMA
// ======================================================

const questionSchema = z.object({
    question: z.string().trim().min(1),
    intention: z.string().default(""),
    answer: z.string().default(""),

    category: categorySchema.optional(),

    difficulty: z.preprocess((value) => {
        if (typeof value !== "string") return undefined;

        const normalized = value.trim().toLowerCase();

        return ["easy", "medium", "hard"].includes(normalized)
            ? normalized
            : undefined;
    }, z.enum(["easy", "medium", "hard"]).optional()),

    priority: z.preprocess((value) => {
        if (typeof value !== "string") return undefined;

        const normalized = value.trim().toLowerCase();

        return ["low", "medium", "high"].includes(normalized)
            ? normalized
            : undefined;
    }, z.enum(["low", "medium", "high"]).optional()),

    followUpQuestions: stringArraySchema,
    evaluationCriteria: stringArraySchema,
});

// ======================================================
// 4. OTHER SCHEMAS
// ======================================================

const skillGapSchema = z.object({
    skill: z.string(),
    severity: z.enum(["low", "medium", "high"]),
    explanation: z.string(),
    recommendation: z.string(),
    practiceTasks: stringArraySchema,
});

const preparationDaySchema = z.object({
    day: z.number(),
    focus: z.string(),
    tasks: stringArraySchema,
    estimatedHours: z.number(),
    priority: z.enum(["low", "medium", "high"]),
    completed: z.boolean().optional().default(false),
});

const matchAnalysisSchema = z.object({
    matchingSkills: stringArraySchema,
    missingSkills: stringArraySchema,
    matchingRequirements: stringArraySchema,
    missingRequirements: stringArraySchema,
    strengths: stringArraySchema,
    concerns: stringArraySchema,
    explanation: z.string(),
});

const readinessScoresSchema = z.object({
    technical: z.number().min(0).max(100),
    project: z.number().min(0).max(100),
    communication: z.number().min(0).max(100),
    overall: z.number().min(0).max(100),
    explanation: z.string(),
});

const resumeFeedbackSchema = z.object({
    strengths: stringArraySchema,
    improvements: stringArraySchema,
    missingKeywords: stringArraySchema,
    atsSuggestions: stringArraySchema,
});

// ======================================================
// 5. INTERVIEW REPORT SCHEMA
// No fixed question counts
// ======================================================

const interviewReportSchema = z.object({
    title: z.string(),
    matchScore: z.number().min(0).max(100),

    technicalQuestions: z.array(questionSchema).default([]),
    behavioralQuestions: z.array(questionSchema).default([]),
    hrQuestions: z.array(questionSchema).default([]),
    codingQuestions: z.array(questionSchema).default([]),
    projectQuestions: z.array(questionSchema).default([]),
    scenarioQuestions: z.array(questionSchema).default([]),
    resumeQuestions: z.array(questionSchema).default([]),

    skillGaps: z.array(skillGapSchema).default([]),
    preparationPlan: z.array(preparationDaySchema).default([]),

    matchAnalysis: matchAnalysisSchema,
    readinessScores: readinessScoresSchema,
    resumeFeedback: resumeFeedbackSchema,

    interviewTips: stringArraySchema,
    importantTopics: stringArraySchema,
    summary: z.string(),
});

// ======================================================
// 6. ERROR HELPERS
// ======================================================

function isQuotaError(error) {
    const message = [
        error?.message,
        error?.status,
        error?.code,
    ].filter(Boolean).join(" ").toLowerCase();

    return (
        message.includes("resource_exhausted") ||
        message.includes("quota exceeded") ||
        message.includes("requests per day limit exceeded") ||
        message.includes("billing") ||
        message.includes("rate limit")
    );
}

function isRetryableError(error) {
    if (isQuotaError(error)) {
        return false;
    }

    const message = String(error?.message || "").toLowerCase();

    return [
        "429",
        "500",
        "502",
        "503",
        "504",
        "timeout",
        "fetch failed",
        "high demand",
        "temporarily unavailable",
        "could not find valid json",
        "empty response",
    ].some((item) => message.includes(item));
}

// ======================================================
// 7. EXTRACT JSON
// ======================================================

function extractJson(text) {
    if (!text || typeof text !== "string") {
        throw new Error("Gemini returned an empty response.");
    }

    const cleaned = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch {
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");

        if (start === -1 || end <= start) {
            throw new Error("Could not find valid JSON in Gemini response.");
        }

        return JSON.parse(cleaned.slice(start, end + 1));
    }
}

// ======================================================
// 8. GENERATE JSON
// ======================================================

async function generateJson(prompt, options = {}) {
    if (!process.env.GOOGLE_GENAI_API_KEY) {
        throw new Error(
            "GOOGLE_GENAI_API_KEY is missing from backend environment."
        );
    }

    const maxAttempts = options.maxAttempts || 2;
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: MODEL,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                },
            });

            return extractJson(response.text);
        } catch (error) {
            lastError = error;

            console.error(
                `Gemini request attempt ${attempt} failed:`,
                error?.message || error
            );

            if (isQuotaError(error)) {
                throw new Error(
                    "Gemini API quota exceeded. Check your API quota and billing, or wait for the quota reset."
                );
            }

            if (!isRetryableError(error) || attempt === maxAttempts) {
                break;
            }

            await new Promise((resolve) =>
                setTimeout(resolve, attempt * 1500)
            );
        }
    }

    throw lastError || new Error("Gemini request failed.");
}

// ======================================================
// 9. NORMALIZE QUESTION CATEGORIES
// ======================================================

function normalizeQuestionCategories(report) {
    const categoryFields = {
        technicalQuestions: "technical",
        behavioralQuestions: "behavioral",
        hrQuestions: "hr",
        codingQuestions: "coding",
        projectQuestions: "project",
        scenarioQuestions: "scenario",
        resumeQuestions: "resume",
    };

    for (const [field, category] of Object.entries(categoryFields)) {
        const items = Array.isArray(report[field]) ? report[field] : [];

        report[field] = items.map((item) => ({
            ...item,
            category,
        }));
    }

    return report;
}

// ======================================================
// 10. REMOVE DUPLICATE QUESTIONS
// ======================================================

function removeDuplicateQuestions(report) {
    const questionFields = [
        "technicalQuestions",
        "behavioralQuestions",
        "hrQuestions",
        "codingQuestions",
        "projectQuestions",
        "scenarioQuestions",
        "resumeQuestions",
    ];

    const seen = new Set();

    for (const field of questionFields) {
        report[field] = report[field].filter((item) => {
            const normalized = item.question
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, " ")
                .trim();

            if (!normalized || seen.has(normalized)) {
                return false;
            }

            seen.add(normalized);
            return true;
        });
    }

    return report;
}

// ======================================================
// 11. GENERATE INTERVIEW REPORT
// ======================================================

async function generateInterviewReport({
    resume,
    selfDescription,
    jobDescription,
}) {
    const resumeText = typeof resume === "string" ? resume.trim() : "";
    const descriptionText =
        typeof selfDescription === "string" ? selfDescription.trim() : "";
    const jobText =
        typeof jobDescription === "string" ? jobDescription.trim() : "";

    if (!jobText) {
        throw new Error("Job description is required.");
    }

    if (!resumeText && !descriptionText) {
        throw new Error("Please provide a resume or self-description.");
    }

    const prompt = `
You are an expert interviewer, technical recruiter and career coach.

Your main task is to create a comprehensive interview preparation report
PERSONALIZED to the candidate's actual resume and the target job description.

================ CANDIDATE RESUME ================
${resumeText || "Not provided"}

================ SELF DESCRIPTION ================
${descriptionText || "Not provided"}

================ TARGET JOB DESCRIPTION ================
${jobText}

==================================================
MOST IMPORTANT: DYNAMIC QUESTION GENERATION
==================================================

There is NO fixed number of questions.

Do not generate only 5, 8, 10, 15 or any other predefined number.
Do not stop after reaching an arbitrary question count.

Read the ENTIRE resume carefully and identify every meaningful detail.

Build questions from all relevant information, including:

1. Every technical skill and programming language.
2. Every framework, library, database and tool.
3. Every project mentioned in the resume.
4. Every project's purpose, features, implementation, architecture,
   challenges, decisions, testing and possible improvements, where supported.
5. Every internship or job experience actually mentioned.
6. Every education detail relevant to the target job.
7. Every certification, course and achievement mentioned.
8. Every responsibility or accomplishment actually stated.
9. Every skill required in the job description that is relevant to the candidate.
10. Every meaningful overlap between the resume and the job requirements.

For EACH relevant skill or technology, consider distinct questions about:
- Fundamental concepts.
- Practical usage.
- How the technology works.
- Real-world applications.
- Debugging and common errors.
- Comparison with related concepts, when relevant.
- Practical implementation and trade-offs.
- How the candidate used it in a project, if the resume supports that claim.

For EACH project, consider distinct questions about:
- What the project does and why it was created.
- The candidate's actual contribution, if stated.
- Technologies used.
- Project architecture and workflow.
- Important features.
- Data storage and APIs, if applicable.
- Authentication and security, if applicable.
- Problems and debugging.
- Testing and validation.
- Limitations and future improvements.
- Technical decisions and alternatives.

Only create questions that make sense for the specific resume and role.
Do not ask every possible type of question about a detail if it is irrelevant.

QUESTION CATEGORIES:

technicalQuestions:
Technical concepts, technologies and skills relevant to the resume and job.

behavioralQuestions:
Teamwork, communication, learning, handling feedback and challenges.
Do not invent personal events. Ask experience-based questions only when
the source supports them; otherwise ask hypothetical or reflective questions.

hrQuestions:
Introduction, career goals, motivation, strengths, role expectations,
availability and other relevant HR topics.

codingQuestions:
Programming logic, coding exercises, algorithms and implementation questions
relevant to the candidate's stated skills and the target role.

projectQuestions:
Detailed questions about projects actually present in the resume.
Never invent a project or claim the candidate built an unmentioned feature.

scenarioQuestions:
Realistic situations related to the target job, skills and projects.

resumeQuestions:
Questions explicitly grounded in the candidate's actual resume details.

IMPORTANT RULES:

- There is no fixed count for any category.
- Generate as many distinct and useful questions as reasonably supported
  by the resume and job description.
- Cover every meaningful resume topic that can produce a valid interview question.
- Do not miss a relevant project or technology simply because other topics
  already produced many questions.
- Do not duplicate the same question in multiple categories.
- Different questions about the same skill are allowed when they test
  genuinely different concepts.
- Never invent candidate experience, qualifications, certifications, projects,
  achievements, project features or employment history.
- If a category has no genuinely relevant questions, return an empty array.
- Prioritize resume-based questions over unrelated generic questions.
- Questions must be useful for a real interview, not trivial variations
  of the same question.
- Use fresher-friendly language when the candidate is a fresher.
- Do not claim the candidate has professional experience unless the resume says so.
- If the resume is long, prioritize complete coverage and avoid repeating topics.
- The response token limit may limit output size; prioritize distinct questions
  grounded in the supplied information rather than padding the response.

Each question object must contain:
- question: string
- intention: string
- answer: useful sample answer
- category: lowercase category name
- difficulty: easy, medium or hard
- priority: low, medium or high
- followUpQuestions: array of strings
- evaluationCriteria: array of strings

Answers must be accurate, clear and educational.
For questions about the candidate's personal experience, do not invent an answer.
Provide a suggested answer structure or clearly mark it as something the candidate
should personalize using their real experience.

For technical questions, give a technically meaningful answer rather than
a one-line generic response.

For a MERN Stack role, include relevant JavaScript, React, hooks, Node.js,
Express, REST APIs, MongoDB, authentication, debugging and project topics
when the resume or job description supports them. Do not assume every technology
is present in the resume.

==================================================
OTHER REPORT REQUIREMENTS
==================================================

1. Calculate matchScore from actual resume evidence and job requirements.
2. Identify matching and missing skills accurately.
3. Give realistic skill-gap explanations and practice tasks.
4. Give exactly seven preparation days, numbered 1 through 7.
5. Provide readiness scores from 0 to 100.
6. Provide useful resume feedback and ATS suggestions.
7. Give interview tips and important topics based on the role.
8. Do not invent personal details or qualifications.

==================================================
RETURN THIS JSON STRUCTURE
==================================================

{
  "title": "Personalized Interview Preparation Report",
  "matchScore": 0,
  "technicalQuestions": [],
  "behavioralQuestions": [],
  "hrQuestions": [],
  "codingQuestions": [],
  "projectQuestions": [],
  "scenarioQuestions": [],
  "resumeQuestions": [],
  "skillGaps": [
    {
      "skill": "Skill name",
      "severity": "medium",
      "explanation": "Evidence-based explanation",
      "recommendation": "Practical recommendation",
      "practiceTasks": []
    }
  ],
  "preparationPlan": [
    {
      "day": 1,
      "focus": "Preparation focus",
      "tasks": [],
      "estimatedHours": 2,
      "priority": "high",
      "completed": false
    }
  ],
  "matchAnalysis": {
    "matchingSkills": [],
    "missingSkills": [],
    "matchingRequirements": [],
    "missingRequirements": [],
    "strengths": [],
    "concerns": [],
    "explanation": "Detailed assessment"
  },
  "readinessScores": {
    "technical": 0,
    "project": 0,
    "communication": 0,
    "overall": 0,
    "explanation": "Assessment"
  },
  "resumeFeedback": {
    "strengths": [],
    "improvements": [],
    "missingKeywords": [],
    "atsSuggestions": []
  },
  "interviewTips": [],
  "importantTopics": [],
  "summary": "Candidate-specific summary"
}

CATEGORY REQUIREMENTS:
- technicalQuestions: every question category must be "technical".
- behavioralQuestions: every question category must be "behavioral".
- hrQuestions: every question category must be "hr".
- codingQuestions: every question category must be "coding".
- projectQuestions: every question category must be "project".
- scenarioQuestions: every question category must be "scenario".
- resumeQuestions: every question category must be "resume".

Every list field must be an array.
The preparation plan must have exactly seven unique days numbered 1 through 7.
Scores must be numeric values between 0 and 100.
Return valid JSON only. Do not include Markdown fences or commentary.
`;

    let lastError;

    // At most two report-generation attempts to reduce quota usage.
    // No question-count validation: question counts are dynamic.
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const retryPrompt = attempt === 1
                ? prompt
                : `${prompt}

CORRECTION:
Return a complete valid JSON report matching the required schema.
Do not use fixed question counts.
Generate all distinct relevant questions supported by the supplied resume
and job description.
Ensure each category uses its correct parent category and preparationPlan
contains exactly seven unique days numbered 1 through 7.`;

            const rawData = await generateJson(retryPrompt, {
                maxAttempts: 2,
            });

            if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
                throw new Error("Gemini returned an invalid report object.");
            }

            const normalizedData = normalizeQuestionCategories(rawData);
            const deduplicatedData = removeDuplicateQuestions(normalizedData);

            const report = interviewReportSchema.parse(deduplicatedData);

            const days = report.preparationPlan.map((item) => item.day);

            const validDays =
                days.length === 7 &&
                new Set(days).size === 7 &&
                [1, 2, 3, 4, 5, 6, 7].every((day) => days.includes(day));

            if (!validDays) {
                throw new Error(
                    "Preparation plan must contain exactly seven unique days numbered 1 through 7."
                );
            }

            const totalQuestions = [
                report.technicalQuestions,
                report.behavioralQuestions,
                report.hrQuestions,
                report.codingQuestions,
                report.projectQuestions,
                report.scenarioQuestions,
                report.resumeQuestions,
            ].reduce((total, questions) => total + questions.length, 0);

            console.log("Interview report generated successfully.");
            console.log("Total generated questions:", totalQuestions);
            console.log("Dynamic question counts:", {
                technical: report.technicalQuestions.length,
                behavioral: report.behavioralQuestions.length,
                hr: report.hrQuestions.length,
                coding: report.codingQuestions.length,
                project: report.projectQuestions.length,
                scenario: report.scenarioQuestions.length,
                resume: report.resumeQuestions.length,
            });

            return report;
        } catch (error) {
            lastError = error;

            console.error(
                `Report generation attempt ${attempt} failed:`,
                error?.message || error
            );

            if (isQuotaError(error)) {
                throw error;
            }

            // Do not retry ordinary validation errors indefinitely.
            if (attempt === 2) {
                break;
            }
        }
    }

    throw new Error(
        `Failed to generate a valid interview report. ${
            lastError?.message || ""
        }`
    );
}

// ======================================================
// 12. GENERATE PDF FROM HTML
// ======================================================

async function generatePdfFromHtml(html) {
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();

        await page.setContent(html, {
            waitUntil: "networkidle0",
        });

        return await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "15mm",
                right: "12mm",
                bottom: "15mm",
                left: "12mm",
            },
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// ======================================================
// 13. GENERATE RESUME PDF
// ======================================================

async function generateResumePdf({
    resume,
    selfDescription,
    jobDescription,
}) {
    const prompt = `
Create a professional, ATS-friendly HTML resume.

EXISTING RESUME:
${resume || "Not provided"}

CANDIDATE DESCRIPTION:
${selfDescription || "Not provided"}

TARGET JOB:
${jobDescription || "Not provided"}

Rules:
- Do not invent personal details, qualifications or experience.
- Use only supplied information.
- Do not invent a candidate name or contact details.
- Format for A4 printing.
- Return valid JSON only, without Markdown fences.

Required JSON structure:
{
  "html": "<!DOCTYPE html><html><head><style>body{font-family:Arial}</style></head><body><h1>Candidate Name</h1><p>Resume content</p></body></html>"
}
`;

    const result = await generateJson(prompt, {
        maxAttempts: 2,
    });

    if (typeof result.html !== "string" || !result.html.trim()) {
        throw new Error("Gemini did not return valid resume HTML.");
    }

    return generatePdfFromHtml(result.html);
}

// ======================================================
// 14. EXPORT FUNCTIONS
// ======================================================

module.exports = {
    generateInterviewReport,
    generateResumePdf,
};
