// Lessons.jsx
import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

const Lessons = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCourseAndLessons = async () => {
    try {
      console.log("Fetching course with ID:", courseId);

      // Get course details
      const courseRes = await axios.get(`/api/courses/${courseId}`, {
        withCredentials: true,
      });
      console.log("Course response:", courseRes.data);
      setCourse(courseRes.data);

      // Get lessons for this course
      const lessonsRes = await axios.get(`/api/courses/${courseId}/lessons`, {
        withCredentials: true,
      });
      console.log("Lessons response:", lessonsRes.data);
      setLessons(lessonsRes.data);
    } catch (err) {
      console.error("Error fetching course and lessons:", err);
      console.error("Error details:", err.response?.data);
      toast.error("Failed to load course lessons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseAndLessons();
    }
  }, [courseId]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!course) {
    return <div className="p-6">Course not found</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lessons for {course.title}</h1>
          <p className="text-gray-600">Course ID: {course.course_id}</p>
        </div>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded"
          onClick={() => navigate("/instructor")}
        >
          Back to Dashboard
        </button>
      </div>

      <div className="mb-4">
        <p className="text-lg">Total Lessons: {lessons.length}</p>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center mt-8">
          <p className="text-gray-500 text-lg">
            No lessons attached to this course
          </p>
          <p className="text-gray-400">
            Go back to the course editor to attach lessons
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="p-4 border rounded shadow">
              <h3 className="text-lg font-semibold mb-2">{lesson.title}</h3>
              <p className="text-sm text-gray-600 mb-2">
                ID: {lesson.lesson_id}
              </p>

              <div className="mb-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    lesson.status === "published"
                      ? "bg-green-100 text-green-800"
                      : lesson.status === "archived"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {lesson.status?.toUpperCase()}
                </span>
              </div>

              <p className="text-sm mb-1">Type: {lesson.content_type}</p>
              <p className="text-sm mb-1">Credits: {lesson.credit_value}</p>
              {lesson.effort_estimate && (
                <p className="text-sm mb-1">
                  Duration: {lesson.effort_estimate} min
                </p>
              )}

              {lesson.designer_first_name && (
                <p className="text-sm mb-2">
                  Designer: {lesson.designer_first_name}{" "}
                  {lesson.designer_last_name}
                </p>
              )}

              {lesson.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                  {lesson.description}
                </p>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                  onClick={() => {
                    // Navigate to lesson management with edit parameters
                    navigate(`/instructor/lessons?edit=${lesson.id}`);
                  }}
                >
                  Edit
                </button>
                <button
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                  onClick={() => {
                    // add navigation to InstructorLessons.jsx page
                    navigate(
                      `/instructor/instructorlessons/${courseId}?lesson=${lesson.id}`
                    );
                  }}
                >
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Lessons;
