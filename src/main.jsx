import React from "react";
import ReactDOM from "react-dom/client";
import * as am5 from "@amcharts/amcharts5";
import App from "./App";
import "./index.css";

am5.addLicense("AM5C-7088-9990-9365-5562");

ReactDOM.createRoot(document.getElementById("root")).render(
  <App />
);
