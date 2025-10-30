import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function InstructorCourseStudentList() {
  const { courseId } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true);
        const res = await fetch(`/api/enrolments/${courseId}`);
        if (!res.ok) throw new Error("Failed to fetch students");
        const data = await res.json();

        if (Array.isArray(data)) {
          setStudents(data);
        } else {
          setStudents([]);
          setError(data.message || "No students found.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, [courseId]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Students Enrolled</h1>

      {loading && <div className="loading loading-lg loading-spinner"></div>}

      {error && !loading && (
        <div className="alert bg-neutral text-neutral-content shadow-lg mb-4">
          <span>No Students found for this Course</span>
        </div>
      )}

      {!loading && students.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200">
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Progress</th>
                <th>Credits</th>
                <th>Status</th>
                <th>Date Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.student_id}</td>
                  <td>
                    <div className="font-medium">
                      {student.title} {student.first_name} {student.last_name}
                    </div>
                  </td>
                  <td>{student.email}</td>
                  <td>
                    {student.progress}%
                  </td>
                  <td>{student.credits}</td>
                  <td>
                    <span
                      className={`badge ${
                        student.enrolment_status === "active"
                          ? "badge-success"
                          : "badge-warning"
                      }`}
                    >
                      {student.enrolment_status}
                    </span>
                  </td>
                  <td>
                    {new Date(student.date_enrolled).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && students.length === 0 && !error && (
        <div className="alert alert-info shadow-lg">
          <span>No students enrolled in this course.</span>
        </div>
      )}
    </div>
  );
}

export default InstructorCourseStudentList;
