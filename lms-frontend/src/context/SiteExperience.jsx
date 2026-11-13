import { LocaleProvider } from "./LocaleContext.jsx";
import { MusicProvider } from "./MusicContext.jsx";

export default function SiteExperience({ children }) {
    return <LocaleProvider><MusicProvider>{children}</MusicProvider></LocaleProvider>;
}
