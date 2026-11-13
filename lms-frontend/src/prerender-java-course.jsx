import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import JavaCourseOfferPage from "./pages/JavaCourseOfferPage.jsx";
import { JAVA_COURSE_PATH } from "./utils/javaCourseOffer.js";
import SiteExperience from "./context/SiteExperience.jsx";

export function renderJavaCourse() {
    return renderToString(
        <StrictMode>
            <MemoryRouter initialEntries={[JAVA_COURSE_PATH]}>
                <SiteExperience><AuthProvider><JavaCourseOfferPage /></AuthProvider></SiteExperience>
            </MemoryRouter>
        </StrictMode>
    );
}
