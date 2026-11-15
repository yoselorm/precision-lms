import { createSlice } from "@reduxjs/toolkit";
import * as api from "../../api/learning";
import { normalizeCertificate, templateToApi } from "../../api/normalize";
import { apiThunk, listThunk } from "../apiThunk";
import { logout } from "./authSlice";

const initialState = {
  // Admin-managed certificate templates, each optionally linked to a course.
  certificates: [],
  status: "idle",
};

export const fetchCertificates = listThunk("certificates/fetch", () => api.listCertificates());

const certificateToApi = ({ courseId, title, issuer, signatoryName, signatoryTitle, template }) => ({
  course_id: courseId || null,
  title,
  issuer: issuer || "Learning & Development",
  signatory_name: signatoryName || null,
  signatory_title: signatoryTitle || null,
  template: templateToApi(template),
});

// Creates the course's certificate, or updates it if it already has one.
// Fields passed are merged into the existing certificate.
export const saveCourseCertificate = apiThunk("certificates/save", async ({ courseId, certificate }, { getState }) => {
  const existing = getState().certificates.certificates.find((c) => c.courseId === courseId);
  const merged = { ...existing, ...certificate, courseId };
  return existing ? api.updateCertificate(existing.id, certificateToApi(merged)) : api.createCertificate(certificateToApi(merged));
});

export const deleteCourseCertificate = apiThunk("certificates/delete", async ({ courseId }, { getState }) => {
  const existing = getState().certificates.certificates.find((c) => c.courseId === courseId);
  if (existing) await api.deleteCertificate(existing.id);
  return { courseId };
});

const certificatesSlice = createSlice({
  name: "certificates",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCertificates.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCertificates.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.certificates = action.payload.map(normalizeCertificate);
      })
      .addCase(fetchCertificates.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(saveCourseCertificate.fulfilled, (state, action) => {
        const cert = normalizeCertificate(action.payload);
        state.certificates = [...state.certificates.filter((c) => c.id !== cert.id), cert];
      })
      .addCase(deleteCourseCertificate.fulfilled, (state, action) => {
        state.certificates = state.certificates.filter((c) => c.courseId !== action.payload.courseId);
      })
      .addCase(logout, () => initialState);
  },
});

export default certificatesSlice.reducer;

export const selectAllCertificates = (state) => state.certificates.certificates;
export const selectCertificateForCourse = (state, courseId) =>
  state.certificates.certificates.find((c) => c.courseId === courseId) || null;

// Pages written around `course.certificate` get it filled in from here.
export function attachCertificates(courses, certificates) {
  const byCourse = new Map(certificates.filter((c) => c.courseId).map((c) => [c.courseId, c]));
  return courses.map((course) => (byCourse.has(course.id) ? { ...course, certificate: byCourse.get(course.id) } : course));
}
