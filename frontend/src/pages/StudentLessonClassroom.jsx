import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import ClassroomDetailsModal from "../components/ClassroomDetailsModal";
import { useStudentClassroomStore } from "../store/useStudentClassroomStore";

function StudentClassroom() {
  const { lessonId } = useParams();
  const {
    classrooms,
    enrollmentStatus,
    joinedClassroomId,
    fetchLessonClassrooms,
    fetchStudentClassrooms,
    enrollClassroom,
  } = useStudentClassroomStore();

  useEffect(() => {
    const run = async () => {
      await fetchLessonClassrooms(lessonId);
      await fetchStudentClassrooms(lessonId);
    };
    run();
  }, [lessonId, fetchLessonClassrooms, fetchStudentClassrooms]);

  const activeClassrooms = classrooms.filter(
    (classroom) => classroom.status === "active"
  );

  const handleJoin = async (classroomId) => {
    const result = await enrollClassroom(classroomId, lessonId);

    if (result === "success") {
      toast.success("Joined classroom successfully!");
    } else {
      toast.error("Failed to join classroom. Please try again.");
    }
  };

  return (
    <div className="p-6">
      <div className="border border-base-300 rounded-box">
        <ul className="flex flex-col list bg-base-100 rounded-box">
          <li className="p-4 pb-2 text-2xl font-bold tracking-wide">
            Classrooms
          </li>
          {classrooms.length === 0 ? (
            <div>
              <hr />
              <li className="p-4 py-16 text-center text-xl font-bold opacity-70">
                No classrooms found for this lesson.
              </li>
            </div>
          ) : (
            activeClassrooms.map((classroom) => (
              <li
                key={classroom.id}
                className="list-row p-4 flex justify-between border-t border-base-300"
              >
                <div>
                  <div className="font-medium">
                    ID: {classroom.classroom_id}
                  </div>
                  <div className="text-sm opacity-70">
                    Duration: {classroom.duration_weeks} weeks
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm opacity-70">
                    Capacity: {classroom.current_capacity}/
                    {classroom.max_capacity}
                  </div>
                  <button
                    className="btn btn-sm btn-neutral"
                    onClick={() =>
                      document
                        .getElementById(`classroom_details_${classroom.id}`)
                        .showModal()
                    }
                  >
                    Details
                  </button>
                  <ClassroomDetailsModal
                    modalId={`classroom_details_${classroom.id}`}
                    classroomId={classroom.id}
                  />
                  <button
                    className="btn btn-sm btn-neutral"
                    disabled={
                      enrollmentStatus ||
                      classroom.current_capacity >= classroom.max_capacity
                    }
                    onClick={() => handleJoin(classroom.id)}
                  >
                    {classroom.id === joinedClassroomId
                      ? "Joined"
                      : classroom.current_capacity >= classroom.max_capacity
                      ? "Full"
                      : "Join"}
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export default StudentClassroom;
