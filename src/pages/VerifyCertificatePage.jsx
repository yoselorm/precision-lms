import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BadgeCheck, CalendarDays, Download, Loader2, Search, ShieldX } from "lucide-react";
import Header from "../components/Header";
import { verifyCertificate } from "../api/learning";

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-stone-800">{value}</p>
    </div>
  );
}

// Public "is this certificate genuine?" check — anyone (an employer, say)
// enters the code printed on a certificate. /verify/:code checks straight
// away, so the code can be shared as a link. Works signed in or out.
export default function VerifyCertificatePage({ onMenuClick }) {
  const { code: codeFromUrl } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(codeFromUrl || "");
  const [result, setResult] = useState({ status: "idle" });

  useEffect(() => {
    if (!codeFromUrl) {
      setResult({ status: "idle" });
      return;
    }
    let cancelled = false;
    setCode(codeFromUrl);
    setResult({ status: "loading" });
    verifyCertificate(codeFromUrl)
      .then((certificate) => !cancelled && setResult({ status: "valid", certificate }))
      .catch((err) => {
        if (cancelled) return;
        setResult(err.status === 404 ? { status: "invalid" } : { status: "error", message: err.message || "Couldn't check that code." });
      });
    return () => {
      cancelled = true;
    };
  }, [codeFromUrl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed) navigate(`/verify/${encodeURIComponent(trimmed)}`);
  };

  const { status, certificate } = result;

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      {onMenuClick && <Header title="Verify a certificate" subtitle="Check that an Afenet LMS certificate is genuine." onMenuClick={onMenuClick} />}

      <div className="mx-auto w-full max-w-xl space-y-5 p-4 sm:p-6 lg:p-10">
        {!onMenuClick && (
          <div className="text-center">
            <h1 className="text-xl font-black text-stone-900 sm:text-2xl">Verify a certificate</h1>
            <p className="mt-1.5 text-sm text-stone-500">Enter the verification code printed on the certificate.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 rounded-2xl border border-stone-200 bg-white p-3">
          <div className="flex flex-1 items-center gap-2 px-2">
            <Search size={16} className="shrink-0 text-stone-400" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. AFN-2026-7KQ3X"
              autoFocus={!codeFromUrl}
              className="w-full bg-transparent text-sm uppercase tracking-wide outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-stone-400"
            />
          </div>
          <button
            type="submit"
            disabled={!code.trim() || status === "loading"}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
          >
            {status === "loading" && <Loader2 size={14} className="animate-spin" />}
            Verify
          </button>
        </form>

        {status === "valid" && (
          <div className="animate-fade-in overflow-hidden rounded-2xl border border-emerald-200 bg-white">
            <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50 px-5 py-4">
              <BadgeCheck size={28} className="shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-900">This certificate is genuine</p>
                <p className="text-xs text-emerald-700">Issued through Afenet LMS · code {certificate.verification_code}</p>
              </div>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Detail label="Awarded to" value={certificate.learner_name} />
              <Detail label="Course" value={certificate.course_title} />
              <Detail label="Certificate" value={certificate.certificate_title} />
              <Detail label="Issued by" value={certificate.issuer} />
              {certificate.issued_at && (
                <div className="sm:col-span-2">
                  <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    <CalendarDays size={11} /> Issued on
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-stone-800">
                    {new Date(certificate.issued_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              )}
            </div>
            {certificate.pdf_url && (
              <div className="border-t border-stone-100 px-5 py-3">
                <a
                  href={certificate.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
                >
                  <Download size={14} /> View the certificate (PDF)
                </a>
              </div>
            )}
          </div>
        )}

        {status === "invalid" && (
          <div className="animate-fade-in flex items-start gap-3 rounded-2xl border border-rose-200 bg-white p-5">
            <ShieldX size={26} className="shrink-0 text-rose-500" />
            <div>
              <p className="text-sm font-bold text-stone-900">No certificate matches this code</p>
              <p className="mt-0.5 text-xs text-stone-500">Check the code for typos. If it's correct, the certificate may not be genuine.</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-700">{result.message}</div>
        )}
      </div>
    </div>
  );
}
