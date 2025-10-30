import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function InstructorStudents() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true);
        const res = await fetch(`/api/users`);
        if (!res.ok) throw new Error("Failed to fetch students");
        const data = await res.json();

        if (Array.isArray(data)) {
          setStudents(data.filter((user) => user.role === "student"));
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
  }, []);

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const studentId = String(student.student_id ?? "")
      .toLowerCase()
      .trim();
    const term = searchTerm.toLowerCase().trim();
    return fullName.includes(term) || studentId.includes(term);
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 bg-base-200 rounded-box px-4 py-2">
        Students
      </h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by Student ID or Name"
          className="input input-bordered w-full max-w-xs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && <div className="loading loading-lg loading-spinner"></div>}

      {error && !loading && (
        <div className="alert bg-neutral text-neutral-content shadow-lg mb-4">
          <span>{error}</span>
        </div>
      )}

      {!loading && filteredStudents.length > 0 && (
        <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-box">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200">
                <th>Student ID</th>
                <th>Title</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Date Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>{student.student_id}</td>
                  <td>{student.title || "—"}</td>
                  <td>{student.first_name || "—"}</td>
                  <td>{student.last_name || "—"}</td>
                  <td>{new Date(student.created_at).toLocaleDateString()}</td>
                  <td className="flex gap-2">
                    <Link
                      to={`/instructor/students/${student.id}/profile`}
                      className="btn btn-sm btn-neutral"
                    >
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filteredStudents.length === 0 && !error && (
        <div className="alert alert-info shadow-lg">
          <span>No students found.</span>
        </div>
      )}
    </div>
  );
}
