import axios from "axios";
import {
  BookOpenIcon,
  ClipboardPenIcon,
  EyeIcon,
  SchoolIcon,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import {
  NavLink,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

// Simple top bar for instructor screens
// Left: logo; Right: status + user + logout
const InstructorLessonsTopBar = ({ status, onLogout }) => {
  const label = status
    ? String(status).charAt(0).toUpperCase() + String(status).slice(1)
    : "";
  const pillClass =
    label.toLowerCase() === "published" || label.toLowerCase() === "completed"
      ? "bg-green-100 text-green-800"
      : "bg-gray-200 text-gray-700";
  return (
    <nav className="w-full border-b bg-white">
      <div className="max-w-7xl mx-auto h-14 px-4 flex items-center justify-between">
        {/* Left: Logo (swap src if you have a real logo path) */}
        <div className="flex items-center gap-2">
          <img
            src="/eduva_text.png"
            alt="EDUVA"
            className="h-8 w-auto"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
        {/* Right cluster: Status + user stub + Logout */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm text-gray-600">Status:</span>
            {label && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${pillClass}`}
              >
                {label}
              </span>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
              IN
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium">Title</div>
              <div className="text-xs text-gray-500">Description</div>
            </div>
          </div>
          <button
            className="px-4 py-1.5 rounded bg-gray-800 text-white text-sm"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

/**
 * Small helper that renders a colored status badged for a lesson.
 * such as to complete, completed, and archived.
 */
const StatusPill = ({ status }) => {
  const s = (status || "").toLowerCase();
  let cls = "bg-yellow-100 text-yellow-800"; // default color
  let text = "TO COMPLETE"; // default label

  if (s === "published" || s === "completed") {
    cls = "bg-green-100 text-green-800";
    text = "COMPLETED"; // completed state
  } else if (s === "archived") {
    cls = "bg-gray-200 text-gray-700";
    text = "ARCHIVED"; // archived state
  }

  // return a tiny badge element with the chosen label/styles
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${cls}`}>
      {text}
    </span>
  );
};

/**
 * Main page component for displaying lessons of a specific course.
 * layout: left (lesson list), center (content cards), right (metadata of instructor)
 */
export default function InstructorLessons() {
  // read the course Id from the URL.
  const { courseId } = useParams();
  // get a naviage() function for back buttons or redirects.
  const navigate = useNavigate();

  // for reading the query param
  const [searchParams] = useSearchParams();
  const preselectLessonId = searchParams.get("lesson");

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  // the id of the lesson currently selected in the left menu
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  // true while fetching data; controls loading UI
  const [loading, setLoading] = useState(true);
  // used to show the error message string if the fetch fails
  const [err, setErr] = useState("");

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout", {});
    } catch (_) {
      // ignore failures; navigate anyway
    } finally {
      navigate("/login");
    }
  };

  // a cache for a lessons and selectedLessonId values,
  // so React can reuse the result until its input change.
  const selected = useMemo(
    // find the lesson in the "lessons" array whose id matches selectedLessonId
    // if not found (or not set), fall back null
    () => lessons.find((l) => l.id === selectedLessonId) || null,
    // recompute only when 'lessons' or 'selectedLessonId' changes
    [lessons, selectedLessonId]
  );

  // async function to load both course and lessons
  const fetchCourseAndLessons = async () => {
    try {
      setErr(""); // clear any previous error if any
      setLoading(true); // show loading state

      // 1. course details
      const cRes = await axios.get(`/api/courses/${courseId}`);
      // make GET /api/courses/:courseId to fetch course details from your backend
      setCourse(cRes.data);

      // 2. lessons for this course
      // Make GET /api/courses/:courseId/lessons to fetch all lessons for this course
      const lRes = await axios.get(`/api/courses/${courseId}/lessons`);
      // ensure the response is an array: if not, use an empty array to avoid crashes
      const list = Array.isArray(lRes.data) ? lRes.data : [];
      // save the lessons array into state
      setLessons(list);

      // default selection
      // if we have lessons and nothing is selected yet,
      // default to the first lesson
      if (list.length) {
        if (preselectLessonId) {
          const found = list.find(
            (l) =>
              String(l.id) === String(preselectLessonId) ||
              String(l.lesson_id || "") === String(preselectLessonId)
          );
          if (found) {
            setSelectedLessonId(found.id);
          } else if (!selectedLessonId) {
            setSelectedLessonId(list[0].id);
          }
        } else if (!selectedLessonId) {
          setSelectedLessonId(list[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load course/lessons:", e);
      setErr(e.response?.data?.error || "Failed to load lessons");
    } finally {
      // turn off loading regardless of success or failures.
      setLoading(false);
    }
  };

  // run side-effects whenever 'courseId' changes.
  // this effect fetches the course+lessons fro the current courseId (URL param).
  useEffect(() => {
    if (courseId) fetchCourseAndLessons();
  }, [courseId]);

  // keeps the selected lesson in sync with the URL's ? lesson= query param
  // after the page has already loaded
  useEffect(() => {
    if (!lessons?.length) return;
    const q = searchParams.get("lessons");
    if (!q) return;
    const found = lessons.find(
      (l) =>
        String(l.id) === String(q) || Strign(l.lesson_id || "") === String(q)
    );
    if (found && found.id !== selectedLessonId) {
      setSelectedLessonId(found.id);
    }
  }, [lessons, searchParams]);

  // early return #1:
  // show a lightweight loading UI while data is being fetched.
  if (loading) return <div className="p-6">Loading...</div>;
  // early return #2:
  // if a fetch failed, show a simple error message.
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  // early return #3:
  // defensive fallback when no course is found for the id.
  if (!course) return <div className="p-6">Course not found</div>;

  return (
    <>
      <InstructorLessonsTopBar
        status={course?.status}
        onLogout={handleLogout}
      />
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {/* Left: title + status badge on the same line */}
          <div className="flex items-baseline gap-2">
            <h1 className="text-3xl font-bold">
              {course.title || "Course Title"}
            </h1>
            {/* course status */}
            {course.status && (
              <span
                className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold"
                role="status"
                aria-label={`status: ${course.status}`}
              >
                {String(course.status).charAt(0).toUpperCase() +
                  String(course.status).slice(1)}
              </span>
            )}
          </div>
          {/* Right: back-to-dashboard button */}
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded"
              onClick={() => navigate("/instructor")}
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* 3-column layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left: lesson list */}
          <aside className="col-span-12 md:col-span-3">
            <div className="rounded-box border ml-0 lg:border-0 w-full bg-base-200 p-4">
              <ul className="menu rounded-box p-2 border border-base-300 bg-base-100 menu-md">
                <li>
                  <NavLink
                    to={`/student/course/${courseId}`}
                    className={({ isActive }) => (isActive ? "active" : "")}
                    end
                  >
                    <EyeIcon />
                    Overview
                  </NavLink>
                </li>

                <li className="menu-title">Lessons</li>
                {lessons.map((l) => (
                  <li key={l.id}>
                    <NavLink
                      to={`/student/course/${courseId}/lesson/${l.id}`}
                      className={({ isActive }) => (isActive ? "active" : "")}
                    >
                      <BookOpenIcon /> {l.title}
                    </NavLink>
                  </li>
                ))}

                <li className="menu-title">Other</li>
                <li>
                  <NavLink
                    to={`/student/course/${courseId}/classrooms`}
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    <SchoolIcon /> Classroom
                    <span className="badge badge-sm ml-2">2 Active</span>
                  </NavLink>
                </li>
              </ul>
            </div>
          </aside>

          {/* Center: content cards*/}
          <main className="col-span-12 md:col-span-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold">
                {selected?.title || "Lesson Title"}
              </h2>
              <p className="text-gray-500">Subheading</p>
            </div>

            <div className="space-y-5">
              {[
                {
                  title: "Reading List",
                  body: "Body text for whatever you'd like to say",
                },
                {
                  title: "Classrooms",
                  body: "Body text for whatever you want to say",
                },
                {
                  title: "Assignments",
                  body: "Body text for whatever you want to say",
                },
              ].map((card) => (
                <div key={card.title} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                      Img
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{card.title}</h3>
                        <div className="flex gap-2">
                          <button className="px-3 py-1 bg-gray-200 rounded text-sm">
                            Edit
                          </button>
                          <button className="px-3 py-1 bg-gray-700 text-white rounded text-sm">
                            Settings
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{card.body}</p>
                      <div className="mt-3">
                        <button className="px-3 py-1 border rounded text-sm">
                          Button
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>

          {/* Right: metadata panel: for instructor */}
          <aside className="col-span-12 md:col-span-3">
            <div className="border rounded-lg p-4 space-y-4">
              <div>
                <div className="text-sm text-gray-500">Lesson Director</div>
                <div className="mt-1 font-medium">
                  {selected?.designer_first_name || selected?.designer_last_name
                    ? `${selected?.designer_first_name || ""} ${
                        selected?.designer_last_name || ""
                      }`
                    : "-"}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Lesson Updated</div>
                <div className="mt-1">
                  {selected?.modified_at
                    ? new Date(selected.modified_at).toLocaleDateString()
                    : course?.modified_at
                    ? new Date(course.modified_at).toLocaleDateString()
                    : "-"}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Lesson Credits</div>
                <div className="mt-1">
                  {selected?.credit_value ?? "-"} Credits
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
