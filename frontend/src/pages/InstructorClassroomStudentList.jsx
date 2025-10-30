import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function InstructorClassroomStudentList() {
  const { classroomId } = useParams();
  const [students, setStudents] = useState([]);
  const [classroomInfo, setClassroomInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setLoading(true);
      setError("");
      try {
        // Optional: fetch classroom header info for context (ignore failures)
        try {
          const clsRes = await fetch(`/api/classrooms/${classroomId}`, {
            credentials: "include",
          });
          if (clsRes.ok) {
            const cls = await clsRes.json();
            if (isMounted) setClassroomInfo(cls);
          }
        } catch {}

        // Fetch students in this classroom
        const res = await fetch(`/api/classrooms/${classroomId}/students`, {
          credentials: "include",
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.message || `Failed to fetch students (HTTP ${res.status})`);
        }
        const data = await res.json();

        if (!isMounted) return;

        if (Array.isArray(data)) {
          setStudents(data);
        } else if (data && Array.isArray(data.students)) {
          setStudents(data.students);
        } else {
          setStudents([]);
          setError(data?.message || "No students found.");
        }
      } catch (e) {
        if (!isMounted) return;
        setError(e.message || "Failed to load students.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    run();
    return () => {
      isMounted = false;
    };
  }, [classroomId]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          Classroom Students
          {classroomInfo?.classroom_id ? (
            <span className="ml-2 text-base font-normal text-gray-600">
              — {classroomInfo.classroom_id}
              {classroomInfo.course_title ? ` (${classroomInfo.course_title})` : ""}
            </span>
          ) : null}
        </h1>
        <Link
          to="/instructor/classrooms"
          className="btn btn-sm btn-neutral normal-case"
        >
          ← Back to Classrooms
        </Link>
      </div>

      {loading && (
        <div className="loading loading-lg loading-spinner" aria-label="Loading" />
      )}

      {error && !loading && (
        <div className="alert bg-neutral text-neutral-content shadow-lg mb-4">
          <span>{error}</span>
        </div>
      )}

      {!loading && students.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200">
                <th>Student ID</th>
                <th>Title &amp; Name</th>
                <th>Email</th>
                <th>Date Joined</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id || s.student_id}>
                  <td>{s.student_id}</td>
                  <td>
                    <div className="font-medium">
                      {s.title} {s.first_name} {s.last_name}
                    </div>
                  </td>
                  <td>{s.email}</td>
                  <td>
                    {s.date_enrolled
                      ? new Date(s.date_enrolled).toLocaleString()
                      : s.created_at
                      ? new Date(s.created_at).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && students.length === 0 && !error && (
        <div className="alert alert-info shadow-lg">
          <span>No students in this classroom yet.</span>
        </div>
      )}
    </div>
  );
}
