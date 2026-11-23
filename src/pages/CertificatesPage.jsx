import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Award, Download, Loader2, ShieldCheck } from "lucide-react";
import Header from "../components/Header";
import { selectIssuedCertificates, selectIssuedCertificatesStatus } from "../store/slices/certificatesSlice";
import { usePageData } from "../hooks/usePageData";
import { loadMyCertificates } from "../store/loadAppData";
import { shortDate } from "../utils/time";

// The learner's certificates as issued by the server — each with its PDF
// and a verification code anyone can check on the Verify page.
export default function CertificatesPage({ onMenuClick }) {
  usePageData(loadMyCertificates);
  const certificates = useSelector(selectIssuedCertificates);
  const status = useSelector(selectIssuedCertificatesStatus);

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-stone-50">
      <Header title="My Certificates" subtitle="Earned once you complete a course that has a certificate enabled." onMenuClick={onMenuClick} />

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 lg:p-8">
        {certificates.map((cert) => (
          <div key={cert.id} className="flex flex-col rounded-2xl border border-stone-200 bg-white p-5">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
              <Award size={22} className="text-amber-500" />
            </div>
            <h3 className="text-sm font-bold leading-snug text-stone-900">{cert.title}</h3>
            {cert.courseTitle && <p className="mt-0.5 text-xs text-stone-600">{cert.courseTitle}</p>}
            <p className="mt-1 text-xs text-stone-500">
              Issued {shortDate(cert.issuedAt)}
              {cert.issuer && ` · ${cert.issuer}`}
            </p>
            {cert.code && (
              <p className="mt-2 w-fit rounded-md bg-stone-50 px-2 py-1 font-mono text-[11px] tracking-wide text-stone-600" title="Verification code">
                {cert.code}
              </p>
            )}
            <div className="mt-auto flex gap-2 pt-4">
              {cert.pdfUrl ? (
                <a
                  href={cert.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
                >
                  <Download size={13} /> Download PDF
                </a>
              ) : (
                <span className="flex flex-1 items-center justify-center rounded-lg bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-400">PDF not ready yet</span>
              )}
              {cert.code && (
                <Link
                  to={`/verify/${encodeURIComponent(cert.code)}`}
                  title="Open the public verification page"
                  className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                >
                  <ShieldCheck size={13} /> Verify
                </Link>
              )}
            </div>
          </div>
        ))}

        {certificates.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-stone-400">
            {status === "loading" || status === "idle" ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Loading your certificates...
              </>
            ) : status === "failed" ? (
              "Couldn't load your certificates. Refresh the page to try again."
            ) : (
              "No certificates yet — complete a course with a certificate enabled to see it here."
            )}
          </p>
        )}
      </div>
    </div>
  );
}
