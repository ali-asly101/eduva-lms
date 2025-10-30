// InstructorCourseLessonManagement.jsx
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmationModal from "../components/ConfirmationModal";

function safeParseJSON(maybeJson, fallback) {
  try {
    const v = JSON.parse(maybeJson ?? "");
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

const CourseLessonManagement = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Data
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [instructors, setInstructors] = useState([]);

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Classroom creation state
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [selectedLessonForClassroom, setSelectedLessonForClassroom] =
    useState(null);
  const [classroomForm, setClassroomForm] = useState({
    classroom_id: "",
    duration_weeks: 2,
    max_capacity: 30,
    status: "active",
  });
  const [newlyCreatedClassroom, setNewlyCreatedClassroom] = useState(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    lesson_id: "",
    title: "",
    description: "",
    objectives: "",
    reading_list: "",
    effort_estimate: 60,
    credit_value: 1,
    content_type: "article",
    content_url: "",
    content_body: "",
    designer_id: "",
    status: "draft",
  });

  // Arrays managed in UI; saved as JSON strings in DB
  const [selectedPrereqIds, setSelectedPrereqIds] = useState([]);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [newAssignment, setNewAssignment] = useState("");

  // --------- Fetching ----------
  const fetchCourse = async () => {
    try {
      const res = await axios.get(`/api/courses/${courseId}`);
      setCourse(res.data);
    } catch (err) {
      console.error("Error fetching course:", err);
    }
  };

  const fetchLessons = async () => {
    try {
      const res = await axios.get(`/api/courses/${courseId}/lessons`);
      setLessons(res.data);
    } catch (err) {
      console.error("Error fetching lessons:", err);
    }
  };

  const fetchInstructors = async () => {
    try {
      const res = await axios.get("/api/courses/instructors");
      setInstructors(res.data);
    } catch (err) {
      console.error("Error fetching instructors:", err);
    }
  };

  useEffect(() => {
    fetchCourse();
    fetchLessons();
    fetchInstructors();
  }, [courseId]);

  // --------- Handlers ----------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      lesson_id: "",
      title: "",
      description: "",
      objectives: "",
      reading_list: "",
      effort_estimate: 60,
      credit_value: 1,
      content_type: "article",
      content_url: "",
      content_body: "",
      designer_id: "",
      status: "draft",
    });
    setSelectedPrereqIds([]);
    setAssignmentsList([]);
    setNewAssignment("");
    setEditingLesson(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      prerequisites: JSON.stringify(selectedPrereqIds),
      assignments: JSON.stringify(assignmentsList),
      course_id: courseId,
      created_by: formData.designer_id || undefined,
    };

    try {
      if (editingLesson) {
        await axios.put(`/api/lessons/${editingLesson.id}`, payload);
      } else {
        await axios.post("/api/lessons", payload);
      }
      await fetchLessons();
      resetForm();
    } catch (err) {
      console.error("Error saving lesson:", err);
      if (err.response?.status === 409) {
        toast.error(err.response?.data?.error || "Lesson ID already exists.");
      } else {
        toast.error(err.response?.data?.error || "Failed to save lesson");
      }
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
      await axios.delete(`/api/lessons/${itemToDelete}`);
      fetchLessons();
    } catch (err) {
      console.error("Error deleting lesson:", err);
      toast.error(err.response?.data?.error || "Failed to delete lesson");
    } finally {
      setIsModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleEdit = (lesson) => {
    setEditingLesson(lesson);

    const parsedPrereqs = safeParseJSON(lesson.prerequisites, []);
    const parsedAssignments = safeParseJSON(lesson.assignments, []);

    setFormData({
      lesson_id: lesson.lesson_id || "",
      title: lesson.title || "",
      description: lesson.description || "",
      objectives: lesson.objectives || "",
      reading_list: lesson.reading_list || "",
      effort_estimate: lesson.effort_estimate ?? 60,
      credit_value: lesson.credit_value ?? 1,
      content_type: lesson.content_type || "article",
      content_url: lesson.content_url || "",
      content_body: lesson.content_body || "",
      designer_id: lesson.designer_id || "",
      status: lesson.status || "draft",
    });
    setSelectedPrereqIds(parsedPrereqs);
    setAssignmentsList(parsedAssignments);
    setShowForm(true);
  };

  const getDesignerName = (lesson) => {
    if (lesson.designer_id) {
      const d = instructors.find((i) => i.id === lesson.designer_id);
      if (d) return `${d.first_name} ${d.last_name}`;
    }
    return lesson.designer_first_name && lesson.designer_last_name
      ? `${lesson.designer_first_name} ${lesson.designer_last_name}`
      : "No designer assigned";
  };

  const prerequisiteOptions = useMemo(() => {
    const editingId = editingLesson?.id;
    return lessons.filter((l) => l.id !== editingId);
  }, [lessons, editingLesson]);

  const togglePrereq = (id) => {
    setSelectedPrereqIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addAssignment = () => {
    const s = newAssignment.trim();
    if (!s) return;
    setAssignmentsList((prev) => [...prev, s]);
    setNewAssignment("");
  };

  const removeAssignment = (idx) => {
    setAssignmentsList((prev) => prev.filter((_, i) => i !== idx));
  };

  const filteredLessons = lessons.filter(
    (lesson) =>
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lesson.lesson_id &&
        lesson.lesson_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openClassroomModal = (lesson) => {
    setSelectedLessonForClassroom(lesson);
    setShowClassroomModal(true);
  };

  const closeClassroomModal = () => {
    setShowClassroomModal(false);
    setSelectedLessonForClassroom(null);
    setNewlyCreatedClassroom(null);
    setSelectedSupervisor("");
    setClassroomForm({
      classroom_id: "",
      duration_weeks: 2,
      max_capacity: 30,
      status: "active",
    });
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    if (!selectedLessonForClassroom) return;
    setLoading(true);

    try {
      const payload = {
        ...classroomForm,
        lesson_id: selectedLessonForClassroom.id,
        course_id: courseId,
        duration_weeks: Number(classroomForm.duration_weeks),
        max_capacity: Number(classroomForm.max_capacity),
        created_by: window.localStorage.getItem("userId"),
      };

      const res = await axios.post(
        `/api/lessons/${selectedLessonForClassroom.id}/classrooms`,
        payload
      );
      setNewlyCreatedClassroom(res.data);
      toast.success("Classroom created! You can now assign a supervisor.");
    } catch (err) {
      console.error("Error creating classroom:", err);
      toast.error(err.response?.data?.message || "Failed to create classroom");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSupervisor = async () => {
    if (!newlyCreatedClassroom || !selectedSupervisor) return;
    setLoading(true);

    try {
      await axios.post(
        `/api/classrooms/${newlyCreatedClassroom.id}/supervisors`,
        {
          classroom_id: newlyCreatedClassroom.id,
          instructor_id: selectedSupervisor,
        }
      );
      toast.success("Supervisor assigned successfully");
      setSelectedSupervisor(""); // Reset for next potential assignment
      // Optionally, you could close the modal here or let the user assign more
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
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
      >
        Are you sure you want to delete this lesson?
      </ConfirmationModal>

      {/* Classroom Creation Modal */}
      {showClassroomModal && selectedLessonForClassroom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              Create Classroom for: {selectedLessonForClassroom.title}
            </h2>

            {/* Classroom Creation Form */}
            {!newlyCreatedClassroom ? (
              <form onSubmit={handleCreateClassroom}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">
                      Classroom ID *
                    </label>
                    <input
                      type="text"
                      name="classroom_id"
                      value={classroomForm.classroom_id}
                      onChange={(e) =>
                        setClassroomForm({
                          ...classroomForm,
                          classroom_id: e.target.value,
                        })
                      }
                      required
                      className="w-full mt-1 border border-base-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Status</label>
                    <select
                      name="status"
                      value={classroomForm.status}
                      onChange={(e) =>
                        setClassroomForm({
                          ...classroomForm,
                          status: e.target.value,
                        })
                      }
                      className="w-full mt-1 border border-base-300 rounded px-2 py-1"
                    >
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Duration (weeks)
                    </label>
                    <input
                      type="number"
                      name="duration_weeks"
                      value={classroomForm.duration_weeks}
                      onChange={(e) =>
                        setClassroomForm({
                          ...classroomForm,
                          duration_weeks: e.target.value,
                        })
                      }
                      className="w-full mt-1 border border-base-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Max Capacity
                    </label>
                    <input
                      type="number"
                      name="max_capacity"
                      value={classroomForm.max_capacity}
                      onChange={(e) =>
                        setClassroomForm({
                          ...classroomForm,
                          max_capacity: e.target.value,
                        })
                      }
                      className="w-full mt-1 border border-base-300 rounded px-2 py-1"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="btn"
                    onClick={closeClassroomModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Classroom
                  </button>
                </div>
              </form>
            ) : (
              <div>
                {/* Supervisor Assignment */}
                <p className="text-green-600 font-semibold">
                  Classroom "{newlyCreatedClassroom.classroom_id}" created
                  successfully!
                </p>
                <div className="mt-4 p-4 border border-base-300 rounded bg-gray-50">
                  <h3 className="text-lg font-semibold mb-3">
                    Assign Supervisor (Optional)
                  </h3>
                  <select
                    value={selectedSupervisor}
                    onChange={(e) => setSelectedSupervisor(e.target.value)}
                    className="w-full mt-1 border border-base-300 rounded px-2 py-1"
                  >
                    <option value="">-- Choose a lecturer --</option>
                    {instructors.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.first_name} {l.last_name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssignSupervisor}
                    disabled={loading || !selectedSupervisor}
                    className="mt-3 px-4 py-2 bg-green-600 text-white rounded"
                  >
                    {loading ? "Assigning..." : "Assign Supervisor"}
                  </button>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="btn"
                    onClick={closeClassroomModal}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold bg-base-200 rounded-box px-4 py-2">
          Lesson Management for {course?.title}
        </h1>
        <button
          className="btn btn-neutral btn-sm ml-6"
          onClick={() => navigate("/instructor")}
        >
          Back to Dashboard
        </button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button
            className="btn btn-neutral"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + Create New Lesson
          </button>
          <button
            className="btn btn-neutral"
            onClick={() =>
              navigate(`/instructor/courses/${courseId}/classrooms`)
            }
          >
            Manage All Classrooms
          </button>
        </div>
        <div className="w-1/3">
          <input
            type="text"
            placeholder="Search by Lesson Name or ID"
            className="input input-bordered w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {showForm && (
        <div className="bg-base-100 p-4 my-4 rounded-box shadow">
          <h3 className="text-lg font-semibold mb-3">
            {editingLesson ? "Edit Lesson" : "Create New Lesson"}
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lesson ID (manual) */}
              <div>
                <label className="block mb-1">
                  Lesson ID{" "}
                  <span className="opacity-60 text-sm">
                    (e.g., FIT2014, MAT1840)
                  </span>
                </label>
                <input
                  type="text"
                  name="lesson_id"
                  value={formData.lesson_id}
                  onChange={handleChange}
                  className="input input-bordered mt-1 w-full"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="input input-bordered mt-1 w-full"
                />
              </div>

              {/* Description (moved above objectives) */}
              <div className="md:col-span-2">
                <label className="block mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="textarea textarea-bordered mt-1 h-24 w-full"
                />
              </div>

              {/* Learning Objectives (now below description) */}
              <div className="md:col-span-2">
                <label className="block mb-1">Learning Objectives</label>
                <textarea
                  name="objectives"
                  value={formData.objectives}
                  onChange={handleChange}
                  className="textarea textarea-bordered mt-1 h-20 w-full"
                  placeholder="What will students learn?"
                />
              </div>

              {/* Created by (designer) */}
              <div>
                <label className="block mb-1">Created by</label>
                <select
                  name="designer_id"
                  value={formData.designer_id}
                  onChange={handleChange}
                  className="select select-bordered mt-1 w-full"
                >
                  <option value="">Select instructor...</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.first_name} {instructor.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="select select-bordered mt-1 w-full"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Credit Value */}
              <div>
                <label className="block mb-1">Credit Value</label>
                <input
                  type="number"
                  name="credit_value"
                  value={formData.credit_value}
                  onChange={handleChange}
                  min="0"
                  className="input input-bordered mt-1 w-full"
                />
              </div>

              {/* Effort Estimate */}
              <div>
                <label className="block mb-1">Effort Estimate (minutes)</label>
                <input
                  type="number"
                  name="effort_estimate"
                  value={formData.effort_estimate}
                  onChange={handleChange}
                  min="1"
                  className="input input-bordered mt-1 w-full"
                />
              </div>

              {/* Content Type above content inputs */}
              <div className="md:col-span-2">
                <label className="block mb-1">Content Type *</label>
                <select
                  name="content_type"
                  value={formData.content_type}
                  onChange={handleChange}
                  required
                  className="select select-bordered mt-1 w-full"
                >
                  <option value="article">Article</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {/* Content fields based on type */}
              {formData.content_type === "video" && (
                <div className="md:col-span-2">
                  <label className="block mb-1">Video URL</label>
                  <input
                    type="url"
                    name="content_url"
                    value={formData.content_url}
                    onChange={handleChange}
                    className="input input-bordered mt-1 w-full"
                    placeholder="https://..."
                  />
                </div>
              )}

              {formData.content_type === "article" && (
                <div className="md:col-span-2">
                  <label className="block mb-1">Article Content</label>
                  <textarea
                    name="content_body"
                    value={formData.content_body}
                    onChange={handleChange}
                    className="textarea textarea-bordered mt-1 h-32 w-full"
                    placeholder="Enter article content..."
                  />
                </div>
              )}

              {/* Prerequisites selector */}
              <div className="md:col-span-2">
                <label className="block mb-2">
                  Prerequisites (select 0 or more lessons)
                </label>
                <div className="border border-base-300 rounded-box p-2 max-h-48 overflow-y-auto bg-base-100">
                  {prerequisiteOptions.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">
                      No other lessons available to be prerequisites.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {prerequisiteOptions.map((l) => (
                        <label
                          key={l.id}
                          className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-base-300 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={selectedPrereqIds.includes(l.id)}
                            onChange={() => togglePrereq(l.id)}
                          />
                          <span className="text-sm">
                            {l.title}{" "}
                            <span className="opacity-60">
                              (ID: {l.lesson_id || l.id})
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Reading List */}
              <div className="md:col-span-2">
                <label className="block mb-1">Reading List</label>
                <textarea
                  name="reading_list"
                  value={formData.reading_list}
                  onChange={handleChange}
                  className="textarea textarea-bordered mt-1 h-20 w-full"
                  placeholder="Recommended readings..."
                />
              </div>

              {/* Assignments builder */}
              <div className="md:col-span-2">
                <label className="block mb-2">Assignments</label>

                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newAssignment}
                    onChange={(e) => setNewAssignment(e.target.value)}
                    className="input input-bordered flex-1"
                    placeholder="Add assignment item..."
                  />
                  <button
                    type="button"
                    onClick={addAssignment}
                    className="btn btn-neutral"
                  >
                    Add
                  </button>
                </div>

                {assignmentsList.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No assignment items yet
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {assignmentsList.map((item, idx) => (
                      <li
                        key={`${item}-${idx}`}
                        className="flex items-center justify-between bg-white border border-base-300 rounded p-2"
                      >
                        <span className="text-sm">{item}</span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-red-600"
                          onClick={() => removeAssignment(idx)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-success"
              >
                {loading
                  ? "Saving..."
                  : editingLesson
                  ? "Update Lesson"
                  : "Create Lesson"}
              </button>
              <button type="button" className="btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lessons List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLessons.map((lesson) => (
          <div
            key={lesson.id}
            className="p-4 border border-base-300 rounded-box shadow bg-base-100"
          >
            <h3 className="text-lg font-semibold">{lesson.title}</h3>
            <p className="text-sm text-gray-600">ID: {lesson.lesson_id}</p>
            <p className="text-sm">
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
            </p>
            <p className="text-sm">Type: {lesson.content_type}</p>
            <p className="text-sm">Credits: {lesson.credit_value}</p>
            <p className="text-sm">Created by: {getDesignerName(lesson)}</p>

            <div className="mt-3 flex gap-2 flex-wrap">
              <button
                className="btn btn-info btn-sm"
                onClick={() => openClassroomModal(lesson)}
              >
                + Classroom
              </button>
              <button
                className="btn btn-warning btn-sm"
                onClick={() => handleEdit(lesson)}
              >
                Edit
              </button>
              <button
                className="btn btn-error btn-sm"
                onClick={() => handleDelete(lesson.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredLessons.length === 0 && (
        <div className="text-center mt-8">
          <p className="text-gray-500 text-lg">No lessons found</p>
          <p className="text-gray-400">
            Create your first lesson to get started
          </p>
        </div>
      )}
    </div>
  );
};

export default CourseLessonManagement;
