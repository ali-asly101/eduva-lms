import React, { useEffect } from "react";
import { useStudentClassroomStore } from "../store/useStudentClassroomStore";

function ClassroomDetailsModal({ modalId, classroomId }) {
  const {
    classrooms,
    supervisors,
    fetchClassroomSupervisors,
    studentClassrooms,
  } = useStudentClassroomStore();

  const classroom = (
    classrooms && classrooms.length > 0 ? classrooms : studentClassrooms
  )?.find((c) => c.id === classroomId);

  const classroomSupervisors = supervisors[classroomId] || [];

  useEffect(() => {
    if (classroomId) {
      fetchClassroomSupervisors(classroomId);
    }
  }, [classroomId, fetchClassroomSupervisors]);

  if (!classroom) return null;

  return (
    <dialog id={modalId} className="modal">
      <div className="modal-box w-11/12 max-w-3xl bg-base-100 shadow-xl rounded-2xl">
        {/* Header */}
        <h3 className="font-bold text-2xl border-b pb-3 mb-4">
          Classroom Details
        </h3>

        {/* Details section */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <p>
              <span className="font-semibold text-current">ID:</span>{" "}
              <span>{classroom.classroom_id}</span>
            </p>
            <p>
              <span className="font-semibold text-current">Duration:</span>{" "}
              <span>{classroom.duration_weeks} weeks</span>
            </p>
          </div>

          <div className="space-y-3">
            <p>
              <span className="font-semibold text-current">Capacity:</span>{" "}
              <span>
                {classroom.current_capacity}/{classroom.max_capacity}
              </span>
            </p>
            <p>
              <span className="font-semibold text-current">Status:</span>{" "}
              <span
                className={`badge ${
                  classroom.status === "active"
                    ? "badge-success"
                    : "badge-error"
                }`}
              >
                {classroom.status}
              </span>
            </p>
          </div>
        </div>

        {/* Supervisors */}
        <div className="mt-6">
          <h4 className="font-semibold text-lg mb-2">Supervisors</h4>
          <div className="divider my-2"></div>
          {classroomSupervisors.length === 0 ? (
            <p className="text-sm opacity-70 italic">
              No supervisors assigned.
            </p>
          ) : (
            <ul className="space-y-2">
              {classroomSupervisors.map((supervisor) => (
                <li
                  key={supervisor.instructor_id}
                  className="flex items-center justify-between p-3 rounded-lg border border-base-300 bg-base-200"
                >
                  <div>
                    <p className="font-medium">
                      {supervisor.first_name} {supervisor.last_name}
                    </p>
                    {supervisor.email && (
                      <p className="text-sm opacity-70">{supervisor.email}</p>
                    )}
                  </div>
                  <span className="badge badge-outline">Instructor</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="modal-action mt-6">
          <form method="dialog">
            <button className="btn btn-neutral px-6">Close</button>
          </form>
        </div>
      </div>
    </dialog>
  );
}

export default ClassroomDetailsModal;
