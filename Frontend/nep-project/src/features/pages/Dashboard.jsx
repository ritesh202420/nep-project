
import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { useInterview } from '../interview/hook/useInterview'
import "./dashboard.scss";

const Dashboard = () => {
  const {
    loading,
    reports = [],
    getReports,
  } = useInterview();

  const navigate = useNavigate();

  useEffect(() => {
    getReports().catch((error) => {
      console.error("Unable to load dashboard reports:", error);
    });
  }, []);

  const averageScore =
    reports.length > 0
      ? Math.round(
          reports.reduce(
            (total, report) => total + (Number(report.matchScore) || 0),
            0
          ) / reports.length
        )
      : 0;

  const latestReport = reports[0];

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">YOUR INTERVIEW WORKSPACE</p>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">
            Track your interview preparation and improve your job readiness.
          </p>
        </div>

        <button
          className="dashboard-primary-btn"
          onClick={() => navigate("/Home")}
        >
          + New Interview Plan
        </button>
      </header>

      <section className="dashboard-stats">
        <article className="dashboard-stat-card">
          <span className="stat-icon">📚</span>
          <p>Total Interview Plans</p>
          <h2>{reports.length}</h2>
        </article>

        <article className="dashboard-stat-card">
          <span className="stat-icon">🎯</span>
          <p>Average Match Score</p>
          <h2>{averageScore}%</h2>
        </article>

        <article className="dashboard-stat-card">
          <span className="stat-icon">🚀</span>
          <p>Latest Plan</p>
          <h2 className="stat-latest">
            {latestReport ? "Available" : "Not created"}
          </h2>
        </article>
      </section>

      <section className="dashboard-reports">
        <div className="dashboard-section-header">
          <div>
            <h2>Recent Interview Plans</h2>
            <p>Open a report to continue your preparation.</p>
          </div>

          <button
            className="dashboard-text-btn"
            onClick={() => navigate("/Home")}
          >
            Create New
          </button>
        </div>

        {loading && reports.length === 0 ? (
          <div className="dashboard-empty">
            <p>Loading your interview plans...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="dashboard-empty">
            <span className="empty-icon">📝</span>
            <h3>No interview plans yet</h3>
            <p>
              Create your first personalized interview preparation plan.
            </p>
            <button
              className="dashboard-primary-btn"
              onClick={() => navigate("/Home")}
            >
              Create Interview Plan
            </button>
          </div>
        ) : (
          <div className="dashboard-report-list">
            {reports.map((report) => {
              const score = Number(report.matchScore) || 0;

              return (
                <article className="dashboard-report-card" key={report._id}>
                  <div className="report-card-main">
                    <div className="report-file-icon">📄</div>

                    <div className="report-card-info">
                      <h3>
                        {report.title || "Interview Preparation Plan"}
                      </h3>

                      <p>
                        Created{" "}
                        {report.createdAt
                          ? new Date(report.createdAt).toLocaleDateString()
                          : "recently"}
                      </p>
                    </div>
                  </div>

                  <div className="report-card-actions">
                    <div className="report-score">
                      <span>Match</span>
                      <strong>{score}%</strong>
                    </div>

                    <button
                      className="dashboard-open-btn"
                      onClick={() =>
                        navigate(`/interview/${report._id}`)
                      }
                    >
                      View Report →
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default Dashboard;
