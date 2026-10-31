
const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const interviewController = require("../controllers/interview.Controller");
const upload = require("../middlewares/file.middleware");

const interviewRouter = express.Router();

// Generate interview report
interviewRouter.post(
  "/",
  authMiddleware.authUser,
  upload.single("resume"),
  interviewController.generateInterviewReportController
);

// Fetch all interview reports
interviewRouter.get(
  "/",
  authMiddleware.authUser,
  interviewController.getAllInterviewReportsController
);

// Fetch one interview report by ID
interviewRouter.get(
  "/report/:interviewId",
  authMiddleware.authUser,
  interviewController.getInterviewReportByIdController
);

module.exports = interviewRouter;
