
import {
    getAllInterviewReports,
    generateInterviewReport,
    getInterviewReportById,
    generateResumePdf,
} from "../services/interview.api";

import { useContext } from "react";
import { InterviewContext } from "../interview.context";

export const useInterview = () => {
    const context = useContext(InterviewContext);

    if (!context) {
        throw new Error(
            "useInterview must be used within an InterviewProvider"
        );
    }

    const {
        loading,
        setLoading,
        report,
        setReport,
        reports,
        setReports,
    } = context;

    const generateReport = async ({
        jobDescription,
        selfDescription,
        resumeFile,
    }) => {
        setLoading(true);

        try {
            const response = await generateInterviewReport({
                jobDescription,
                selfDescription,
                resumeFile,
            });

            console.log("Generate report response:", response);

            const reportData =
                response?.interviewReport ??
                response?.data?.interviewReport ??
                response?.report ??
                response?.data?.report;

            if (!reportData) {
                throw new Error(
                    "Generated report response mein interviewReport nahi mila."
                );
            }

            setReport(reportData);
            return reportData;
        } catch (error) {
            console.error(
                "Failed to generate interview report:",
                error.response?.data || error.message
            );
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getReportById = async (id) => {
        if (!id) {
            throw new Error("Interview report ID missing.");
        }

        setLoading(true);

        try {
            const response = await getInterviewReportById(id);

            console.log("Get report by ID response:", response);

            const reportData =
                response?.interviewReport ??
                response?.data?.interviewReport ??
                response?.report ??
                response?.data?.report ??
                response?.data;

            if (!reportData || !reportData._id) {
                console.error("Invalid report data:", reportData);
                throw new Error(
                    "API response mein valid interview report nahi mila."
                );
            }

            setReport(reportData);
            return reportData;
        } catch (error) {
            console.error(
                "Failed to fetch interview report:",
                error.response?.data || error.message
            );
            setReport(null);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getReports = async () => {
        setLoading(true);

        try {
            const response = await getAllInterviewReports();

            console.log("All reports response:", response);

            const reportList =
                response?.interviewReports ??
                response?.data?.interviewReports ??
                response?.reports ??
                response?.data?.reports;

            if (!Array.isArray(reportList)) {
                throw new Error(
                    "API response mein interview reports ki array nahi mili."
                );
            }

            setReports(reportList);
            return reportList;
        } catch (error) {
            console.error(
                "Failed to fetch interview reports:",
                error.response?.data || error.message
            );
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getResumePdf = async (interviewReportId) => {
        if (!interviewReportId) {
            throw new Error("Interview report ID missing.");
        }

        setLoading(true);

        let url;

        try {
            const response = await generateResumePdf({
                interviewReportId,
            });

            const pdfBlob =
                response instanceof Blob
                    ? response
                    : new Blob([response], {
                          type: "application/pdf",
                      });

            url = window.URL.createObjectURL(pdfBlob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `resume_${interviewReportId}.pdf`;

            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error(
                "Failed to download resume PDF:",
                error.response?.data || error.message
            );
            throw error;
        } finally {
            if (url) {
                window.URL.revokeObjectURL(url);
            }

            setLoading(false);
        }
    };

    return {
        loading,
        report,
        reports,
        generateReport,
        getReportById,
        getReports,
        getResumePdf,
    };
};
