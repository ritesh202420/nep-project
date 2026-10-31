
const { PDFParse } = require("pdf-parse");

const {
    generateInterviewReport,
} = require("../services/ai.sevices");

const interviewReportModel = require("../models/interviewReport.model");

// ==================================================
// GENERATE INTERVIEW REPORT
// ==================================================

async function generateInterviewReportController(req, res) {
    let parser;

    try {
        const resumeFile = req.file;
        const selfDescription =
            typeof req.body.selfDescription === "string"
                ? req.body.selfDescription.trim()
                : "";

        const jobDescription =
            typeof req.body.jobDescription === "string"
                ? req.body.jobDescription.trim()
                : "";

        // Validate authenticated user
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                message: "Please log in to generate a report.",
            });
        }

        // Resume is required for resume-based analysis
        if (!resumeFile) {
            return res.status(400).json({
                message: "Please upload your resume as a PDF.",
            });
        }

        // Validate PDF file
        if (
            resumeFile.mimetype !== "application/pdf" ||
            !resumeFile.buffer
        ) {
            return res.status(400).json({
                message: "Please upload a valid PDF resume.",
            });
        }

        // Validate job description
        if (!jobDescription) {
            return res.status(400).json({
                message: "Job description is required.",
            });
        }

        // Self-description is optional because resume is provided.
        // Extract text from resume PDF.
        parser = new PDFParse({
            data: resumeFile.buffer,
        });

        const pdfResult = await parser.getText();

        const resumeText =
            typeof pdfResult.text === "string"
                ? pdfResult.text.trim()
                : "";

        if (!resumeText) {
            return res.status(400).json({
                message:
                    "Could not extract text from this PDF. Upload a text-based PDF resume.",
            });
        }

        if (resumeText.length < 30) {
            return res.status(400).json({
                message:
                    "The resume contains too little readable text. Please upload a clearer PDF.",
            });
        }

        // Generate the complete personalized AI report.
        // The AI service should return dynamic questions, match analysis,
        // skill gaps and a personalized preparation plan.
        const aiReport = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription,
        });

        if (!aiReport || typeof aiReport !== "object") {
            throw new Error(
                "AI did not return a valid interview report."
            );
        }

        // Save the report to MongoDB.
        // Fields returned by AI must also be supported by the model schema.
        const reportData = {
            ...aiReport,
            user: req.user._id,
            selfDescription,
            jobDescription,
            resume: resumeText,
            title:
                typeof aiReport.title === "string" &&
                aiReport.title.trim()
                    ? aiReport.title.trim()
                    : "Interview Preparation Report",
        };

        const interviewReport =
            await interviewReportModel.create(reportData);

        return res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport,
        });
    } catch (error) {
        console.error(
            "Generate interview report error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to generate interview report.",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "An unexpected error occurred. Please try again.",
        });
    } finally {
        if (parser) {
            try {
                await parser.destroy();
            } catch (cleanupError) {
                console.error(
                    "PDF parser cleanup error:",
                    cleanupError.message
                );
            }
        }
    }
}

// ==================================================
// GET ALL REPORTS FOR LOGGED-IN USER
// ==================================================

async function getAllInterviewReportsController(req, res) {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                message: "Please log in first.",
            });
        }

        const reports = await interviewReportModel
            .find({
                user: req.user._id,
            })
            .select("-resume")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            message: "Interview reports fetched successfully.",
            count: reports.length,
            reports,
        });
    } catch (error) {
        console.error(
            "Fetch interview reports error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch interview reports.",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "An unexpected error occurred.",
        });
    }
}

// ==================================================
// GET ONE REPORT BY ID
// ==================================================

async function getInterviewReportByIdController(req, res) {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                message: "Please log in first.",
            });
        }

        const interviewId = req.params.interviewId;

        if (
            !/^[a-fA-F0-9]{24}$/.test(interviewId)
        ) {
            return res.status(400).json({
                message: "Invalid interview report ID.",
            });
        }

        const report = await interviewReportModel
            .findOne({
                _id: interviewId,
                user: req.user._id,
            })
            .select("-resume")
            .lean();

        if (!report) {
            return res.status(404).json({
                message: "Interview report not found.",
            });
        }

        return res.status(200).json({
            message: "Interview report fetched successfully.",
            report,
        });
    } catch (error) {
        console.error(
            "Fetch interview report error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch interview report.",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "An unexpected error occurred.",
        });
    }
}

// ==================================================
// EXPORT CONTROLLERS
// ==================================================

module.exports = {
    generateInterviewReportController,
    getAllInterviewReportsController,
    getInterviewReportByIdController,
};
