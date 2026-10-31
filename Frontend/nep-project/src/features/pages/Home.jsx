
import React, { useState, useRef } from "react";
import "./Home.scss";
import { useInterview } from "../interview/hook/useInterview";
import { useAuth } from "../auth/hooks/useAuth";
import { useNavigate } from "react-router";

const Home = () => {
  const { loading, generateReport, reports = [] } = useInterview();
  const { handleLogout } = useAuth();

  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [selectedResume, setSelectedResume] = useState(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);

  const resumeInputRef = useRef(null);
  const navigate = useNavigate();

  // Resume upload validation
  const handleResumeChange = (e) => {
    const file = e.target.files?.[0] || null;

    setError("");
    setSuccessMessage("");

    if (!file) {
      setSelectedResume(null);
      return;
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setSelectedResume(null);
      e.target.value = "";
      setError("Please upload a PDF resume.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSelectedResume(null);
      e.target.value = "";
      setError("Resume file size must be less than 5MB.");
      return;
    }

    setSelectedResume(file);
  };

  // Generate interview report
  const handleGenerateReport = async () => {
    setError("");
    setSuccessMessage("");

    if (!jobDescription.trim()) {
      setError("Please enter the job description.");
      return;
    }

    if (!selectedResume && !selfDescription.trim()) {
      setError(
        "Please upload your resume or enter your self-description."
      );
      return;
    }

    try {
      const data = await generateReport({
        jobDescription,
        selfDescription,
        resumeFile: selectedResume,
      });

      const reportId =
        data?.interviewReport?._id || data?._id;

      if (!reportId) {
        setError(
          "Report ID was not returned. Please check your useInterview hook."
        );
        return;
      }

      navigate(`/interview/${reportId}`);
    } catch (err) {
      console.error("Generate report error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to generate interview report. Please try again."
      );
    }
  };

  // Logout
  const handleLogoutClick = async () => {
    setError("");
    setSuccessMessage("");
    setLogoutLoading(true);

    try {
      const data = await handleLogout();

      // Show success message on Home page
      setSuccessMessage(
        data?.message || "Logout successful!"
      );
    } catch (err) {
      console.error("Logout error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Logout failed. Please try again."
      );
    } finally {
      setLogoutLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="loading-screen">
        <h1>Loading your interview plan...</h1>
      </main>
    );
  }

  return (
    <div className="home-page">
      {/* Header and Logout */}
      <header className="page-header">
        <div className="home-header-top">
          <div className="home-header-content">
            <h1>
              Create Your{" "}
              <span className="highlight">Interview Plan</span>
            </h1>

            <p>
              Let our AI analyze the job requirements and your
              unique profile to build a winning strategy.
            </p>
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={handleLogoutClick}
            disabled={logoutLoading}
          >
            {logoutLoading ? "Logging out..." : "Logout"}
          </button>
        </div>
      </header>

      {/* Logout success message */}
      {successMessage && (
        <div className="success-message" role="status">
          ✅ {successMessage}
        </div>
      )}

      {/* Main interview form */}
      <div className="interview-card">
        <div className="interview-card__body">
          {/* Job description */}
          <div className="panel panel--left">
            <div className="panel__header">
              <span className="panel__icon">💼</span>
              <h2>Target Job Description</h2>
              <span className="badge badge--required">
                Required
              </span>
            </div>

            <textarea
              value={jobDescription}
              onChange={(e) =>
                setJobDescription(e.target.value)
              }
              className="panel__textarea"
              placeholder="Paste the full job description here..."
              maxLength={5000}
            />

            <div className="char-counter">
              {jobDescription.length} / 5000 chars
            </div>
          </div>

          <div className="panel-divider" />

          {/* User profile */}
          <div className="panel panel--right">
            <div className="panel__header">
              <span className="panel__icon">👤</span>
              <h2>Your Profile</h2>
            </div>

            {/* Resume upload */}
            <div className="upload-section">
              <label
                className="section-label"
                htmlFor="resume"
              >
                Upload Resume{" "}
                <span className="badge badge--best">
                  Best Results
                </span>
              </label>

              <label className="dropzone" htmlFor="resume">
                <span className="dropzone__icon">📄</span>

                <p className="dropzone__title">
                  Click to upload your resume
                </p>

                <p className="dropzone__subtitle">
                  PDF only (Max 5MB)
                </p>

                <input
                  ref={resumeInputRef}
                  hidden
                  type="file"
                  id="resume"
                  name="resume"
                  accept=".pdf,application/pdf"
                  onChange={handleResumeChange}
                />
              </label>

              {selectedResume && (
                <div className="selected-file">
                  <span aria-hidden="true">📎</span>

                  <span className="selected-file__name">
                    {selectedResume.name}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedResume(null);

                      if (resumeInputRef.current) {
                        resumeInputRef.current.value = "";
                      }
                    }}
                    aria-label="Remove selected resume"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="or-divider">
              <span>OR</span>
            </div>

            {/* Self-description */}
            <div className="self-description">
              <label
                className="section-label"
                htmlFor="selfDescription"
              >
                Quick Self-Description
              </label>

              <textarea
                value={selfDescription}
                onChange={(e) =>
                  setSelfDescription(e.target.value)
                }
                id="selfDescription"
                name="selfDescription"
                className="panel__textarea panel__textarea--short"
                placeholder="Describe your experience, skills, education, and projects..."
              />
            </div>

            <div className="info-box">
              <span className="info-box__icon">ℹ️</span>

              <p>
                Enter a job description and provide either a resume
                or a self-description to generate your personalized plan.
              </p>
            </div>
          </div>
        </div>

        {/* Generate button */}
        <div className="interview-card__footer">
          <span className="footer-info">
            AI-Powered Strategy Generation
          </span>

          <button
            type="button"
            onClick={handleGenerateReport}
            className="generate-btn"
            disabled={loading}
          >
            ✨ Generate My Interview Strategy
          </button>
        </div>

        {/* Error message */}
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
      </div>

      {/* Recent reports */}
      {reports.length > 0 && (
        <section className="recent-reports">
          <h2>My Recent Interview Plans</h2>

          <ul className="reports-list">
            {reports.map((report) => (
              <li
                key={report._id}
                className="report-item"
                role="button"
                tabIndex={0}
                onClick={() =>
                  navigate(`/interview/${report._id}`)
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" ||
                    e.key === " "
                  ) {
                    e.preventDefault();
                    navigate(`/interview/${report._id}`);
                  }
                }}
              >
                <h3>
                  {report.title || "Untitled Position"}
                </h3>

                <p className="report-meta">
                  Generated on{" "}
                  {report.createdAt
                    ? new Date(
                        report.createdAt
                      ).toLocaleDateString()
                    : "Date unavailable"}
                </p>

                <p
                  className={`match-score ${
                    report.matchScore >= 80
                      ? "score--high"
                      : report.matchScore >= 60
                      ? "score--mid"
                      : "score--low"
                  }`}
                >
                  Match Score: {report.matchScore ?? 0}%
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Footer */}
      <footer className="page-footer">
        <a href="#privacy">Privacy Policy</a>
        <a href="#terms">Terms of Service</a>
        <a href="#help">Help Center</a>
      </footer>
    </div>
  );
};

export default Home;
