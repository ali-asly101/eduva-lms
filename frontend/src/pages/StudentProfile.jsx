// src/pages/StudentProfile.jsx
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export default function StudentProfile() {
  const { userId, role } = useAuthStore();
  const { id: paramsId } = useParams();

  const studentId = role === "student" ? userId : paramsId;

  // profile comes from /api/users/students/:id/profile (has credits_total + counts)
  const [profile, setProfile] = useState(null);

  // detailed course/lesson/classroom status (kept as-is)
  const [summary, setSummary] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!studentId) {
        setErr("Please log in to view your profile.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErr("");

      try {
        // 1) Profile + rollups (credits_total, counts)
        const { data: prof } = await axios.get(
          `/api/users/students/${studentId}/profile`,
          { withCredentials: true }
        );
        if (!cancelled) setProfile(prof);

        // 2) Detailed course/lesson/classroom/status summary
        const { data: s } = await axios.get(
          `/api/students/${studentId}/progress-summary`,
          { withCredentials: true }
        );
        if (!cancelled) setSummary(Array.isArray(s) ? s : []);
      } catch (e) {
        console.error("Failed to load profile:", e);
        if (!cancelled) {
          setErr(e?.response?.data?.error || "Failed to load profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const totals = useMemo(() => {
    return {
      courseCount: summary.length,
    };
  }, [summary]);

  if (!studentId) {
    return (
      <div className="p-6">
        <div className="alert alert-warning">
          <span>Please log in to view your profile.</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="skeleton h-28 w-full" />
          <div className="skeleton h-28 w-full" />
          <div className="skeleton h-28 w-full" />
        </div>
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-6">
        <div className="alert alert-error">
          <span>{err}</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-6 text-gray-500">No profile data.</div>;
  }

  const fullName = `${profile?.title ? profile.title + " " : ""}${
    profile?.last_name ?? ""
  } ${profile?.first_name ?? ""}`.trim();

  // Real credits from backend (sum of student_enrolments.credits)
  const totalTargetCredits = 120; // 4 courses x 30 credits
  const credits = Number(profile.credits_total || 0);
  const clampedCredits = Math.max(0, Math.min(credits, totalTargetCredits));
  const pct = Math.round((clampedCredits / totalTargetCredits) * 100);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="bg-base-200 rounded-box px-4 py-2">
          <h1 className="text-2xl font-bold">Student Profile</h1>
          <p className="text-gray-500">{fullName}</p>
        </div>
        {role === "student" ? (
          <Link to="/student" className="btn btn-neutral btn-sm">
            Back to Dashboard
          </Link>
        ) : (
          <Link to="/instructor/students" className="btn btn-neutral btn-sm">
            Go Back to Student List
          </Link>
        )}
      </div>

      {/* Top 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Identity */}
        <div className="card bg-base-100 border">
          <div className="card-body">
            <h2 className="card-title text-lg">Student Details</h2>
            <div className="mt-2 text-sm">
              <div>
                <span className="font-medium">Title:</span>{" "}
                {profile?.title || "—"}
              </div>
              <div>
                <span className="font-medium">Last Name:</span>{" "}
                {profile?.last_name || "—"}
              </div>
              <div>
                <span className="font-medium">First Name:</span>{" "}
                {profile?.first_name || "—"}
              </div>
              <div>
                <span className="font-medium">Email:</span>{" "}
                {profile?.email || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Courses Enrolled (now from summary length to match your per-course cards) */}
        <div className="card bg-base-100 border">
          <div className="card-body">
            <h2 className="card-title text-lg">Courses Enrolled</h2>
            <p className="text-3xl font-bold">{totals.courseCount}</p>
            <p className="text-xs text-gray-500">Total courses enrolled in.</p>
          </div>
        </div>

        {/* Card 3: Credit Progress (real: X / 120) */}
        <div className="card bg-base-100 border">
          <div className="card-body">
            <h2 className="card-title text-lg">Credit Progress</h2>
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span>
                  {clampedCredits} / {totalTargetCredits} credits
                </span>
                <span>{pct}%</span>
              </div>
              <progress
                className="progress progress-primary w-full"
                value={clampedCredits}
                max={totalTargetCredits}
              />
              <p className="text-xs text-gray-500 mt-2">
                Goal: Complete 4 courses (30 credits each) to reach 120 credits.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Per-course lesson status cards (kept) */}
      <div className="space-y-4">
        {summary.length === 0 ? (
          <div className="card bg-base-100 border">
            <div className="card-body">
              <h2 className="card-title text-lg">Your Courses</h2>
              <p className="text-sm text-gray-500">
                You have no active enrollments yet.
              </p>
            </div>
          </div>
        ) : (
          summary.map((course) => (
            <div key={course.course_id} className="card bg-base-100 border">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {course.course_title}
                  </h3>
                </div>

                {/* Lessons table */}
                <div className="mt-3 overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr className="bg-base-2 00">
                        <th>Lesson</th>
                        <th>Classroom</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.lessons.map((l) => (
                        <tr key={l.lesson_id}>
                          <td>{l.lesson_title}</td>
                          <td>{l.classroom_code ? l.classroom_code : "—"}</td>
                          <td>
                            <span
                              className={`badge ${
                                l.status === "done"
                                  ? "badge-success"
                                  : "badge-warning"
                              }`}
                            >
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {course.lessons.length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-sm text-gray-500">
                            No lessons found for this course.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
