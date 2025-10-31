import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import App from "./App.jsx";
import "./index.css";

const API_URL = import.meta.env.VITE_API_URL || 'https://eduva-lms.onrender.com';

console.log('🔧 Using API URL:', API_URL);
console.log('🔧 VITE_API_URL env var:', import.meta.env.VITE_API_URL);
console.log('🔧 All env vars:', import.meta.env);

axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);