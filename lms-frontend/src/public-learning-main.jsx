import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import SiteExperience from "./context/SiteExperience.jsx";
import PythonCourseOfferPage from "./pages/PythonCourseOfferPage.jsx";
import Inf03PublicPage from "./pages/Inf03PublicPage.jsx";
import "./index.css";

const content = window.location.pathname.includes("python-ai") ? <PythonCourseOfferPage /> : <Inf03PublicPage />;
const page = <StrictMode><BrowserRouter><SiteExperience><AuthProvider>{content}</AuthProvider></SiteExperience></BrowserRouter></StrictMode>;
const root = document.getElementById("root");
if (import.meta.env.PROD) hydrateRoot(root, page);
else createRoot(root).render(page);
