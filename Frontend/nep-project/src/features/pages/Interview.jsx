import React, { useState, useEffect } from "react";
import "./interview.scss";
import { useInterview } from "../interview/hook/useInterview";
import { useNavigate, useParams } from "react-router";

const NAV_ITEMS = [
    { id: "technical", label: "Technical Questions" },
    { id: "behavioral", label: "Behavioral Questions" },
    { id: "hr", label: "HR Questions" },
    { id: "coding", label: "Coding Questions" },
    { id: "project", label: "Project Questions" },
    { id: "scenario", label: "Scenario Questions" },
    { id: "resume", label: "Resume Questions" },
    { id: "roadmap", label: "Road Map" },
];

const QUESTION_KEYS = {
    technical: "technicalQuestions",
    behavioral: "behavioralQuestions",
    hr: "hrQuestions",
    coding: "codingQuestions",
    project: "projectQuestions",
    scenario: "scenarioQuestions",
    resume: "resumeQuestions",
};

const QuestionCard = ({ item, index }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="q-card">
            <div
                className="q-card__header"
                onClick={() => setOpen((previous) => !previous)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setOpen((previous) => !previous);
                    }
                }}
            >
                <span className="q-card__index">Q{index + 1}</span>
                <p className="q-card__question">{item.question}</p>
                <span
                    className={`q-card__chevron ${
                        open ? "q-card__chevron--open" : ""
                    }`}
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </span>
            </div>

            {open && (
                <div className="q-card__body">
                    <div className="q-card__section">
                        <span className="q-card__tag q-card__tag--intention">
                            Intention
                        </span>
                        <p>{item.intention || "No intention provided."}</p>
                    </div>

                    <div className="q-card__section">
                        <span className="q-card__tag q-card__tag--answer">
                            Model Answer
                        </span>
                        <p>{item.answer || "No sample answer provided."}</p>
                    </div>

                    {item.difficulty && (
                        <p>
                            <strong>Difficulty:</strong> {item.difficulty}
                        </p>
                    )}

                    {item.priority && (
                        <p>
                            <strong>Priority:</strong> {item.priority}
                        </p>
                    )}

                    {Array.isArray(item.followUpQuestions) &&
                        item.followUpQuestions.length > 0 && (
                            <div className="q-card__section">
                                <strong>Follow-up Questions</strong>
                                <ul>
                                    {item.followUpQuestions.map((question, i) => (
                                        <li key={i}>{question}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                    {Array.isArray(item.evaluationCriteria) &&
                        item.evaluationCriteria.length > 0 && (
                            <div className="q-card__section">
                                <strong>Evaluation Criteria</strong>
                                <ul>
                                    {item.evaluationCriteria.map((criteria, i) => (
                                        <li key={i}>{criteria}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                </div>
            )}
        </div>
    );
};

const RoadMapDay = ({ day }) => (
    <div className="roadmap-day">
        <div className="roadmap-day__header">
            <span className="roadmap-day__badge">Day {day.day}</span>
            <h3 className="roadmap-day__focus">{day.focus}</h3>
        </div>

        <ul className="roadmap-day__tasks">
            {(Array.isArray(day.tasks) ? day.tasks : []).map((task, index) => (
                <li key={index}>
                    <span className="roadmap-day__bullet" />
                    {task}
                </li>
            ))}
        </ul>
    </div>
);

const Interview = () => {
    const [activeNav, setActiveNav] = useState("technical");
    const [pageLoading, setPageLoading] = useState(true);
    const [pageError, setPageError] = useState("");

    const { report, getReportById, getResumePdf } = useInterview();
    const { interviewId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        const loadReport = async () => {
            if (!interviewId) {
                setPageError("Interview report ID URL mein nahi mila.");
                setPageLoading(false);
                return;
            }

            setPageLoading(true);
            setPageError("");

            try {
                await getReportById(interviewId);
            } catch (error) {
                console.error(
                    "Interview report load failed:",
                    error.response?.data || error.message
                );

                if (!cancelled) {
                    setPageError(
                        error.response?.data?.message ||
                        "Interview report load nahi hua. Please dobara try karo."
                    );
                }
            } finally {
                if (!cancelled) {
                    setPageLoading(false);
                }
            }
        };

        loadReport();

        return () => {
            cancelled = true;
        };
    }, [interviewId]);

    if (pageLoading) {
        return (
            <main className="loading-screen">
                <h1>Loading your interview plan...</h1>
                <p>Please wait while your report loads.</p>
            </main>
        );
    }

    if (pageError) {
        return (
            <main className="loading-screen">
                <h1>Unable to load interview plan</h1>
                <p>{pageError}</p>

                <button
                    className="button primary-button"
                    onClick={() => window.location.reload()}
                >
                    Try Again
                </button>

                <button
                    className="button"
                    onClick={() => navigate("/dashboard")}
                >
                    Back to Dashboard
                </button>
            </main>
        );
    }

    if (!report) {
        return (
            <main className="loading-screen">
                <h1>Interview report not found</h1>
                <button
                    className="button primary-button"
                    onClick={() => navigate("/dashboard")}
                >
                    Back to Dashboard
                </button>
            </main>
        );
    }

    const preparationPlan = Array.isArray(report.preparationPlan)
        ? report.preparationPlan
        : [];

    const skillGaps = Array.isArray(report.skillGaps)
        ? report.skillGaps
        : [];

    const matchScore = Number(report.matchScore) || 0;

    const scoreColor =
        matchScore >= 80
            ? "score--high"
            : matchScore >= 60
                ? "score--mid"
                : "score--low";

    const getQuestions = (navId) => {
        const key = QUESTION_KEYS[navId];
        return key && Array.isArray(report[key]) ? report[key] : [];
    };

    return (
        <div className="interview-page">
            <div className="interview-layout">
                <nav className="interview-nav">
                    <div className="nav-content">
                        <p className="interview-nav__label">Sections</p>

                        {NAV_ITEMS.map((item) => {
                            const count = QUESTION_KEYS[item.id]
                                ? getQuestions(item.id).length
                                : null;

                            return (
                                <button
                                    key={item.id}
                                    className={`interview-nav__item ${
                                        activeNav === item.id
                                            ? "interview-nav__item--active"
                                            : ""
                                    }`}
                                    onClick={() => setActiveNav(item.id)}
                                >
                                    <span>{item.label}</span>
                                    {count !== null && (
                                        <span className="content-header__count">
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={async () => {
                            try {
                                await getResumePdf(interviewId);
                            } catch (error) {
                                console.error("Resume download failed:", error);
                                alert(
                                    "Resume download nahi hua. Please dobara try karo."
                                );
                            }
                        }}
                        className="button primary-button"
                    >
                        Download Resume
                    </button>
                </nav>

                <div className="interview-divider" />

                <main className="interview-content">
                    {QUESTION_KEYS[activeNav] && (
                        <section>
                            <div className="content-header">
                                <h2>
                                    {NAV_ITEMS.find(
                                        (item) => item.id === activeNav
                                    )?.label}
                                </h2>

                                <span className="content-header__count">
                                    {getQuestions(activeNav).length} questions
                                </span>
                            </div>

                            <div className="q-list">
                                {getQuestions(activeNav).length > 0 ? (
                                    getQuestions(activeNav).map(
                                        (question, index) => (
                                            <QuestionCard
                                                key={`${activeNav}-${index}`}
                                                item={question}
                                                index={index}
                                            />
                                        )
                                    )
                                ) : (
                                    <p>
                                        Is category mein questions available
                                        nahi hain. Report generate karte waqt
                                        backend response check karo.
                                    </p>
                                )}
                            </div>
                        </section>
                    )}

                    {activeNav === "roadmap" && (
                        <section>
                            <div className="content-header">
                                <h2>Preparation Road Map</h2>
                                <span className="content-header__count">
                                    {preparationPlan.length}-day plan
                                </span>
                            </div>

                            <div className="roadmap-list">
                                {preparationPlan.map((day) => (
                                    <RoadMapDay key={day.day} day={day} />
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                <div className="interview-divider" />

                <aside className="interview-sidebar">
                    <div className="match-score">
                        <p className="match-score__label">Match Score</p>

                        <div className={`match-score__ring ${scoreColor}`}>
                            <span className="match-score__value">
                                {matchScore}
                            </span>
                            <span className="match-score__pct">%</span>
                        </div>

                        <p className="match-score__sub">
                            {matchScore >= 80
                                ? "Strong match for this role"
                                : matchScore >= 60
                                    ? "Moderate match for this role"
                                    : "More preparation recommended"}
                        </p>
                    </div>

                    <div className="sidebar-divider" />

                    <div className="skill-gaps">
                        <p className="skill-gaps__label">Skill Gaps</p>

                        <div className="skill-gaps__list">
                            {skillGaps.length > 0 ? (
                                skillGaps.map((gap, index) => (
                                    <span
                                        key={index}
                                        className={`skill-tag skill-tag--${
                                            gap.severity || "medium"
                                        }`}
                                    >
                                        {gap.skill}
                                    </span>
                                ))
                            ) : (
                                <p>No skill gaps listed.</p>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Interview;