import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const ClassroomManagement = () => {
  // Lists
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [lecturers, setLecturers] = useState([]);

  // Selections
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [selectedLecturer, setSelectedLecturer] = useState("");

  const [loading, setLoading] = useState(false);

  // --------- Fetching ----------
  const fetchCourses = async () => {
    try {
      const res = await axios.get("/api/courses");
      setCourses(res.data);
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const fetchLessons = async (courseId) => {
    if (!courseId) return setLessons([]);
    try {
      const res = await axios.get(`/api/courses/${courseId}/lessons`);
      setLessons(res.data);
    } catch (err) {
      console.error("Error fetching lessons:", err);
    }
  };

  const fetchClassrooms = async (lessonId) => {
    if (!lessonId) return setClassrooms([]);
    try {
      const res = await axios.get(`/api/lessons/${lessonId}/classrooms`);
      setClassrooms(res.data);
    } catch (err) {
      console.error("Error fetching classrooms:", err);
    }
  };

  const fetchLecturers = async () => {
    try {
      const res = await axios.get("/api/courses/instructors");
      setLecturers(res.data);
    } catch (err) {
      console.error("Error fetching lecturers:", err);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchLecturers();
  }, []);

  // Fetch lessons when course changes
  useEffect(() => {
    fetchLessons(selectedCourse);
    setSelectedLesson("");
    setClassrooms([]);
    setSelectedClassroom("");
  }, [selectedCourse]);

  // Fetch classrooms when lesson changes
  useEffect(() => {
    fetchClassrooms(selectedLesson);
    setSelectedClassroom("");
  }, [selectedLesson]);

  // --------- Handlers ----------
  const handleAssignSupervisor = async (instructor_id) => {
    if (!selectedClassroom || !instructor_id) return;

    setLoading(true);
    try {
      const payload = {
        classroom_id: selectedClassroom, // selectedClassroom is the ID string
        instructor_id,
      };
      await axios.post(
        `/api/classrooms/${selectedClassroom}/supervisors`,
        payload
      );
      toast.success("Supervisor assigned successfully");
    } catch (err) {
      console.error("Error assigning supervisor:", err);
      toast.error(err.response?.data?.message || "Failed to assign supervisor");
    } finally {
      setLoading(false);
    }
  };

  // --------- Render ----------
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Classroom Management</h1>

      {/* Course Selection */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Select Course:</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="border p-2 w-full"
        >
          <option value="">-- Choose a course --</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Lesson Selection */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Select Lesson:</label>
        <select
          value={selectedLesson}
          onChange={(e) => setSelectedLesson(e.target.value)}
          className="border p-2 w-full"
          disabled={!selectedCourse}
        >
          <option value="">-- Choose a lesson --</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
      </div>

      {/* Classroom Selection */}
      {classrooms.length > 0 && (
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Select Classroom:</label>
          <select
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            className="border p-2 w-full"
          >
            <option value="">-- Choose a classroom --</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.classroom_id} ({c.status})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Lecturer Selection */}
      {selectedClassroom && (
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Select Lecturer:</label>
          <select
            value={selectedLecturer}
            onChange={(e) => setSelectedLecturer(e.target.value)}
            className="border p-2 w-full"
          >
            <option value="">-- Choose a lecturer --</option>
            {lecturers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.first_name} {l.last_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Assign Button */}
      {selectedClassroom && selectedLecturer && (
        <button
          onClick={() => handleAssignSupervisor(selectedLecturer)}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          {loading ? "Assigning..." : "Assign Supervisor"}
        </button>
      )}

      {/* Classroom Details */}
      {classrooms.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((c) => (
            <div
              key={c.id}
              className="p-4 border border-base-300 rounded shadow"
            >
              <h3 className="text-lg font-semibold">{c.classroom_id}</h3>
              <p className="text-sm text-gray-600">
                <strong>Duration:</strong> {c.duration_weeks} weeks
              </p>
              <p className="text-sm text-gray-600">
                <strong>Capacity:</strong> {c.max_capacity}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Status:</strong> {c.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassroomManagement;
