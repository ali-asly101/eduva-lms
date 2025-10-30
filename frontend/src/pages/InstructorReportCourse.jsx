// frontend/src/pages/InstructorReportCourse.jsx
import axios from "axios";
import {
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const InstructorReportCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [expandedLessons, setExpandedLessons] = useState({});
  const [lessonClassrooms, setLessonClassrooms] = useState({});

  // ✅ Move fetchCourseReport INSIDE the component
  const fetchCourseReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/reports/course/${courseId}`);
      setReportData(response.data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching course report:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Move toggleLessonExpand INSIDE the component
  const toggleLessonExpand = async (lessonId) => {
    const isExpanding = !expandedLessons[lessonId];

    setExpandedLessons((prev) => ({
      ...prev,
      [lessonId]: isExpanding,
    }));

    if (isExpanding && !lessonClassrooms[lessonId]) {
      try {
        const response = await axios.get(
          `/api/reports/lesson/${lessonId}/classrooms`
        );
        setLessonClassrooms((prev) => ({
          ...prev,
          [lessonId]: response.data.classrooms,
        }));
      } catch (err) {
        console.error("Error fetching lesson classrooms:", err);
      }
    }
  };

  useEffect(() => {
    fetchCourseReport();
  }, [courseId]);

  // Prepare data for student progress bar chart
  const getStudentProgressChartData = () => {
    if (!reportData?.students) return [];

    return reportData.students.map((student) => ({
      name: `${student.first_name} ${student.last_name}`,
      progress: student.progress || 0,
      credits: student.credits || 0,
      studentId: student.student_id,
    }));
  };

  // Color scale for progress bars
  const getProgressColor = (progress) => {
    if (progress >= 80) return "#10b981"; // green
    if (progress >= 50) return "#f59e0b"; // orange
    return "#ef4444"; // red
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="container mx-auto p-6">
        <div className="alert alert-warning">
          <span>No report data available</span>
        </div>
      </div>
    );
  }

  const { course, statistics, students, lessons } = reportData;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="bg-base-200 rounded-box px-4 py-2">
          <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
          <p className="text-gray-600">{course.description}</p>
        </div>
        <button
          onClick={() => navigate("/instructor/report")}
          className="btn btn-neutral btn-sm ml-6"
        >
          ← Back to Reports
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="stat bg-base-200 rounded-lg shadow">
          <div className="stat-figure text-primary">
            <Users size={32} />
          </div>
          <div className="stat-title">Total Students</div>
          <div className="stat-value text-primary">
            {statistics.total_students}
          </div>
        </div>

        <div className="stat bg-base-200 rounded-lg shadow">
          <div className="stat-figure text-secondary">
            <TrendingUp size={32} />
          </div>
          <div className="stat-title">Avg Progress</div>
          <div className="stat-value text-secondary">
            {parseFloat(statistics.average_progress || 0).toFixed(1)}%
          </div>
        </div>

        <div className="stat bg-base-200 rounded-lg shadow">
          <div className="stat-figure text-accent">
            <Award size={32} />
          </div>
          <div className="stat-title">Avg Credits</div>
          <div className="stat-value text-accent">
            {parseFloat(statistics.average_credits || 0).toFixed(1)}
          </div>
        </div>

        <div className="stat bg-base-200 rounded-lg shadow">
          <div className="stat-figure">
            <BookOpen size={32} />
          </div>
          <div className="stat-title">Total Lessons</div>
          <div className="stat-value">{statistics.total_lessons}</div>
        </div>
      </div>

      {/* Student Progress Bar Chart */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <h2 className="card-title mb-4">Student Progress Comparison</h2>
          {students.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={getStudentProgressChartData()}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis
                  label={{
                    value: "Progress (%)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                  domain={[0, 100]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-base-100 border border-base-300 p-3 rounded shadow-lg">
                          <p className="font-semibold">{data.name}</p>
                          <p className="text-sm">
                            Student ID: {data.studentId}
                          </p>
                          <p className="text-sm">Progress: {data.progress}%</p>
                          <p className="text-sm">Credits: {data.credits}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="progress" name="Progress %" radius={[8, 8, 0, 0]}>
                  {getStudentProgressChartData().map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getProgressColor(entry.progress)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No students enrolled yet
            </div>
          )}
        </div>
      </div>

      {/* Lessons Table with Classroom Breakdown */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">Lesson Performance</h2>

          {lessons.length > 0 ? (
            <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-box">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Lesson</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Credit Value</th>
                    <th>Completed</th>
                    <th>Completion %</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((lesson) => (
                    <React.Fragment key={lesson.id}>
                      <tr className="hover">
                        <td>
                          <div className="font-semibold">{lesson.title}</div>
                          <div className="text-sm text-gray-500">
                            {lesson.lesson_id}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              lesson.status === "published"
                                ? "badge-success"
                                : lesson.status === "archived"
                                ? "badge-error"
                                : "badge-warning"
                            }`}
                          >
                            {lesson.status}
                          </span>
                        </td>
                        <td>{lesson.content_type}</td>
                        <td>{lesson.credit_value}</td>
                        <td>
                          {lesson.students_completed} /{" "}
                          {lesson.total_enrolled_students}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <progress
                              className="progress progress-primary w-20"
                              value={lesson.completion_percentage}
                              max="100"
                            ></progress>
                            <span className="text-sm">
                              {parseFloat(
                                lesson.completion_percentage || 0
                              ).toFixed(0)}
                              %
                            </span>
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => toggleLessonExpand(lesson.id)}
                            className="btn btn-ghost btn-sm"
                          >
                            {expandedLessons[lesson.id] ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                            Classrooms
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Classroom Details */}
                      {expandedLessons[lesson.id] && (
                        <tr>
                          <td colSpan="7" className="bg-base-200">
                            <div className="p-4">
                              <h4 className="font-semibold mb-3">
                                Classroom Breakdown
                              </h4>
                              {lessonClassrooms[lesson.id] ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {lessonClassrooms[lesson.id].map(
                                    (classroom) => (
                                      <div
                                        key={classroom.id}
                                        className="card bg-base-100 shadow-sm"
                                      >
                                        <div className="card-body p-4">
                                          <h5 className="font-semibold">
                                            {classroom.classroom_id}
                                          </h5>
                                          <div className="text-sm space-y-1">
                                            <p>
                                              Duration:{" "}
                                              {classroom.duration_weeks} weeks
                                            </p>
                                            <p>
                                              Students:{" "}
                                              {classroom.total_students} /{" "}
                                              {classroom.max_capacity}
                                            </p>
                                            <p>
                                              Completed:{" "}
                                              {classroom.students_completed} (
                                              {parseFloat(
                                                classroom.completion_percentage ||
                                                  0
                                              ).toFixed(0)}
                                              %)
                                            </p>
                                            {classroom.supervisors &&
                                              classroom.supervisors.length >
                                                0 && (
                                                <p className="text-xs text-gray-500">
                                                  Supervisors:{" "}
                                                  {classroom.supervisors
                                                    .map(
                                                      (s) =>
                                                        `${s.first_name} ${s.last_name}`
                                                    )
                                                    .join(", ")}
                                                </p>
                                              )}
                                          </div>
                                          <div className="mt-2">
                                            <progress
                                              className="progress progress-success w-full"
                                              value={
                                                classroom.completion_percentage
                                              }
                                              max="100"
                                            ></progress>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              ) : (
                                <div className="flex justify-center py-4">
                                  <span className="loading loading-spinner"></span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No lessons in this course yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorReportCourse;
