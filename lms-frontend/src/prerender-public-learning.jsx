import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import SiteExperience from "./context/SiteExperience.jsx";
import PythonCourseOfferPage from "./pages/PythonCourseOfferPage.jsx";
import Inf03PublicPage from "./pages/Inf03PublicPage.jsx";
import { PYTHON_COURSE_PATH } from "./utils/pythonCourseOffer.js";
import { INF03_PATH } from "./utils/inf03Practice.js";

const renderPage = (Page, path) => renderToString(<MemoryRouter initialEntries={[path]}><SiteExperience><AuthProvider><Page /></AuthProvider></SiteExperience></MemoryRouter>);
export const renderPythonCourse = () => renderPage(PythonCourseOfferPage, PYTHON_COURSE_PATH);
export const renderInf03 = () => renderPage(Inf03PublicPage, INF03_PATH);
