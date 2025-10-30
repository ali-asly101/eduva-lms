import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import ConfirmationModal from "../components/ConfirmationModal";

export default function InstructorClassrooms() {
  const navigate = useNavigate();

  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // --- Create flow state ---
  const [showCreate, setShowCreate] = useState(false);
  const [courses, setCourses] = useState([]);
  const [courseLessons, setCourseLessons] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");

  const [form, setForm] = useState({
    classroom_id: "",
    duration_weeks: 2,
    max_capacity: 30,
    status: "active",
  });

  // Supervisor step (AFTER classroom is created)
  const [instructors, setInstructors] = useState([]);
  const [newClassroomId, setNewClassroomId] = useState(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState("");

  // current logged-in instructor
  const [currentInstructorId, setCurrentInstructorId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    body: "",
    onConfirm: null,
  });

  // --- Edit flow state ---
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editCourseId, setEditCourseId] = useState("");
  const [editLessons, setEditLessons] = useState([]);
  const [editLessonId, setEditLessonId] = useState("");
  const [editForm, setEditForm] = useState({
    classroom_id: "",
    duration_weeks: 2,
    max_capacity: 30,
    status: "active",
  });

  // supervisors for the classroom being edited
  const [editSupervisors, setEditSupervisors] = useState([]); // [{id, instructor_id}]
  const [editAddSupervisor, setEditAddSupervisor] = useState("");

  // ------- Data fetchers -------
  const fetchAll = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/api/classrooms/all`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setClassrooms(data);
    } catch (e) {
      console.error(e);
      setErr("Failed to load classrooms");
    } finally {
      setLoading(false);
    }
  };

  const fetchMe = async () => {
    try {
      const instructorId = localStorage.getItem("userId");
      setCurrentInstructorId(instructorId);
    } catch {
      setCurrentInstructorId(null);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`/api/courses`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCourses(data);
    } catch (e) {
      console.error("Failed to fetch courses:", e);
    }
  };

  const fetchLessonsForCourse = async (courseId) => {
    if (!courseId) {
      setCourseLessons([]);
      return;
    }
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCourseLessons(data);
    } catch (e) {
      console.error("Failed to fetch lessons for course:", e);
      setCourseLessons([]);
    }
  };

  const fetchLessonsForEditCourse = async (courseId) => {
    setEditLessons([]);
    if (!courseId) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEditLessons(data);
    } catch (e) {
      console.error("Failed to fetch edit lessons:", e);
      setEditLessons([]);
    }
  };

  const fetchInstructors = async () => {
    try {
      const res = await fetch(`/api/courses/instructors`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setInstructors(data);
    } catch (e) {
      console.error("Failed to fetch instructors:", e);
    }
  };

  const fetchSupervisorsForClassroom = async (classroomId) => {
    try {
      const res = await fetch(
        `/api/classroomSupervisors/${classroomId}/supervisors`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); // [{id, classroom_id, instructor_id}, ...]
      setEditSupervisors(data);
    } catch (e) {
      console.error("Failed to fetch classroom supervisors:", e);
      setEditSupervisors([]);
    }
  };

  useEffect(() => {
    fetchAll();
    fetchMe();
  }, []);

  useEffect(() => {
    if (showCreate) {
      setShowEdit(false);
      fetchCourses();
      fetchInstructors();
    }
  }, [showCreate]);

  useEffect(() => {
    setSelectedLessonId("");
    if (selectedCourseId) fetchLessonsForCourse(selectedCourseId);
    else setCourseLessons([]);
  }, [selectedCourseId]);

  // ------- Actions (CREATE) -------
  const handleDelete = (id) => {
    setModalContent({
      title: "Delete Classroom",
      body: "Are you sure you want to delete this classroom?",
      onConfirm: () => confirmDelete(id),
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async (id) => {
    try {
      const res = await fetch(`/api/classrooms/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `Delete failed (${res.status})`);
      }
      setClassrooms((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to delete classroom");
    } finally {
      setIsModalOpen(false);
    }
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();

    if (!selectedCourseId) {
      toast.error("Please select a course first");
      return;
    }
    if (!selectedLessonId) {
      toast.error("Please select a lesson");
      return;
    }

    try {
      const payload = {
        classroom_id: form.classroom_id || undefined,
        course_id: selectedCourseId,
        lesson_id: selectedLessonId,
        duration_weeks: Number(form.duration_weeks),
        max_capacity: Number(form.max_capacity),
        status: form.status,
        created_by: currentInstructorId || undefined,
      };

      const res = await fetch(`/api/lessons/${selectedLessonId}/classrooms`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `Create failed (${res.status})`);
      }

      const created = await res.json();
      setNewClassroomId(created.id); // trigger Supervisor step
      setClassrooms((prev) => [created, ...prev]);

      setForm({
        classroom_id: "",
        duration_weeks: 2,
        max_capacity: 30,
        status: "active",
      });
      toast.success("Classroom created. You can now assign a supervisor.");
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to create classroom");
    }
  };

  const handleAssignSupervisor = async (e) => {
    e.preventDefault();
    if (!newClassroomId || !selectedSupervisor) return;

    try {
      const res = await fetch(
        `/api/classroomSupervisors/${newClassroomId}/supervisors`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classroom_id: newClassroomId,
            instructor_id: selectedSupervisor,
          }),
        }
      );

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(
          j.message || `Assign supervisor failed (${res.status})`
        );
      }

      setSelectedSupervisor("");
      setNewClassroomId(null);
      await fetchAll();

      toast.success("Supervisor assigned.");
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to assign supervisor");
    }
  };

  // ------- Actions (EDIT) -------
  const openEdit = async (c) => {
    setShowCreate(false);
    setShowEdit(true);
    setEditing(c);

    setEditCourseId(c.course_id || "");
    setEditLessonId(c.lesson_id || "");
    setEditForm({
      classroom_id: c.classroom_id || "",
      duration_weeks: c.duration_weeks ?? 2,
      max_capacity: c.max_capacity ?? 30,
      status: c.status || "active",
    });

    await Promise.all([fetchCourses(), fetchInstructors()]);
    if (c.course_id) await fetchLessonsForEditCourse(c.course_id);
    await fetchSupervisorsForClassroom(c.id);
  };

  useEffect(() => {
    if (!showEdit) return;
    setEditLessonId("");
    if (editCourseId) {
      fetchLessonsForEditCourse(editCourseId);
    } else {
      setEditLessons([]);
    }
  }, [editCourseId, showEdit]);

  const updateClassroom = async (e) => {
    e.preventDefault();
    if (!editing) return;

    if (!editCourseId) {
      toast.error("Please select a course");
      return;
    }
    if (!editLessonId) {
      toast.error("Please select a lesson");
      return;
    }

    try {
      const payload = {
        classroom_id: editForm.classroom_id,
        course_id: editCourseId,
        lesson_id: editLessonId,
        duration_weeks: Number(editForm.duration_weeks),
        max_capacity: Number(editForm.max_capacity),
        status: editForm.status,
        modified_by: currentInstructorId || undefined,
      };

      const res = await fetch(`/api/classrooms/${editing.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `Update failed (${res.status})`);
      }

      await fetchAll();
      toast.success("Classroom updated.");
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to update classroom");
    }
  };

  const removeSupervisor = (assignmentId) => {
    setModalContent({
      title: "Remove Supervisor",
      body: "Are you sure you want to remove this supervisor?",
      onConfirm: () => confirmRemoveSupervisor(assignmentId),
    });
    setIsModalOpen(true);
  };

  const confirmRemoveSupervisor = async (assignmentId) => {
    try {
      const res = await fetch(`/api/classroomSupervisors/${assignmentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `Remove failed (${res.status})`);
      }
      setEditSupervisors((prev) => prev.filter((s) => s.id !== assignmentId));
      await fetchAll();
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to remove supervisor");
    } finally {
      setIsModalOpen(false);
    }
  };

  const addSupervisor = async () => {
    if (!editing || !editAddSupervisor) return;
    try {
      const res = await fetch(
        `/api/classroomSupervisors/${editing.id}/supervisors`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classroom_id: editing.id,
            instructor_id: editAddSupervisor,
          }),
        }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `Add supervisor failed (${res.status})`);
      }
      setEditAddSupervisor("");
      await fetchSupervisorsForClassroom(editing.id);
      await fetchAll();
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to add supervisor");
    }
  };

  const instructorName = (instructor_id) => {
    const i = instructors.find((x) => x.id === instructor_id);
    if (!i) return `#${instructor_id}`;
    return `${i.first_name} ${i.last_name}`;
  };

  // ------- Render -------
  return (
    <div className="p-6">
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={modalContent.onConfirm}
        title={modalContent.title}
      >
        {modalContent.body}
      </ConfirmationModal>
      {/* Heading */}
      <h1 className="text-2xl font-bold mb-2 bg-base-200 rounded-box px-4 py-2">
        Classrooms
      </h1>

      {/* Create button directly under heading */}
      <button
        className="btn btn-neutral mb-4"
        onClick={() => setShowCreate((v) => !v)}
      >
        {showCreate ? "Close" : "+ Create Classroom"}
      </button>

      {/* Create panel: Course -> Lesson -> Form */}
      {showCreate && (
        <div className="mb-6 p-4 border border-base-200 rounded-box bg-base-100">
          <h2 className="text-lg font-semibold mb-3">New Classroom</h2>

          {/* Select Course */}
          <div className="mb-4">
            <label className="block text-sm font-medium">Select Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full mt-1 border border-base-200 rounded-box px-2 py-1"
            >
              <option value="">-- Choose a course --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.course_id})
                </option>
              ))}
            </select>
          </div>

          {/* Select Lesson (filtered by course) */}
          <div className="mb-4">
            <label className="block text-sm font-medium">Select Lesson</label>
            <select
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
              className="w-full mt-1 border border-base-200 rounded-box px-2 py-1"
              disabled={!selectedCourseId}
            >
              <option value="">
                {selectedCourseId
                  ? "-- Choose a lesson --"
                  : "Select a course first"}
              </option>
              {courseLessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title} ({lesson.lesson_id})
                </option>
              ))}
            </select>
          </div>

          {/* Classroom form appears only after lesson selection */}
          {selectedLessonId && (
            <form onSubmit={handleCreateClassroom} className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">
                    Classroom ID
                  </label>
                  <input
                    type="text"
                    value={form.classroom_id}
                    onChange={(e) =>
                      setForm({ ...form, classroom_id: e.target.value })
                    }
                    required
                    className="w-full mt-1 border border-base-200 rounded-box px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Duration (weeks)
                  </label>
                  <input
                    type="number"
                    value={form.duration_weeks}
                    onChange={(e) =>
                      setForm({ ...form, duration_weeks: e.target.value })
                    }
                    className="w-full mt-1 border border-base-200 rounded-box px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    value={form.max_capacity}
                    onChange={(e) =>
                      setForm({ ...form, max_capacity: e.target.value })
                    }
                    className="w-full mt-1 border border-base-200 rounded-box px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="w-full mt-1 border border-base-200 rounded-box px-2 py-1"
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-neutral mt-4">
                Create Classroom
              </button>
            </form>
          )}

          {/* Supervisor step (only AFTER classroom created) */}
          {newClassroomId && (
            <form
              onSubmit={handleAssignSupervisor}
              className="mt-4 p-4 border border-base-200 rounded-box bg-base-200"
            >
              <h3 className="text-md font-semibold mb-2">Assign Supervisor</h3>
              <label className="block text-sm font-medium">Supervisor</label>
              <select
                value={selectedSupervisor}
                onChange={(e) => setSelectedSupervisor(e.target.value)}
                className="w-full mt-1 border border-base-200 rounded-box px-2 py-1"
              >
                <option value="">-- Choose a lecturer --</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.first_name} {i.last_name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!selectedSupervisor}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded-box"
              >
                Assign Supervisor
              </button>
            </form>
          )}
        </div>
      )}

      {/* Edit panel */}
      {showEdit && editing && (
        <div className="mb-6 p-4 border border-base-200 rounded-box bg-base-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Edit Classroom: {editing.classroom_id}
            </h2>
            <button
              className="text-sm px-3 py-1 bg-base-100 rounded-box"
              onClick={() => setShowEdit(false)}
            >
              Close
            </button>
          </div>

          {/* Course & Lesson */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium">Course</label>
              <select
                value={editCourseId}
                onChange={(e) => setEditCourseId(e.target.value)}
                className="w-full mt-1 border border-base-200 rounded-box px-2 py-1"
              >
                <option value="">-- Choose a course --</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title} ({course.course_id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Lesson</label>
              <select
                value={editLessonId}
                onChange={(e) => setEditLessonId(e.target.value)}
                className="w-full mt-1 border border-base-200 rounded-box px-2 py-1"
                disabled={!editCourseId}
              >
                <option value="">
                  {editCourseId
                    ? "-- Choose a lesson --"
                    : "Select a course first"}
                </option>
                {editLessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title} ({lesson.lesson_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Details */}
          <form onSubmit={updateClassroom} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">
                  Classroom ID
                </label>
                <input
                  type="text"
                  value={editForm.classroom_id}
                  onChange={(e) =>
                    setEditForm({ ...editForm, classroom_id: e.target.value })
                  }
                  className="w-full mt-1 border border-base-200 rounded-box px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Duration (weeks)
                </label>
                <input
                  type="number"
                  value={editForm.duration_weeks}
                  onChange={(e) =>
                    setEditForm({ ...editForm, duration_weeks: e.target.value })
                  }
                  className="w-full mt-1 border border-base-200 rounded-box px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Max Capacity
                </label>
                <input
                  type="number"
                  value={editForm.max_capacity}
                  onChange={(e) =>
                    setEditForm({ ...editForm, max_capacity: e.target.value })
                  }
                  className="w-full mt-1 border border-base-200 rounded-box px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                  className="w-full mt-1 border border-base-200 rounded-box px-2 py-1"
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-box"
            >
              Update Classroom
            </button>
          </form>

          {/* Supervisors (add/remove) */}
          <div className="mt-6 p-4 border border-base-200 rounded-box bg-base-200">
            <h3 className="text-md font-semibold mb-3">Supervisors</h3>

            {/* Current supervisors */}
            {editSupervisors.length === 0 ? (
              <p className="text-sm text-gray-600">No supervisors assigned.</p>
            ) : (
              <ul className="space-y-2">
                {editSupervisors.map((s) => (
                  <li key={s.id} className="flex items-center justify-between">
                    <span className="text-sm">
                      {instructorName(s.instructor_id)}
                    </span>
                    <button
                      className="text-xs px-2 py-1 bg-red-600 text-white rounded-box"
                      onClick={() => removeSupervisor(s.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add supervisor */}
            <div className="mt-4 flex gap-2">
              <select
                value={editAddSupervisor}
                onChange={(e) => setEditAddSupervisor(e.target.value)}
                className="flex-1 border border-base-200 rounded-box px-2 py-1"
              >
                <option value="">-- Choose a lecturer --</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.first_name} {i.last_name}
                  </option>
                ))}
              </select>
              <button
                className="px-3 py-2 bg-blue-600 text-white rounded-box"
                onClick={addSupervisor}
                disabled={!editAddSupervisor}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}

      {!loading && classrooms.length === 0 && (
        <div className="text-gray-500">No classrooms found.</div>
      )}

      {!loading && classrooms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((c) => (
            <div
              key={c.id}
              className="p-4 border border-base-200 rounded-box shadow bg-base-100 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold">
                  {c.classroom_id || "(no id)"}{" "}
                  <span className="text-xs text-gray-600">
                    ({c.status || "unknown"})
                  </span>
                </h3>
                {c.course_title && (
                  <p className="text-sm text-gray-500 mb-1">
                    Course: {c.course_title}
                  </p>
                )}
                <p className="text-sm">
                  Duration: {c.duration_weeks ?? "-"} weeks
                </p>
                <p className="text-sm">Capacity: {c.max_capacity ?? "-"}</p>
                <p className="text-sm">
                  Supervisors:{" "}
                  {Array.isArray(c.supervisors) && c.supervisors.length > 0
                    ? c.supervisors.join(", ")
                    : "—"}
                </p>
                <p className="text-sm">
                  Created by: {c.created_by_name ? c.created_by_name : "—"}
                </p>
                <p className="text-sm">
                  Created at:{" "}
                  {c.created_at ? new Date(c.created_at).toLocaleString() : "—"}
                </p>
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => openEdit(c)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-error btn-sm"
                  onClick={() => handleDelete(c.id)}
                >
                  Delete
                </button>
                {/* Students button -> navigate to classroom students list */}
                <button
                  className="btn btn-neutral btn-sm"
                  onClick={() =>
                    navigate(`/instructor/classrooms/${c.id}/students`)
                  }
                >
                  Students
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
