import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BsArrowLeft, BsAwardFill, BsPrinterFill, BsShieldCheck } from "react-icons/bs";
import { apiFetch } from "../api/api";

export default function CertificatePage() {
    const { certificateNumber } = useParams();
    const navigate = useNavigate();
    const [certificate, setCertificate] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        apiFetch(`/certificates/verify/${certificateNumber}`)
            .then(setCertificate)
            .catch((loadError) => setError(loadError.message || "Nie znaleziono certyfikatu."));
    }, [certificateNumber]);

    if (!certificate) {
        return (
            <div className="flex min-h-[55vh] items-center justify-center text-white">
                {error || <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />}
            </div>
        );
    }

    return (
        <div className="certificate-page mx-auto max-w-5xl text-white">
            <div className="certificate-controls mb-6 flex flex-wrap justify-between gap-3">
                <button
                    type="button"
                    onClick={() => navigate("/learning-center")}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 font-bold text-slate-300"
                >
                    <BsArrowLeft /> Wróć
                </button>
                <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 font-black text-slate-950"
                >
                    <BsPrinterFill /> Drukuj / zapisz PDF
                </button>
            </div>

            <article className="certificate-sheet relative overflow-hidden rounded-[36px] border-[10px] border-amber-400/30 bg-[#fcfaf2] px-8 py-14 text-center text-slate-900 shadow-2xl sm:px-16 sm:py-20">
                <div className="absolute inset-4 rounded-[24px] border border-amber-600/30" />
                <div className="relative">
                    <BsAwardFill className="mx-auto text-6xl text-amber-600" />
                    <p className="mt-7 text-sm font-black uppercase tracking-[0.45em] text-amber-700">EduHub Certificate</p>
                    <h1 className="mt-5 font-serif text-4xl font-black sm:text-6xl">Certyfikat ukończenia</h1>
                    <p className="mt-8 text-lg text-slate-600">Niniejszym potwierdzamy, że</p>
                    <p className="mt-3 font-serif text-3xl font-black sm:text-5xl">{certificate.studentName}</p>
                    <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-600">
                        ukończył(a) wszystkie lekcje i zadania kursu
                    </p>
                    <h2 className="mt-3 text-2xl font-black text-amber-800 sm:text-4xl">{certificate.courseTitle}</h2>

                    <div className="mx-auto mt-12 grid max-w-2xl gap-6 border-t border-amber-700/20 pt-8 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Data wystawienia</p>
                            <p className="mt-2 font-black">{new Date(certificate.issuedAt).toLocaleDateString("pl-PL")}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Numer certyfikatu</p>
                            <p className="mt-2 font-mono font-black">{certificate.certificateNumber}</p>
                        </div>
                    </div>

                    <p className="mt-10 inline-flex items-center gap-2 text-xs font-bold text-emerald-700">
                        <BsShieldCheck /> Certyfikat możliwy do zweryfikowania w systemie EduHub
                    </p>
                </div>
            </article>
        </div>
    );
}
