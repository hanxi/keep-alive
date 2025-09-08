import React from "react";
import { createRoot } from "react-dom/client";
import MainApp from "./MainApp";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<MainApp />);
