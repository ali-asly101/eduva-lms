import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import ConfirmationModal from "../components/ConfirmationModal";

// ensure cookies/sessions are sent automatically with requests
axios.defaults.withCredentials = true;
axios.defaults.baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const InstructorDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [instructors, setInstructors] = useState([]);
  const [placeholderLessons, setPlaceholderLessons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState("");
  const [currentInstructorId, setCurrentInstructorId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [formData, setFormData] = useState({
    course_id: "",
    title: "",
    description: "",
    director_id: "",
    total_credits: 30,
    status: "draft",
    lessons: [],
  });

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const res = await axios.get("/api/courses");
      setCourses(res.data);
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  // Fetch instructors for dropdown
  const fetchInstructors = async () => {
    try {
      const res = await axios.get("/api/courses/instructors");
      setInstructors(res.data);
    } catch (err) {
      console.error("Error fetching instructors:", err);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchInstructors();
  }, []);

  // fetch current user (for stamping modified_by) if sessions are enabled.
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/api/auth/me", { withCredentials: true });
        setCurrentInstructorId(res.data?.user?.id || null);
      } catch {
        setCurrentInstructorId(null);
      }
    })();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddLesson = () => {
    const lessonName = window.prompt("Enter lesson name:");
    if (lessonName) {
      setPlaceholderLessons([...placeholderLessons, lessonName]);
    }
  };

  const handleRemoveLesson = (index) => {
    setPlaceholderLessons(placeholderLessons.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (editingCourse) {
        const { data: updated } = await axios.put(
          `/api/courses/${editingCourse.id}`,
          { ...formData, instructorId: currentInstructorId },
          { withCredentials: true }
        );
        setCourses(
          courses.map((course) => (course.id === updated.id ? updated : course))
        );
      } else {
        const { data: created } = await axios.post(
          "/api/courses",
          {
            ...formData,
            lessons: placeholderLessons,
            instructorId: currentInstructorId,
          },
          { withCredentials: true }
        );
        setCourses([created, ...courses]);
      }

      resetForm();
      fetchCourses();
    } catch (err) {
      console.error("Error saving course:", err);
      if (err.response?.status === 409) {
        toast.error(err.response?.data?.error || "Course ID already exists.");
      } else {
        toast.error(err.response?.data?.error || "Failed to save course");
      }
      setError(err.response?.data?.error || "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setItemToDelete(id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`/api/courses/${itemToDelete}`);
      fetchCourses();
    } catch (err) {
      console.error("Error deleting course:", err);
      toast.error(err.response?.data?.error || "Failed to delete course");
    } finally {
      setIsModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleEdit = async (course) => {
    setEditingCourse(course);
    setFormData({
      course_id: course.course_id,
      title: course.title,
      description: course.description,
      director_id: course.director_id || "",
      total_credits: course.total_credits || 30,
      status: course.status || "draft",
      lessons: course.lessons || [],
    });

    setShowForm(true);
    setError("");
  };

  const resetForm = () => {
    setFormData({
      course_id: "",
      title: "",
      description: "",
      director_id: "",
      total_credits: 30,
      status: "draft",
      lessons: [],
    });
    setPlaceholderLessons([]);
    setEditingCourse(null);
    setShowForm(false);
    setError("");
  };

  const getDirectorName = (course) => {
    if (course.director_id) {
      const director = instructors.find(
        (inst) => inst.id === course.director_id
      );
      if (director) {
        return `${director.title} ${director.first_name} ${director.last_name}`;
      }
    }
    return (
      `${course.director_first_name || ""} ${
        course.director_last_name || ""
      }`.trim() || "No director assigned"
    );
  };

  const getModifiedByName = (course) => {
    if (!course?.modified_by) return "";
    const inst = instructors.find((i) => i.id === course.modified_by);
    if (!inst) return "";
    const full = `${inst.title || ""} ${inst.first_name || ""} ${
      inst.last_name || ""
    }`.trim();
    return full || "";
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
      >
        Are you sure you want to delete this course?
      </ConfirmationModal>
      <h1 className="text-2xl font-bold mb-6 bg-base-200 rounded-box px-4 py-2">
        Instructor Dashboard
      </h1>

      <div className="flex justify-between items-center mb-4">
        <button
          className="btn btn-neutral"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Add Course
        </button>
        <div className="w-1/3">
          <input
            type="text"
            placeholder="Search by Course Name or ID"
            className="input input-bordered w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Removed the "Manage Lessons" button — now in sidebar */}

      {showForm && (
        <div className="bg-base-100 p-4 mt-4 rounded-box shadow">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column - Course Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Course Details</h3>

                <div className="mb-3">
                  <label className="block">Course ID</label>
                  <input
                    type="text"
                    name="course_id"
                    value={formData.course_id}
                    onChange={handleChange}
                    required
                    className="border p-2 w-full input input-bordered mt-1"
                  />
                </div>

                <div className="mb-3">
                  <label className="block">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="border p-2 w-full input input-bordered mt-1"
                  />
                </div>

                <div className="mb-3">
                  <label className="block">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="border p-2 w-full h-24 input input-bordered mt-1"
                  />
                </div>

                <div className="mb-3">
                  <label className="block">Course Director</label>
                  <select
                    name="director_id"
                    value={formData.director_id}
                    onChange={handleChange}
                    required
                    className="border p-2 w-full input input-bordered mt-1"
                  >
                    <option value="">Select a director...</option>
                    {instructors.map((instructor) => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.title} {instructor.first_name}{" "}
                        {instructor.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="block">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="border p-2 w-full input input-bordered mt-1"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="block">Total Credits (Not Editable)</label>
                  <input
                    type="number"
                    name="total_credits"
                    value={30}
                    readOnly
                    className="border p-2 w-full cursor-not-allowed input input-bordered mt-1"
                  />
                </div>

                <div className="mb-3">
                  <label className="block">Total Lessons (Not Editable)</label>
                  <input
                    type="number"
                    value={placeholderLessons.length}
                    className="border p-2 w-full cursor-not-allowed input input-bordered mt-1"
                    readOnly
                  />
                </div>
              </div>

              {/* Right Column - Lesson Management */}
              {!editingCourse && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Placeholder Lessons
                  </h3>
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={handleAddLesson}
                      className="btn btn-neutral"
                    >
                      Add Lesson
                    </button>
                  </div>
                  <div className="border border-base-200 rounded p-2 h-48 overflow-y-auto">
                    {placeholderLessons.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        No placeholder lessons added.
                      </p>
                    ) : (
                      placeholderLessons.map((lesson, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-1 border-b"
                        >
                          <span className="text-sm">{lesson}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLesson(index)}
                            className="btn btn-ghost btn-xs text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                className="btn btn-success"
                disabled={loading}
                aria-busy={loading}
              >
                {editingCourse ? "Update Course" : "Create Course"}
              </button>
              <button type="button" className="btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="p-4 border  border-base-300 rounded-box shadow bg-base-100"
          >
            <h2 className="text-lg font-semibold">{course.title}</h2>
            <p className="text-sm text-base-content/70">
              Course ID: {course.course_id}
            </p>
            <p className="text-sm">
              <span
                className={`px-2 py-1 rounded text-xs ${
                  course.status === "active"
                    ? "bg-green-100 text-green-800"
                    : course.status === "inactive"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {course.status?.toUpperCase()}
              </span>
            </p>
            <p className="text-sm">Director: {getDirectorName(course)}</p>
            <p className="text-sm">
              Credits: {course.total_credits} | Lessons:{" "}
              {course.lesson_count || course.total_lessons || 0}
            </p>
            {course.active_classrooms !== undefined && (
              <p className="text-sm">
                Active Classrooms: {course.active_classrooms}
              </p>
            )}

            {(course.modified_at || course.modified_by) && (
              <div className="text-xs text-base-content/70 mt-1">
                {course.modified_at && (
                  <p>
                    Last modified at:{" "}
                    {new Date(course.modified_at).toLocaleString()}
                  </p>
                )}
                {getModifiedByName(course) && (
                  <p>
                    Last modified by:{" "}
                    <span className="font-medium">
                      {getModifiedByName(course)}
                    </span>
                  </p>
                )}
              </div>
            )}

            <div className="mt-3 flex gap-2 flex-wrap">
              <button
                className="btn btn-warning btn-sm"
                onClick={() => handleEdit(course)}
              >
                Edit
              </button>
              <button
                className="btn btn-error btn-sm"
                onClick={() => handleDelete(course.id)}
              >
                Delete
              </button>
              <Link
                to={`/instructor/courses/${course.id}/lessons`}
                className="btn btn-info btn-sm"
              >
                Lessons
              </Link>
              <button
                className="btn btn-success btn-sm"
                onClick={() =>
                  (window.location.href = `/instructor/courses/${course.id}/classrooms`)
                }
              >
                Classrooms
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center mt-8 bg-base-200 rounded-box px-4 py-2">
          <p className="text-base-content/70 text-lg">No courses found</p>
          <p className="text-base-content/70">
            Create your first course to get started
          </p>
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
