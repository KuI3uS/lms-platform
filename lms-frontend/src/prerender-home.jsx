import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "./components/LandingPage.jsx";
import SiteExperience from "./context/SiteExperience.jsx";

export function renderHome() {
  return renderToString(
    <StrictMode>
      <MemoryRouter initialEntries={["/"]}>
        <SiteExperience><LandingPage /></SiteExperience>
      </MemoryRouter>
    </StrictMode>,
  );
}
