import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

function asArray(x) {
  return Array.isArray(x) ? x : [];
}
function getCourseTitle(course, idx) {
  return (
    course.course_title ||
    course.title ||
    course.name ||
    `Course ${course.course_id ?? idx + 1}`
  );
}
function getLessonTitle(lesson, idx) {
  return (
    lesson.title || lesson.lesson_title || lesson.name || `Lesson ${idx + 1}`
  );
}
function hasClassroom(lesson) {
  return !!(
    lesson?.classroom_id ||
    lesson?.classroomId ||
    (lesson?.classroom && (lesson.classroom.id || lesson.classroom.uuid))
  );
}

export default function StudentProgress() {
  const { userId, role } = useAuthStore();
  const { id: paramsId } = useParams();
  const studentId = role === "student" ? userId : paramsId;

  const [summary, setSummary] = useState([]);
  const [rows, setRows] = useState([]); // ✅ course rows
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [student, setStudent] = useState(null);
  const [expanded, setExpanded] = useState(new Set());

  // Reset when switching student
  useEffect(() => {
    setSummary([]);
    setStudent(null);
    setExpanded(new Set());
    setErr("");
  }, [studentId]);

  // Load summary
  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr("");

      try {
        const [progressRes, studentRes] = await Promise.all([
          axios.get(`/api/students/${studentId}/progress-summary`, {
            withCredentials: true,
          }),
          axios
            .get(`/api/students/${studentId}`, { withCredentials: true })
            .catch(() =>
              axios.get(`/api/users/${studentId}`, { withCredentials: true })
            ),
        ]);

        if (!cancelled) {
          setSummary(Array.isArray(progressRes.data) ? progressRes.data : []);
          const payload =
            studentRes?.data && typeof studentRes.data === "object"
              ? studentRes.data.student ?? studentRes.data
              : null;
          setStudent(payload);
        }
      } catch (e) {
        console.error("Failed to fetch student progress:", e);
        if (!cancelled)
          setErr(
            e?.response?.data?.error || "Failed to fetch student progress"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  // ✅ Course-level progress calculation (matches InstructorReport)
  useEffect(() => {
    async function calculateProgress() {
      if (!summary.length) return;

      const results = await Promise.all(
        summary.map(async (course, idx) => {
          try {
            const courseId = course.course_id ?? course.id ?? idx;
            const title = getCourseTitle(course, idx);

            // Fetch lessons
            const lessonsRes = await axios.get(
              `/api/lessons/courses/${courseId}/lessons`
            );
            const lessons = Array.isArray(lessonsRes.data)
              ? lessonsRes.data
              : [];

            let doneLessons = 0;

            await Promise.all(
              lessons.map(async (lesson) => {
                try {
                  const comp = await axios.get(
                    `/api/lessons/${lesson.id}/completion/${studentId}`
                  );
                  if (comp.data?.completed) doneLessons += 1;
                } catch {}
              })
            );

            const totalLessons = lessons.length;
            const pct =
              totalLessons > 0
                ? Math.round((doneLessons / totalLessons) * 100)
                : 0;
            const totalCredits = course.total_credits || 30;
            const gainedCredits = Math.round((pct / 100) * totalCredits);

            return {
              id: courseId,
              title,
              total: totalLessons,
              done: doneLessons,
              pct,
              lessons,
              totalCredits,
              gainedCredits,
            };
          } catch (e) {
            console.error("Failed to compute progress for course", course, e);
            return {
              id: course.course_id ?? course.id ?? idx,
              title: getCourseTitle(course, idx),
              total: 0,
              done: 0,
              pct: 0,
              lessons: [],
              totalCredits: 30,
              gainedCredits: 0,
            };
          }
        })
      );

      setRows(results);
    }

    calculateProgress();
  }, [summary, studentId]);

  // ✅ When expanding course → fetch each lesson's completion
  async function loadLessonStatuses(courseId) {
    try {
      setRows((prev) =>
        prev.map((course) =>
          course.id === courseId ? { ...course, loadingLessons: true } : course
        )
      );

      const res = await axios.get(`/api/lessons/courses/${courseId}/lessons`);
      const lessons = Array.isArray(res.data) ? res.data : [];

      const updated = await Promise.all(
        lessons.map(async (lesson) => {
          let completed = false;
          let hasJoinedClassroom = false;

          try {
            // ✅ check completion
            const comp = await axios.get(
              `/api/lessons/${lesson.id}/completion/${studentId}`
            );
            completed = !!comp.data?.completed;
          } catch {}

          try {
            // ✅ check classroom enrollment (adjust this route if yours differs)
            const classroomRes = await axios.get(
              `/api/classrooms/student/${studentId}/lesson/${lesson.id}`
            );
            if (Array.isArray(classroomRes.data) && classroomRes.data.length > 0)
              hasJoinedClassroom = true;
            else if (classroomRes.data && classroomRes.data.id)
              hasJoinedClassroom = true;
          } catch {
            // ignore if route 404s
          }

          return { ...lesson, completed, hasJoinedClassroom };
        })
      );


      setRows((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? { ...course, lessons: updated, loadingLessons: false }
            : course
        )
      );
    } catch (e) {
      console.error("Failed to load lesson statuses:", e);
    }
  }

  // ✅ Handle expand toggle
  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      const willOpen = !next.has(id);
      willOpen ? next.add(id) : next.delete(id);

      if (willOpen) loadLessonStatuses(id);
      return next;
    });
  };

  // UI ---------------------------------------------------------

  if (loading)
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-16 w-full" />
      </div>
    );

  if (err)
    return (
      <div className="p-6">
        <div className="alert alert-error">{err}</div>
      </div>
    );

  return (
    <div key={studentId} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="bg-base-200 rounded-box px-4 py-2">
          <h1 className="text-2xl font-bold">Student Course Progress</h1>
          <p className="opacity-70">
            Student: {student?.title} {student?.first_name} {student?.last_name}
          </p>
        </div>
        <Link to="/instructor/report" className="btn btn-neutral btn-sm">
          Back to Report
        </Link>
      </div>

      {rows.map((course) => {
        const isOpen = expanded.has(course.id);
        return (
          <div
            key={course.id}
            className="border border-base-300 rounded-box shadow bg-base-100 p-5 hover:shadow-lg transition-all duration-200"
          >
            {/* Header */}
            <div
              className="cursor-pointer flex justify-between items-start"
              onClick={() => toggleExpand(course.id)}
            >
              <div>
                <h2 className="text-lg font-bold mb-2">{course.title}</h2>
                <p className="text-sm text-gray-600 mb-2">
                  Lessons Completed: {course.done}/{course.total}
                </p>
                <div className="flex items-center gap-2">
                  <progress
                    className="progress progress-primary w-64"
                    value={course.pct}
                    max="100"
                  ></progress>
                  <span className="text-sm opacity-70">{course.pct}%</span>
                </div>
              </div>
              <div className="text-sm text-gray-600 text-right">
                <p className="font-semibold text-base-content">
                  Credits Gained:{" "}
                  <span className="font-bold">
                    {course.gainedCredits}/{course.totalCredits}
                  </span>
                </p>
              </div>
            </div>

            {/* Expanded Lessons */}
            {isOpen && (
              <div className="mt-4 border-t border-base-300 pt-3">
                {course.loadingLessons ? (
                  <div className="text-sm opacity-70">Loading lessons...</div>
                ) : course.lessons.length === 0 ? (
                  <p className="text-sm opacity-70">
                    No lessons found for this course.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {course.lessons.map((lesson, i) => (
                      <li
                        key={lesson.id ?? i}
                        className="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2 hover:bg-base-300 transition"
                      >
                        <span>{getLessonTitle(lesson, i)}</span>
                        <span
                          className={`badge ${
                            lesson.completed
                              ? "badge-success"
                              : lesson.hasJoinedClassroom
                              ? "badge-info"
                              : "badge-error"
                          }`}
                        >
                          {lesson.completed
                            ? "Done"
                            : lesson.hasJoinedClassroom
                            ? "In Progress"
                            : "Classroom not yet chosen"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
