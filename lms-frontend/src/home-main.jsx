import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import LandingPage from "./components/LandingPage.jsx";
import "./index.css";
import SiteExperience from "./context/SiteExperience.jsx";

const page = (
  <StrictMode>
    <BrowserRouter>
      <SiteExperience><LandingPage /></SiteExperience>
    </BrowserRouter>
  </StrictMode>
);
const root = document.getElementById("root");
if (import.meta.env.PROD) hydrateRoot(root, page);
else createRoot(root).render(page);
