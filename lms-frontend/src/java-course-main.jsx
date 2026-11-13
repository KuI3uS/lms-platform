import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import JavaCourseOfferPage from "./pages/JavaCourseOfferPage.jsx";
import "./index.css";
import SiteExperience from "./context/SiteExperience.jsx";

// This public page is pre-rendered at build time. Other routes keep the
// existing application entry; cross-page links perform a document navigation.
const page = (
    <StrictMode>
        <BrowserRouter>
            <SiteExperience><AuthProvider><JavaCourseOfferPage /></AuthProvider></SiteExperience>
        </BrowserRouter>
    </StrictMode>
);

const root = document.getElementById("root");
if (import.meta.env.PROD) hydrateRoot(root, page);
else createRoot(root).render(page);
