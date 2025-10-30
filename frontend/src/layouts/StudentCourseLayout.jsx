import axios from "axios";
import {
  BookOpenIcon,
  CircleUserRound,
  ClipboardPenIcon,
  EyeIcon,
  LockIcon,
  Menu,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { checkLessonPrerequisites } from "../services/api";

function StudentCourseLayout() {
  const { courseId } = useParams();
  const [leftOpen, setLeftOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [error, setError] = useState("");
  const [lessonPrerequisiteStatus, setLessonPrerequisiteStatus] = useState({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [cRes, lRes] = await Promise.all([
        axios.get(`/api/courses/${courseId}`),
        axios.get(`/api/courses/${courseId}/lessons`),
      ]);
      setCourse(cRes.data);
      const visibleLessons = Array.isArray(lRes.data)
        ? lRes.data.filter((lesson) => lesson.status !== "draft")
        : [];
      setLessons(visibleLessons);
    } catch (e) {
      setError(e.response?.data?.error || "Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchAll();
    }
  }, [courseId, fetchAll]);

  // Check prerequisites for all lessons
  useEffect(() => {
    const checkAllPrerequisites = async () => {
      const studentId = localStorage.getItem("userId");
      if (!studentId || lessons.length === 0) return;

      const statusMap = {};

      // Check prerequisites for each lesson
      await Promise.all(
        lessons.map(async (lesson) => {
          try {
            const response = await checkLessonPrerequisites(
              lesson.id,
              studentId
            );
            statusMap[lesson.id] = response;
          } catch (error) {
            console.error(
              `Error checking prerequisites for lesson ${lesson.id}:`,
              error
            );
            // Assume access allowed on error to avoid blocking
            statusMap[lesson.id] = {
              accessAllowed: true,
              unmetPrerequisites: [],
            };
          }
        })
      );

      setLessonPrerequisiteStatus(statusMap);
    };

    checkAllPrerequisites();
  }, [lessons]);

  const lessonLinks = useMemo(
    () =>
      lessons.map((l) => {
        const prerequisiteInfo = lessonPrerequisiteStatus[l.id];
        return {
          id: l.id,
          title: l.title || "(Untitled Lesson)",
          status: l.status,
          prerequisitesBlocked:
            prerequisiteInfo && !prerequisiteInfo.accessAllowed,
          unmetCount: prerequisiteInfo
            ? prerequisiteInfo.unmetPrerequisites?.length || 0
            : 0,
        };
      }),
    [lessons, lessonPrerequisiteStatus]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-lg loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6">
        <div className="alert alert-warning">
          <span>Course not found</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Top bar (mobile) */}
      <div className="flex items-center justify-between p-4 lg:hidden bg-base-200">
        <button
          className="btn btn-ghost btn-square"
          onClick={() => setLeftOpen((s) => !s)}
          aria-label="Toggle menu"
        >
          <Menu />
        </button>
        <h1 className="font-bold text-lg truncate">
          {course.title || "Course"}
        </h1>
      </div>

      <div className="flex">
        {/* Left drawer / sidebar */}
        <div
          className={`absolute z-40 lg:static lg:translate-x-0 transition-transform duration-300 rounded-box border border-base-300 ml-2 lg:border-0 w-64 p-4
          ${leftOpen ? "translate-x-0" : "-translate-x-96"} lg:translate-x-0`}
        >
          <h2 className="text-xl font-bold mb-4 hidden lg:block bg-base-200 rounded-box px-4 py-2">
            {course.title || "Course"}
          </h2>

          <ul className="menu rounded-box p-2 border border-base-300 bg-base-100 menu-md space-y-1">
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

            <li className="menu-title">
              <span>Lessons</span>
            </li>

            {lessonLinks.length === 0 ? (
              <li className="px-4 py-2 text-sm text-gray-500">
                No lessons available yet
              </li>
            ) : (
              lessonLinks.map((l) => (
                <li key={l.id}>
                  <NavLink
                    to={`/student/course/${courseId}/lesson/${l.id}`}
                    className={({ isActive }) => {
                      let baseClass = isActive ? "active" : "";
                      if (l.prerequisitesBlocked) {
                        baseClass += " opacity-60";
                      }
                      return baseClass;
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {l.prerequisitesBlocked ? (
                        <LockIcon className="w-4 h-4 text-warning" />
                      ) : (
                        <BookOpenIcon className="w-4 h-4" />
                      )}
                      <span className="flex-1">{l.title}</span>
                      <div className="flex gap-1">
                        {l.prerequisitesBlocked && l.unmetCount > 0 && (
                          <span className="badge badge-warning badge-xs">
                            {l.unmetCount} req
                          </span>
                        )}
                        {l.status === "archived" && (
                          <span className="badge badge-warning badge-xs">
                            Archived
                          </span>
                        )}
                      </div>
                    </div>
                  </NavLink>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Main content */}
        <main className="flex-1 flex flex-col pt-6">
          {/* Back to dashboard */}
          <div className="flex justify-end px-4 mb-2">
            <Link to="/student" className="btn btn-neutral btn-sm">
              Back to Dashboard
            </Link>
          </div>

          <div className="pt-1">
            <Outlet context={{ course, lessons, loading, refetch: fetchAll }} />
          </div>

          {/* Right rail on mobile (below content) */}
          <section className="lg:hidden p-6">
            <DirectorCard course={course} />
            <div className="mt-4">
              <LearningOutcomesCard lessons={lessons} />
            </div>
          </section>
        </main>

        {/* Right rail (desktop) */}
        <aside className="hidden lg:block w-64 p-6">
          <DirectorCard course={course} />
          <div className="mt-4">
            <LearningOutcomesCard lessons={lessons} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function DirectorCard({ course }) {
  const name =
    course?.director_first_name && course?.director_last_name
      ? `${course.director_first_name} ${course.director_last_name}`
      : "Director";

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 text-right lg:text-left bg-base-200 rounded-box px-4 py-2">
        Course Director
      </h2>
      <div className="card border border-base-300 p-4 bg-base-100">
        <div className="flex items-center gap-3">
          <div className="avatar placeholder">
            <div className="bg-base-300 rounded-full w-12">
              <CircleUserRound size={32} />
            </div>
          </div>
          <div>
            <p className="font-medium">{name}</p>
            {course?.director_title && (
              <p className="text-xs text-gray-500">{course.director_title}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LearningOutcomesCard({ lessons }) {
  const perLesson = useMemo(() => {
    return (lessons || []).map((l) => {
      const title = l?.title || "(Untitled Lesson)";
      const raw = (l?.objectives || "").trim();
      if (!raw) return { title, items: [] };

      const items = raw
        .split(/\r?\n|•|- |\u2022|;+/g)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      return { title, items };
    });
  }, [lessons]);

  const totalItems = perLesson.reduce((acc, x) => acc + x.items.length, 0);

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 text-right lg:text-left bg-base-200 rounded-box px-4 py-2">
        Learning Outcomes
      </h2>
      <div className="card border z p-4 bg-base-100 border-base-300">
        {(!lessons || lessons.length === 0) && (
          <p className="text-sm text-gray-500">No lessons available.</p>
        )}

        {lessons && lessons.length > 0 && totalItems === 0 && (
          <p className="text-sm text-gray-500">No learning outcomes yet.</p>
        )}

        {perLesson.map((block, idx) => (
          <div key={`${block.title}-${idx}`} className="mb-4">
            <p className="font-medium text-sm mb-1">{block.title}</p>
            {block.items.length === 0 ? (
              <p className="text-xs text-gray-500">No outcomes provided.</p>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {block.items.map((it, i) => (
                  <li key={`${it}-${i}`} className="text-sm">
                    {it}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentCourseLayout;
