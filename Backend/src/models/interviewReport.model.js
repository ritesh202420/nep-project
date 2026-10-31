
const mongoose = require("mongoose");

// ==================================================
// REUSABLE QUESTION SCHEMA
// ==================================================

const questionSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: [true, "Question is required"],
            trim: true,
        },

        intention: {
            type: String,
            required: [true, "Question intention is required"],
            trim: true,
        },

        answer: {
            type: String,
            required: [true, "Sample answer is required"],
            trim: true,
        },

        category: {
            type: String,
            enum: [
                "technical",
                "behavioral",
                "hr",
                "coding",
                "project",
                "scenario",
                "resume",
                "other",
            ],
            default: "other",
        },

        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "medium",
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },

        followUpQuestions: {
            type: [String],
            default: [],
        },

        evaluationCriteria: {
            type: [String],
            default: [],
        },
    },
    { _id: false }
);

// ==================================================
// SKILL GAP SCHEMA
// ==================================================

const skillGapSchema = new mongoose.Schema(
    {
        skill: {
            type: String,
            required: [true, "Skill is required"],
            trim: true,
        },

        severity: {
            type: String,
            enum: ["low", "medium", "high"],
            required: [true, "Severity is required"],
        },

        explanation: {
            type: String,
            default: "",
        },

        recommendation: {
            type: String,
            default: "",
        },

        practiceTasks: {
            type: [String],
            default: [],
        },
    },
    { _id: false }
);

// ==================================================
// PREPARATION PLAN SCHEMA
// ==================================================

const preparationPlanSchema = new mongoose.Schema(
    {
        day: {
            type: Number,
            required: [true, "Day is required"],
            min: 1,
        },

        focus: {
            type: String,
            required: [true, "Focus is required"],
            trim: true,
        },

        tasks: {
            type: [String],
            default: [],
        },

        estimatedHours: {
            type: Number,
            min: 0,
            default: 1,
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },

        completed: {
            type: Boolean,
            default: false,
        },
    },
    { _id: false }
);

// ==================================================
// MATCH ANALYSIS SCHEMA
// ==================================================

const matchAnalysisSchema = new mongoose.Schema(
    {
        matchingSkills: {
            type: [String],
            default: [],
        },

        missingSkills: {
            type: [String],
            default: [],
        },

        matchingRequirements: {
            type: [String],
            default: [],
        },

        missingRequirements: {
            type: [String],
            default: [],
        },

        strengths: {
            type: [String],
            default: [],
        },

        concerns: {
            type: [String],
            default: [],
        },

        explanation: {
            type: String,
            default: "",
        },
    },
    { _id: false }
);

// ==================================================
// READINESS SCORES SCHEMA
// ==================================================

const readinessSchema = new mongoose.Schema(
    {
        technical: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        project: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        communication: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        overall: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        explanation: {
            type: String,
            default: "",
        },
    },
    { _id: false }
);

// ==================================================
// RESUME FEEDBACK SCHEMA
// ==================================================

const resumeFeedbackSchema = new mongoose.Schema(
    {
        strengths: {
            type: [String],
            default: [],
        },

        improvements: {
            type: [String],
            default: [],
        },

        missingKeywords: {
            type: [String],
            default: [],
        },

        atsSuggestions: {
            type: [String],
            default: [],
        },
    },
    { _id: false }
);

// ==================================================
// MAIN INTERVIEW REPORT SCHEMA
// ==================================================

const interviewReportSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Job title is required"],
            trim: true,
        },

        jobDescription: {
            type: String,
            required: [true, "Job description is required"],
        },

        resume: {
            type: String,
            default: "",
        },

        selfDescription: {
            type: String,
            default: "",
        },

        // Overall job/resume compatibility estimate
        matchScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        // Preserve existing frontend-compatible fields
        technicalQuestions: {
            type: [questionSchema],
            default: [],
        },

        behavioralQuestions: {
            type: [questionSchema],
            default: [],
        },

        // Additional dynamically generated question categories
        hrQuestions: {
            type: [questionSchema],
            default: [],
        },

        codingQuestions: {
            type: [questionSchema],
            default: [],
        },

        projectQuestions: {
            type: [questionSchema],
            default: [],
        },

        scenarioQuestions: {
            type: [questionSchema],
            default: [],
        },

        resumeQuestions: {
            type: [questionSchema],
            default: [],
        },

        skillGaps: {
            type: [skillGapSchema],
            default: [],
        },

        preparationPlan: {
            type: [preparationPlanSchema],
            default: [],
        },

        matchAnalysis: {
            type: matchAnalysisSchema,
            default: () => ({}),
        },

        readinessScores: {
            type: readinessSchema,
            default: () => ({}),
        },

        resumeFeedback: {
            type: resumeFeedbackSchema,
            default: () => ({}),
        },

        interviewTips: {
            type: [String],
            default: [],
        },

        importantTopics: {
            type: [String],
            default: [],
        },

        summary: {
            type: String,
            default: "",
        },

        // Track preparation progress
        preparationProgress: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        // Link report to its owner
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// ==================================================
// MODEL EXPORT
// ==================================================

const interviewReportModel =
    mongoose.models.InterviewReport ||
    mongoose.model("InterviewReport", interviewReportSchema);

module.exports = interviewReportModel;
