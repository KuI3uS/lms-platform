import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import JavaCourseOfferPage from "./pages/JavaCourseOfferPage.jsx";
import { JAVA_COURSE_PATH } from "./utils/javaCourseOffer.js";

export function renderJavaCourse() {
    return renderToString(
        <StrictMode>
            <MemoryRouter initialEntries={[JAVA_COURSE_PATH]}>
                <AuthProvider><JavaCourseOfferPage /></AuthProvider>
            </MemoryRouter>
        </StrictMode>
    );
}
