import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import LandingPage from "./components/LandingPage.jsx";
import "./index.css";

const page = (
  <StrictMode>
    <BrowserRouter>
      <LandingPage />
    </BrowserRouter>
  </StrictMode>
);
const root = document.getElementById("root");
if (import.meta.env.PROD) hydrateRoot(root, page);
else createRoot(root).render(page);
