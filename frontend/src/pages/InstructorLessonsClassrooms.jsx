import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmationModal from "../components/ConfirmationModal";

const InstructorLessonsClassrooms = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [lecturers, setLecturers] = useState([]);

  // UI State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newlyCreatedClassroom, setNewlyCreatedClassroom] = useState(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [classroomForm, setClassroomForm] = useState({
    classroom_id: "",
    lesson_id: "",
    duration_weeks: 2,
    max_capacity: 30,
    status: "active",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterLessonId, setFilterLessonId] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // --- Edit flow state ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [editForm, setEditForm] = useState({
    classroom_id: "",
    lesson_id: "",
    duration_weeks: 2,
    max_capacity: 30,
    status: "active",
  });
  const [editSupervisors, setEditSupervisors] = useState([]); // [{id, instructor_id, name}]
  const [editAddSupervisor, setEditAddSupervisor] = useState("");

  // ---------- Fetching ----------
  const fetchLecturers = async () => {
    try {
      const res = await axios.get("/api/courses/instructors");
      setLecturers(res.data);
    } catch (err) {
      console.error("Error fetching lecturers:", err);
    }
  };
  const fetchLessons = async () => {
    try {
      const res = await axios.get(`/api/courses/${courseId}/lessons`);
      setLessons(res.data);
    } catch (err) {
      console.error("Error fetching lessons:", err);
      toast.error("Failed to load lessons for this course");
    }
  };

  const fetchCourse = async () => {
    try {
      const res = await axios.get(`/api/courses/${courseId}`, {
        withCredentials: true,
      });
      setCourse(res.data);
    } catch (err) {
      console.error("Error fetching course:", err);
      toast.error("Failed to load course details");
    }
  };

  const fetchUserName = async (userId) => {
    if (!userId) return "Unknown";
    try {
      const res = await axios.get(`/api/users/${userId}`);
      return `${res.data.first_name} ${res.data.last_name}`;
    } catch (err) {
      console.error("Error fetching user name:", err);
      return "Unknown";
    }
  };

  const fetchClassroomInstructors = async (classroomId) => {
    try {
      const res = await axios.get(
        `/api/classroomSupervisors/${classroomId}/supervisors`
      );
      const instructors = await Promise.all(
        res.data.map(async (s) => await fetchUserName(s.instructor_id))
      );
      return instructors;
    } catch (err) {
      console.error("Error fetching supervisors:", err);
      return [];
    }
  };

  const fetchClassrooms = async () => {
    try {
      const res = await axios.get(`/api/courses/${courseId}/classrooms`);
      const classroomsWithDetails = await Promise.all(
        res.data.map(async (c) => {
          const instructors = await fetchClassroomInstructors(c.id);
          const createdByName = await fetchUserName(c.created_by);
          const lesson = lessons.find((l) => l.id === c.lesson_id);
          return {
            ...c,
            instructors,
            createdByName,
            lessonTitle: lesson?.title || "N/A",
          };
        })
      );
      setClassrooms(classroomsWithDetails);
    } catch (err) {
      console.error("Error fetching classrooms:", err);
      toast.error("Failed to load classrooms for this course");
    }
  };

  // ---------- Classroom Creation ----------
  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewlyCreatedClassroom(null);
    setSelectedSupervisor("");
    setClassroomForm({
      classroom_id: "",
      lesson_id: "",
      duration_weeks: 2,
      max_capacity: 30,
      status: "active",
    });
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    if (!classroomForm.lesson_id) {
      toast.error("Please select a lesson.");
      return;
    }
    setLoading(true);

    try {
      const payload = {
        ...classroomForm,
        course_id: courseId,
        duration_weeks: Number(classroomForm.duration_weeks),
        max_capacity: Number(classroomForm.max_capacity),
        created_by: window.localStorage.getItem("userId"),
      };

      const res = await axios.post(
        `/api/classrooms/lessons/${classroomForm.lesson_id}/classrooms`,
        payload
      );
      setNewlyCreatedClassroom(res.data);
      fetchClassrooms(); // Refresh the list
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
        `/api/classroomSupervisors/${newlyCreatedClassroom.id}/supervisors`,
        {
          classroom_id: newlyCreatedClassroom.id,
          instructor_id: selectedSupervisor,
        }
      );
      fetchClassrooms(); // Refresh to show the new supervisor
      toast.success("Supervisor assigned successfully");
      setSelectedSupervisor("");
    } catch (err) {
      console.error("Error assigning supervisor:", err);
      toast.error(err.response?.data?.message || "Failed to assign supervisor");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Delete Classroom ----------
  const handleDeleteClassroom = (classroomId) => {
    setItemToDelete(classroomId);
    setIsModalOpen(true);
  };

  const confirmDeleteClassroom = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`/api/classrooms/${itemToDelete}`);
      setClassrooms(classrooms.filter((c) => c.id !== itemToDelete));
      toast.success("Classroom deleted successfully");
    } catch (err) {
      console.error("Error deleting classroom:", err);
      toast.error(err.response?.data?.message || "Failed to delete classroom");
    } finally {
      setIsModalOpen(false);
      setItemToDelete(null);
    }
  };

  // ---------- Edit Classroom ----------
  const fetchSupervisorsForClassroom = async (classroomId) => {
    try {
      const res = await axios.get(
        `/api/classroomSupervisors/${classroomId}/supervisors`
      );
      const supervisorsWithNames = await Promise.all(
        res.data.map(async (s) => ({
          ...s,
          name: await fetchUserName(s.instructor_id),
        }))
      );
      setEditSupervisors(supervisorsWithNames);
    } catch (err) {
      console.error("Error fetching supervisors for edit:", err);
      setEditSupervisors([]);
      toast.error("Failed to load supervisors for this classroom.");
    }
  };

  const openEditModal = async (classroom) => {
    setEditingClassroom(classroom);
    setEditForm({
      classroom_id: classroom.classroom_id,
      lesson_id: classroom.lesson_id,
      duration_weeks: classroom.duration_weeks,
      max_capacity: classroom.max_capacity,
      status: classroom.status,
    });
    await fetchSupervisorsForClassroom(classroom.id);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingClassroom(null);
    setEditForm({
      classroom_id: "",
      lesson_id: "",
      duration_weeks: 2,
      max_capacity: 30,
      status: "active",
    });
    setEditSupervisors([]);
    setEditAddSupervisor("");
  };

  const handleUpdateClassroom = async (e) => {
    e.preventDefault();
    if (!editingClassroom) return;

    setLoading(true);
    try {
      const payload = {
        ...editForm,
        course_id: courseId, // This page is scoped to a course
        duration_weeks: Number(editForm.duration_weeks),
        max_capacity: Number(editForm.max_capacity),
        modified_by: window.localStorage.getItem("userId"),
      };

      await axios.put(`/api/classrooms/${editingClassroom.id}`, payload);
      await fetchClassrooms(); // Refresh the list
      toast.success("Classroom updated successfully.");
      // Optionally close modal on success
      // closeEditModal();
    } catch (err) {
      console.error("Error updating classroom:", err);
      toast.error(err.response?.data?.message || "Failed to update classroom");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupervisorToEdit = async () => {
    if (!editingClassroom || !editAddSupervisor) return;
    setLoading(true);
    try {
      await axios.post(
        `/api/classroomSupervisors/${editingClassroom.id}/supervisors`,
        {
          classroom_id: editingClassroom.id,
          instructor_id: editAddSupervisor,
        }
      );
      await fetchSupervisorsForClassroom(editingClassroom.id); // Refresh supervisor list
      await fetchClassrooms(); // Refresh main classroom list to update supervisor names
      toast.success("Supervisor added.");
      setEditAddSupervisor("");
    } catch (err) {
      console.error("Error adding supervisor:", err);
      toast.error(err.response?.data?.message || "Failed to add supervisor");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSupervisorFromEdit = async (assignmentId) => {
    setLoading(true);
    try {
      await axios.delete(`/api/classroomSupervisors/${assignmentId}`);
      setEditSupervisors((prev) => prev.filter((s) => s.id !== assignmentId));
      await fetchClassrooms(); // Refresh main classroom list
      toast.success("Supervisor removed.");
    } catch (err) {
      console.error("Error removing supervisor:", err);
      toast.error(err.response?.data?.message || "Failed to remove supervisor");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Effects ----------
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCourse(), fetchLessons(), fetchLecturers()]);
      setLoading(false);
    };
    loadData();
  }, [courseId]);

  useEffect(() => {
    if (lessons.length > 0) {
      fetchClassrooms();
    }
  }, [lessons]);

  // ---------- Filtering and Searching ----------
  const filteredClassrooms = useMemo(() => {
    return classrooms
      .filter((classroom) => {
        if (!filterLessonId) return true;
        return classroom.lesson_id === filterLessonId;
      })
      .filter((classroom) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          classroom.classroom_id.toLowerCase().includes(term) ||
          (classroom.id && classroom.id.toString().toLowerCase().includes(term))
        );
      });
  }, [classrooms, searchTerm, filterLessonId]);

  // ---------- Render ----------
  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDeleteClassroom}
        title="Confirm Deletion"
      >
        Are you sure you want to delete this classroom?
      </ConfirmationModal>

      {/* Create Classroom Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-base-200 p-6 rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Classroom</h2>
              <button
                className="btn btn-sm btn-circle"
                onClick={closeCreateModal}
              >
                ✕
              </button>
            </div>

            {!newlyCreatedClassroom ? (
              <form onSubmit={handleCreateClassroom}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">
                      Lesson *
                    </label>
                    <select
                      name="lesson_id"
                      value={classroomForm.lesson_id}
                      onChange={(e) =>
                        setClassroomForm({
                          ...classroomForm,
                          lesson_id: e.target.value,
                        })
                      }
                      required
                      className="w-full mt-1 border border-base-300 rounded px-2 py-1"
                    >
                      <option value="">-- Select a Lesson --</option>
                      {lessons.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.title}
                        </option>
                      ))}
                    </select>
                  </div>
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
                    onClick={closeCreateModal}
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
                <p className="text-green-600 font-semibold">
                  Classroom "{newlyCreatedClassroom.classroom_id}" created!
                </p>
                <div className="mt-4 p-4 border border-base-300 rounded bg-base-200">
                  <h3 className="text-lg font-semibold mb-3">
                    Assign Supervisor (Optional)
                  </h3>
                  <select
                    value={selectedSupervisor}
                    onChange={(e) => setSelectedSupervisor(e.target.value)}
                    className="w-full mt-1 border border-base-300 rounded px-2 py-1"
                  >
                    <option value="">-- Choose a lecturer --</option>
                    {lecturers.map((l) => (
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
                    onClick={closeCreateModal}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Classroom Modal */}
      {showEditModal && editingClassroom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-base-200 p-6 rounded-lg shadow-xl w-full max-w-3xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                Edit Classroom: {editingClassroom.classroom_id}
              </h2>
              <button
                className="btn btn-sm btn-circle"
                onClick={closeEditModal}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left side: Form */}
              <form onSubmit={handleUpdateClassroom}>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium">
                      Lesson *
                    </label>
                    <select
                      name="lesson_id"
                      value={editForm.lesson_id}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          lesson_id: e.target.value,
                        })
                      }
                      required
                      className="w-full mt-1 border border-base-300 rounded px-2 py-1"
                    >
                      <option value="">-- Select a Lesson --</option>
                      {lessons.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Classroom ID *
                    </label>
                    <input
                      type="text"
                      name="classroom_id"
                      value={editForm.classroom_id}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
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
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value })
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
                      value={editForm.duration_weeks}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
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
                      value={editForm.max_capacity}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
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
                    onClick={closeEditModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>

              {/* Right side: Supervisors */}
              <div className="p-4 border border-base-300 rounded bg-base-100">
                <h3 className="text-lg font-semibold mb-3">Supervisors</h3>
                {editSupervisors.length === 0 ? (
                  <p className="text-sm text-base-content/70">
                    No supervisors assigned.
                  </p>
                ) : (
                  <ul className="space-y-2 mb-4">
                    {editSupervisors.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{s.name}</span>
                        <button
                          className="btn btn-xs btn-error"
                          onClick={() => handleRemoveSupervisorFromEdit(s.id)}
                          disabled={loading}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 pt-4 border-t border-base-300">
                  <h4 className="text-md font-semibold mb-2">Add Supervisor</h4>
                  <div className="flex gap-2">
                    <select
                      value={editAddSupervisor}
                      onChange={(e) => setEditAddSupervisor(e.target.value)}
                      className="flex-1 select select-bordered select-sm"
                    >
                      <option value="">-- Choose a lecturer --</option>
                      {lecturers
                        .filter(
                          (l) =>
                            !editSupervisors.some(
                              (s) => s.instructor_id === l.id
                            )
                        )
                        .map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.first_name} {l.last_name}
                          </option>
                        ))}
                    </select>
                    <button
                      className="btn btn-sm btn-neutral"
                      onClick={handleAddSupervisorToEdit}
                      disabled={loading || !editAddSupervisor}
                    >
                      {loading ? "..." : "Add"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold bg-base-200 rounded-box px-4 py-2">
          Classroom Management for {course?.title}
        </h1>
        <button
          className="btn btn-neutral btn-sm ml-6"
          onClick={() => navigate("/instructor")}
        >
          Back to Dashboard
        </button>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <button className="btn btn-neutral" onClick={openCreateModal}>
          + Create New Classroom
        </button>
        <div className="flex gap-2 w-2/3">
          <input
            type="text"
            placeholder="Search by Classroom Name or ID"
            className="input input-bordered w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="select select-bordered w-full"
            value={filterLessonId}
            onChange={(e) => setFilterLessonId(e.target.value)}
          >
            <option value="">Filter by Lesson</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Classroom list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClassrooms.map((c) => (
          <div
            key={c.id}
            className="p-4 border border-base-300 rounded-box shadow bg-base-100 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-lg font-semibold">
                {c.classroom_id}{" "}
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    c.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {c.status?.toUpperCase()}
                </span>
              </h3>
              <p className="text-sm font-medium text-blue-600 mt-1">
                Lesson: {c.lessonTitle}
              </p>
              <p className="text-sm mt-2">Duration: {c.duration_weeks} weeks</p>
              <p className="text-sm">Capacity: {c.max_capacity}</p>
              <p className="text-sm">
                Supervisors:{" "}
                {c.instructors?.length ? c.instructors.join(", ") : "None"}
              </p>
              <p className="text-xs text-base-content/70 mt-2">
                Created by: {c.createdByName} |{" "}
                {new Date(c.created_at).toLocaleString()}
              </p>
            </div>

            <div className="mt-3 flex gap-2 flex-wrap">
              <button
                className="btn btn-warning btn-sm"
                onClick={() => openEditModal(c)}
              >
                Edit
              </button>
              <button
                className="btn btn-error btn-sm"
                onClick={() => handleDeleteClassroom(c.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredClassrooms.length === 0 && (
        <div className="text-center mt-8 bg-base-200 rounded-box py-2">
          <p className="text-gray-500 text-lg">No classrooms found</p>
          <p className="text-gray-400">
            Create a classroom or adjust your search filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default InstructorLessonsClassrooms;
