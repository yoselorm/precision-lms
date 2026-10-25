import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  GraduationCap,
  Laptop,
  Layers,
  Menu,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import CourseCard from "../components/CourseCard";
import { selectPublicCourses } from "../store/slices/coursesSlice";
import { selectApprovedTrainers } from "../store/slices/usersSlice";
import afenetLogo from "../assets/images/afenet-logo.jpeg";

const photo = (id, w = 800) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

const HERO_IMAGE = photo("1759852692971-a2abc6799cbd", 900);
const ABOUT_IMAGE = photo("1677195063105-276fd4b95b21", 900);

const LEARNER_AVATARS = [
  photo("1522529599102-193c0d76b5b6", 120),
  photo("1743871698163-a2e470d8eac7", 120),
  photo("1596529257881-85dfcdc8f880", 120),
  photo("1617565980755-d57f254b0ba7", 120),
];

const CATEGORY_META = {
  Compliance: { icon: ShieldCheck, blurb: "Policies, safety and data protection every team member needs." },
  Leadership: { icon: Users, blurb: "Lead teams, give feedback and run effective field operations." },
  Onboarding: { icon: Compass, blurb: "Everything new staff need to hit the ground running." },
  "Technical Skills": { icon: Laptop, blurb: "Data, reporting and digital tools for modern public health." },
  Sales: { icon: Briefcase, blurb: "Communicate value and build lasting partnerships." },
};

const ABOUT_POINTS = ["Learn at your own pace", "Certificates on completion", "Expert-led courses", "Quizzes & progress tracking"];

const TESTIMONIALS = [
  {
    name: "Abena Darko",
    role: "Surveillance Officer",
    image: photo("1743871698163-a2e470d8eac7", 200),
    quote: "The short lessons fit around my field work. I finished two courses in a month and the certificates went straight into my appraisal.",
  },
  {
    name: "Kojo Ansah",
    role: "Data Analyst",
    image: photo("1596529257881-85dfcdc8f880", 200),
    quote: "The Excel reporting course changed how our team builds weekly dashboards. Clear, practical and easy to follow.",
  },
  {
    name: "Efua Owusu",
    role: "Field Epidemiology Resident",
    image: photo("1617565980755-d57f254b0ba7", 200),
    quote: "Quizzes after every topic kept me honest. I always knew exactly where I stood and what to revisit.",
  },
];

const NAV_LINKS = [
  { label: "Home", target: "home" },
  { label: "Categories", target: "categories" },
  { label: "About", target: "about" },
];

// Diagonal stripe fill used behind the photo cards (mirrors the brand-200 tone).
const STRIPES = {
  backgroundImage: "repeating-linear-gradient(135deg, #B5C2E8 0 10px, transparent 10px 22px)",
};
const HATCH = {
  backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.28) 0 2px, transparent 2px 9px)",
};

function Eyebrow({ children, light }) {
  return (
    <p className={`flex items-center gap-1.5 text-xs font-semibold sm:text-sm ${light ? "text-brand-100" : "text-brand-700"}`}>
      <Sparkles size={14} className={light ? "text-brand-200" : "text-brand-500"} /> {children}
    </p>
  );
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl lg:text-4xl">{title}</h2>
      {subtitle && <p className="text-sm text-stone-500 sm:text-base">{subtitle}</p>}
    </div>
  );
}

function Squiggle({ className }) {
  return (
    <svg viewBox="0 0 120 60" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 40c10-30 26-30 22 0s14 30 22 0 18-30 22 0 14 30 22 0 18-28 24-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CurlyArrow({ className }) {
  return (
    <svg viewBox="0 0 80 100" fill="none" className={className} aria-hidden="true">
      <path
        d="M14 94c-10-16 2-34 14-28s4 22-6 14S30 30 70 8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M54 8h16v16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const categoryRowRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const courses = useSelector(selectPublicCourses);
  const trainers = useSelector(selectApprovedTrainers);

  const categories = useMemo(() => {
    const counts = {};
    courses.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [courses]);

  const popularCourses = useMemo(
    () => [...courses].sort((a, b) => (b.studentsCount || 0) - (a.studentsCount || 0)).slice(0, 3),
    [courses]
  );

  const learnerCount = courses.reduce((sum, c) => sum + (c.studentsCount || 0), 0);

  const stats = [
    { icon: Users, value: `${learnerCount.toLocaleString()}+`, label: "Learners enrolled" },
    { icon: BookOpen, value: courses.length, label: "Courses available" },
    { icon: Layers, value: categories.length, label: "Learning categories" },
    { icon: GraduationCap, value: trainers.length, label: "Expert trainers" },
  ];

  const goCatalog = () => navigate("/catalog");
  const goSignup = () => navigate("/login", { state: { tab: "signup" } });

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollCategories = (dir) => {
    categoryRowRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden bg-white text-stone-900">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section id="home" className="relative overflow-hidden bg-brand-50">
        {/* The deep-blue panel starts part-way across the hero photo so the photo
            straddles the light/deep split. Offsets are measured from the page
            centre so the split lands at the same point on the photo at every width. */}
        <div className="absolute inset-y-0 right-0 hidden bg-brand-700 lg:block lg:left-[calc(50%+180px)] xl:left-[calc(50%+300px)]" />
        <div style={HATCH} className="absolute -bottom-16 right-10 hidden h-48 w-48 rounded-full lg:block" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
          {/* Nav */}
          <nav className="flex items-center justify-between gap-4 py-5">
            <button onClick={() => scrollTo("home")} className="flex shrink-0 items-center gap-2">
              <img src={afenetLogo} alt="AFENET" className="h-9 w-auto rounded-md object-contain mix-blend-multiply" />
              <span className="hidden text-sm font-bold tracking-tight text-stone-900 sm:inline">Afenet LMS</span>
            </button>

            <div className="hidden items-center gap-7 md:flex lg:mr-auto lg:ml-12">
              {NAV_LINKS.map((l) => (
                <button
                  key={l.target}
                  onClick={() => scrollTo(l.target)}
                  className={`text-sm font-medium transition hover:text-brand-700 ${l.target === "home" ? "text-brand-700" : "text-stone-600"}`}
                >
                  {l.label}
                </button>
              ))}
              <button onClick={goCatalog} className="text-sm font-medium text-stone-600 transition hover:text-brand-700">
                Courses
              </button>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <button
                onClick={() => navigate("/login")}
                className="rounded-lg border border-brand-700 px-5 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 lg:border-white/50 lg:text-white lg:hover:bg-white/10"
              >
                Log in
              </button>
              <button
                onClick={goSignup}
                className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 lg:bg-white lg:text-brand-700 lg:hover:bg-brand-50"
              >
                Register
              </button>
            </div>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-lg p-2 text-stone-700 hover:bg-brand-100 md:hidden"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </nav>

          {menuOpen && (
            <div className="mb-4 animate-fade-in rounded-2xl border border-brand-100 bg-white p-3 shadow-lg md:hidden">
              {NAV_LINKS.map((l) => (
                <button
                  key={l.target}
                  onClick={() => scrollTo(l.target)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-stone-700 hover:bg-brand-50"
                >
                  {l.label}
                </button>
              ))}
              <button
                onClick={goCatalog}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-stone-700 hover:bg-brand-50"
              >
                Courses
              </button>
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-stone-100 pt-3">
                <button
                  onClick={() => navigate("/login")}
                  className="rounded-lg border border-brand-700 py-2 text-sm font-semibold text-brand-700"
                >
                  Log in
                </button>
                <button onClick={goSignup} className="rounded-lg bg-brand-700 py-2 text-sm font-semibold text-white">
                  Register
                </button>
              </div>
            </div>
          )}

          {/* Hero content */}
          <div className="grid grid-cols-1 items-center gap-12 pb-16 pt-8 lg:grid-cols-2 lg:pb-24 lg:pt-12">
            <div className="relative animate-fade-in">
              <Squiggle className="absolute -top-10 right-6 hidden h-10 w-24 text-brand-400 sm:block" />
              <Eyebrow>Free, self-paced learning</Eyebrow>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-brand-900 sm:text-5xl lg:text-6xl">
                Build Your Skills for a{" "}
                <span className="inline-block -rotate-1 rounded-xl bg-brand-700 px-3 pb-1 text-white">Healthier</span>{" "}
                Africa
              </h1>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-stone-600 sm:text-base">
                Find courses that match your role, learn from experienced public health trainers, and earn certificates
                as you grow.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  onClick={goCatalog}
                  className="group flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-700/20 transition hover:bg-brand-800"
                >
                  Explore Courses
                  <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                </button>
                <button
                  onClick={goSignup}
                  className="rounded-xl px-4 py-3.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                >
                  Create a free account
                </button>
                <CurlyArrow className="hidden h-16 w-12 text-brand-400 sm:block" />
              </div>

              <div className="mt-10 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {LEARNER_AVATARS.map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt=""
                      className="h-11 w-11 rounded-full border-2 border-white object-cover object-top"
                    />
                  ))}
                </div>
                <p className="text-sm leading-tight text-stone-700">
                  <span className="block text-base font-bold text-stone-900">{learnerCount.toLocaleString()}+ Active</span>
                  Learners
                </p>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:mr-0">
              <div style={STRIPES} className="absolute -bottom-5 -right-5 left-8 top-10 rounded-[2rem] bg-white" />
              <img
                src={HERO_IMAGE}
                alt="Student holding a notebook"
                className="relative aspect-[4/5] w-full rounded-[2rem] object-cover object-top shadow-2xl shadow-brand-950/20"
              />
              <div className="absolute left-3 top-10 flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-xl sm:-left-10">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <Award size={18} />
                </span>
                <div>
                  <p className="text-xs font-bold text-stone-900">Certified learning</p>
                  <p className="text-[11px] text-stone-500">Earn as you complete</p>
                </div>
              </div>
              <div className="absolute bottom-10 right-3 flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-xl sm:-right-8 lg:-right-4 xl:-right-8">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white">
                  <BookOpen size={18} />
                </span>
                <div>
                  <p className="text-xs font-bold text-stone-900">{courses.length} courses</p>
                  <p className="text-[11px] text-stone-500">Ready to start today</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────── */}
      <section id="categories" className="mx-auto max-w-7xl px-4 py-20 sm:px-8 lg:py-24">
        <SectionHeading
          eyebrow="Course Categories"
          title="Explore our Course Categories"
          subtitle="Whatever your role, there is a learning path built for you."
        />

        <div className="relative mt-12">
          <button
            onClick={() => scrollCategories(-1)}
            className="absolute -left-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand-100 text-brand-700 shadow transition hover:bg-brand-200 sm:flex lg:-left-6"
            aria-label="Previous categories"
          >
            <ChevronLeft size={20} />
          </button>
          <div
            ref={categoryRowRef}
            className="flex snap-x gap-5 overflow-x-auto scroll-smooth px-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {categories.map(({ name, count }) => {
              const meta = CATEGORY_META[name] || { icon: BookOpen, blurb: "Practical courses to grow your skills." };
              const Icon = meta.icon;
              return (
                <button
                  key={name}
                  onClick={() => navigate(`/catalog?category=${encodeURIComponent(name)}`)}
                  className="group flex w-56 shrink-0 snap-start flex-col items-center gap-3 rounded-2xl bg-brand-50 px-6 py-8 text-center transition duration-200 hover:-translate-y-1 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-700/20"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-brand-700 transition group-hover:bg-white/10 group-hover:text-white">
                    <Icon size={30} strokeWidth={1.6} />
                  </span>
                  <h3 className="text-lg font-bold text-stone-900 group-hover:text-white">{name}</h3>
                  <p className="text-xs leading-relaxed text-stone-500 group-hover:text-brand-100">{meta.blurb}</p>
                  <span className="mt-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-brand-700 group-hover:bg-white/15 group-hover:text-white">
                    {count} {count === 1 ? "course" : "courses"}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => scrollCategories(1)}
            className="absolute -right-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand-700 text-white shadow transition hover:bg-brand-800 sm:flex lg:-right-6"
            aria-label="Next categories"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* ── About ────────────────────────────────────────── */}
      <section id="about" className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 pb-20 sm:px-8 lg:grid-cols-2 lg:pb-28">
        <div className="relative mx-auto w-full max-w-md">
          <Squiggle className="absolute -left-6 -top-10 h-10 w-24 text-brand-300" />
          <div className="absolute -bottom-5 -left-5 right-8 top-10 overflow-hidden rounded-[2rem] bg-brand-400">
            <div style={HATCH} className="h-full w-full" />
          </div>
          <img
            src={ABOUT_IMAGE}
            alt="Health worker reading a book"
            className="relative aspect-[4/5] w-full rounded-[2rem] object-cover object-top"
          />
        </div>

        <div>
          <Eyebrow>About Us</Eyebrow>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-4xl">
            Training the workforce behind a healthier Africa
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-stone-600 sm:text-base">
            The African Field Epidemiology Network brings practical, self-paced training to public health professionals
            across the continent. Every course is built by trainers with real field experience.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-stone-600 sm:text-base">
            Track your progress, test your knowledge with quizzes, join instructor-led classes, and earn certificates that
            show what you have achieved.
          </p>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {ABOUT_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-sm font-medium text-stone-800">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-700 text-white">
                  <Check size={13} strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <button
            onClick={goCatalog}
            className="group mt-9 flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Explore Courses
            <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>

      {/* ── Popular courses ──────────────────────────────── */}
      {popularCourses.length > 0 && (
        <section className="bg-stone-50 py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div className="flex flex-col gap-3">
                <Eyebrow>Popular Courses</Eyebrow>
                <h2 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl lg:text-4xl">
                  Start with what others love
                </h2>
              </div>
              <button
                onClick={goCatalog}
                className="flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                View all courses <ArrowRight size={15} />
              </button>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {popularCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ─────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8 lg:py-24">
        <SectionHeading
          eyebrow="Testimonials"
          title="What Our Learners Say"
          subtitle="Professionals across the network are building new skills on Afenet LMS."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-2xl border border-stone-200 bg-white p-6 transition hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <Quote size={26} className="text-brand-100" fill="currentColor" />
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-stone-600">“{t.quote}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-stone-100 pt-5">
                <img src={t.image} alt={t.name} className="h-12 w-12 rounded-xl object-cover object-top" />
                <div>
                  <p className="text-sm font-bold text-stone-900">{t.name}</p>
                  <p className="text-xs text-stone-500">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── Stats band ───────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brand-700">
        <div style={HATCH} className="absolute -left-10 -top-10 h-40 w-40 rounded-full opacity-60" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-4 py-14 sm:px-8 lg:grid-cols-4">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center text-white">
              <Icon size={34} strokeWidth={1.4} className="text-brand-200" />
              <p className="text-3xl font-extrabold tracking-tight sm:text-4xl">{value}</p>
              <p className="text-xs text-brand-100 sm:text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-8">
        <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl bg-brand-700 px-6 py-10 sm:px-12 md:flex-row md:items-center">
          <div style={HATCH} className="absolute -bottom-16 -right-10 h-48 w-48 rounded-full" />
          <h2 className="relative max-w-xl text-xl font-bold leading-snug text-white sm:text-2xl">
            Lifetime access, anywhere, on any device — and learning at your own speed.
          </h2>
          <div className="relative flex flex-wrap gap-3">
            <button
              onClick={goSignup}
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              Get Started
            </button>
            <button
              onClick={goCatalog}
              className="rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Explore Courses
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-stone-200 bg-stone-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img src={afenetLogo} alt="AFENET" className="h-9 w-auto object-contain mix-blend-multiply" />
            <span className="text-sm font-bold text-stone-900">Afenet LMS</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-600">
            {NAV_LINKS.map((l) => (
              <button key={l.target} onClick={() => scrollTo(l.target)} className="hover:text-brand-700">
                {l.label}
              </button>
            ))}
            <button onClick={goCatalog} className="hover:text-brand-700">
              Courses
            </button>
          </div>
          <p className="text-xs text-stone-400">© {new Date().getFullYear()} African Field Epidemiology Network</p>
        </div>
      </footer>
    </div>
  );
}
