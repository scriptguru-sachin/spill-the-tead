import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "@xyflow/react/dist/style.css";
import "./styles.css";
import "./speech.css";
import "./prediction.css";
import "./topics.css";
import "./technical.css";
import "./followups.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
