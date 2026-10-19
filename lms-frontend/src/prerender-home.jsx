import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "./components/LandingPage.jsx";

export function renderHome() {
  return renderToString(
    <StrictMode>
      <MemoryRouter initialEntries={["/"]}>
        <LandingPage />
      </MemoryRouter>
    </StrictMode>,
  );
}
