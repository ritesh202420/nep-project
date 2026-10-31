
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./style.scss";
import App from "./App.jsx";
import { InterviewProvider } from "../src/features/interview/interview.context.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <InterviewProvider>
      <App />
    </InterviewProvider>
  </StrictMode>
);
