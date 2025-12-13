import React from "react";
import ReactDOM from "react-dom/client";
import Home from "./pages/Home.jsx";  // pages 폴더 안으로 경로 변경
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>,
);