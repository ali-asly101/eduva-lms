import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function InstructorReport() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("students");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // 1️⃣ Fetch all users and filter to students
        const usersRes = await axios.get("/api/users");
        const list = Array.isArray(usersRes.data)
          ? usersRes.data.filter((u) => u.role === "student")
          : [];

        // 2️⃣ Enrich each student with real credit totals from backend
        const enriched = await Promise.all(
          list.map(async (s) => {
            try {
              // get profile (includes credits_total)
              const profRes = await axios.get(
                `/api/users/students/${s.id}/profile`
              );
              const profile = profRes.data;

              // get detailed progress summary
              const summaryRes = await axios.get(
                `/api/students/${s.id}/progress-summary`
              );
              const summary = Array.isArray(summaryRes.data)
                ? summaryRes.data
                : [];

              // total lessons & done lessons for percentage
              let totalLessons = 0;
              let doneLessons = 0;
              summary.forEach((course) => {
                course.lessons.forEach((l) => {
                  totalLessons++;
                  if (l.status === "Complete") doneLessons++;
                });
              });

              const pct =
                totalLessons > 0
                  ? Math.round((doneLessons / totalLessons) * 100)
                  : 0;

              const gainedCredits = Math.round(profile.credits_total || 0);
              const totalCredits = 120; // 4 courses × 30 credits

              return {
                ...s,
                enrolCount: summary.length,
                totalLessons,
                doneLessons,
                pct,
                gainedCredits,
                totalCredits,
              };
            } catch (e) {
              console.error("Error enriching student:", s.id, e);
              return {
                ...s,
                enrolCount: 0,
                totalLessons: 0,
                doneLessons: 0,
                pct: 0,
                totalCredits: 120,
                gainedCredits: 0,
              };
            }
          })
        );

        setStudents(enriched);

        // 3️⃣ Fetch all courses (not limited to instructor-owned)
        const coursesRes = await axios.get(`/api/reports/courses`);
        setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
      } catch (e) {
        console.error(e);
        setError("Failed to fetch report data.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // 🔍 Search filtering
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.first_name ?? ""} ${
      student.last_name ?? ""
    }`.toLowerCase();
    const studentId = String(student.student_id ?? "")
      .toLowerCase()
      .trim();
    const term = searchTerm.toLowerCase().trim();
    return fullName.includes(term) || studentId.includes(term);
  });

  const filteredCourses = courses.filter((course) => {
    const term = searchTerm.toLowerCase().trim();
    return (
      course.title.toLowerCase().includes(term) ||
      course.course_id.toLowerCase().includes(term)
    );
  });

  // 🖼️ UI rendering
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 bg-base-200 rounded-box px-4 py-2">
        Instructor Reports
      </h1>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-4 px-4 py-2 rounded-box">
        <a
          className={`tab ${activeTab === "students" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("students")}
        >
          Student Reports
        </a>
        <a
          className={`tab ${activeTab === "courses" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("courses")}
        >
          Course Reports
        </a>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder={
            activeTab === "students"
              ? "Search by Student ID or Name"
              : "Search by Course Title or ID"
          }
          className="input input-bordered w-full max-w-xs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && <div className="loading loading-lg loading-spinner"></div>}

      {error && !loading && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      {/* Student Reports Tab */}
      {!loading && activeTab === "students" && (
        <>
          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-box">
              <table className="table table-zebra w-full">
                <thead>
                  <tr className="bg-base-200">
                    <th>ID</th>
                    <th>Title</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Courses Enrolled</th>
                    <th>Lesson Progress</th>
                    <th>Credit Progress (out of 120)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id}>
                      <td>{s.student_id || "—"}</td>
                      <td>{s.title || "—"}</td>
                      <td>{s.first_name || "—"}</td>
                      <td>{s.last_name || "—"}</td>
                      <td>{s.enrolCount}</td>

                      {/* Lesson Progress */}
                      <td>
                        <div className="flex items-center gap-2">
                          <progress
                            className="progress progress-primary w-40"
                            value={s.pct}
                            max="100"
                          ></progress>
                          <span className="text-sm opacity-70">{s.pct}%</span>
                        </div>
                      </td>

                      {/* Credit Progress */}
                      <td>
                        <div className="flex items-center gap-2">
                          <progress
                            className="progress progress-accent w-40"
                            value={s.gainedCredits}
                            max={s.totalCredits}
                          ></progress>
                          <span className="text-sm opacity-70">
                            {s.gainedCredits}/{s.totalCredits}
                          </span>
                        </div>
                      </td>

                      <td>
                        <Link
                          to={`/instructor/report/${s.id}/progress`}
                          className="btn btn-sm btn-primary normal-case"
                        >
                          View Progress
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-info shadow-lg">
              <span>No students found.</span>
            </div>
          )}
        </>
      )}

      {/* Course Reports Tab */}
      {!loading && activeTab === "courses" && (
        <>
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
                  onClick={() =>
                    navigate(`/instructor/report/course/${course.id}`)
                  }
                >
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="card-title text-lg">{course.title}</h2>
                      <span
                        className={`badge ${
                          course.status === "active"
                            ? "badge-success"
                            : course.status === "inactive"
                            ? "badge-error"
                            : "badge-warning"
                        }`}
                      >
                        {course.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                      {course.course_id}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="stat bg-base-200 rounded-lg p-3">
                        <div className="stat-title text-xs">Students</div>
                        <div className="stat-value text-2xl">
                          {course.total_students_enrolled}
                        </div>
                      </div>

                      <div className="stat bg-base-200 rounded-lg p-3">
                        <div className="stat-title text-xs">Lessons</div>
                        <div className="stat-value text-2xl">
                          {course.total_lessons}
                        </div>
                      </div>

                      <div className="stat bg-base-200 rounded-lg p-3">
                        <div className="stat-title text-xs">Avg Progress</div>
                        <div className="stat-value text-xl">
                          {parseFloat(course.average_progress).toFixed(0)}%
                        </div>
                      </div>

                      <div className="stat bg-base-200 rounded-lg p-3">
                        <div className="stat-title text-xs">Avg Credits</div>
                        <div className="stat-value text-xl">
                          {parseFloat(course.average_credits).toFixed(0)}
                        </div>
                      </div>
                    </div>

                    <div className="card-actions justify-end">
                      <button className="btn btn-primary btn-sm">
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="alert alert-info shadow-lg">
              <span>No courses found.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
