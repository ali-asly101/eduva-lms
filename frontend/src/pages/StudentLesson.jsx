import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { NavLink, useOutletContext, useParams } from "react-router-dom";
import ClassroomDetailsModal from "../components/ClassroomDetailsModal";
import UnmetPrerequisites from "../components/UnmetPrerequisites";
import { checkLessonPrerequisites } from "../services/api";
import { useStudentClassroomStore } from "../store/useStudentClassroomStore";

function StudentLesson() {
  const { lessonId } = useParams();
  const { lessons, refetch: refetchLayout } = useOutletContext();
  const lesson = lessons.find((l) => l.id === lessonId);

  const { enrollmentStatus, joinedClassroomId, fetchStudentClassrooms } =
    useStudentClassroomStore();

  const [checkingEnroll, setCheckingEnroll] = useState(true);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [completingLesson, setCompletingLesson] = useState(false);
  const [studentProgress, setStudentProgress] = useState(null);

  // Prerequisite checking state
  const [prerequisiteStatus, setPrerequisiteStatus] = useState(null);
  const [checkingPrerequisites, setCheckingPrerequisites] = useState(true);
  const [prerequisiteError, setPrerequisiteError] = useState(null);

  const [checkedAssignments, setCheckedAssignments] = useState([]);
  const [checkedReadings, setCheckedReadings] = useState([]);

  const isArchived = lesson?.status === "archived";

  if (lesson?.status === "draft") {
    return (
      <div className="p-6">
        <div className="alert alert-warning">
          <div>
            <h2 className="text-lg font-semibold mb-2">Lesson Not Available</h2>
            <p className="text-sm">
              This lesson is currently in draft status and not available to
              students.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const assignments = useMemo(() => {
    try {
      const arr = JSON.parse(lesson?.assignments || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }, [lesson]);

  const readingItems = useMemo(() => {
    if (!lesson?.reading_list) return [];
    try {
      const arr = JSON.parse(lesson.reading_list);
      if (Array.isArray(arr)) return arr.filter((s) => String(s).trim() !== "");
    } catch {}
    return lesson.reading_list
      .split(/\r?\n/)
      .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
      .filter(Boolean);
  }, [lesson]);

  const lsKeyAssign = `lesson-${lessonId}-assignments`;
  const lsKeyRead = `lesson-${lessonId}-readings`;

  useEffect(() => {
    setLessonCompleted(false);
    setCompletingLesson(false);
    setStudentProgress(null);
    setCheckedAssignments([]);
    setCheckedReadings([]);
    setPrerequisiteStatus(null);
    setCheckingPrerequisites(true);
    setPrerequisiteError(null);
  }, [lessonId]);

  useEffect(() => {
    const checkLessonCompletion = async () => {
      const studentId = localStorage.getItem("userId");
      if (!studentId || !lessonId) return;

      try {
        const response = await axios.get(
          `/api/lessons/${lessonId}/completion/${studentId}`,
          {
            withCredentials: true,
          }
        );
        setLessonCompleted(!!response.data.completed);
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error("Error checking lesson completion:", error);
        }
        setLessonCompleted(false);
      }
    };

    if (lessonId) checkLessonCompletion();
  }, [lessonId]);

  // Check prerequisites
  useEffect(() => {
    const checkPrerequisites = async () => {
      const studentId = localStorage.getItem("userId");
      if (!studentId || !lessonId) {
        setCheckingPrerequisites(false);
        return;
      }

      try {
        setCheckingPrerequisites(true);
        setPrerequisiteError(null);
        const response = await checkLessonPrerequisites(lessonId, studentId);
        setPrerequisiteStatus(response);
      } catch (error) {
        console.error("Error checking prerequisites:", error);
        setPrerequisiteError(error.message);
        // If error occurs, assume access is allowed to avoid blocking legitimate access
        setPrerequisiteStatus({ accessAllowed: true, unmetPrerequisites: [] });
      } finally {
        setCheckingPrerequisites(false);
      }
    };

    if (lessonId) checkPrerequisites();
  }, [lessonId]);

  useEffect(() => {
    if (!assignments) return;
    if (lessonCompleted || isArchived) {
      setCheckedAssignments(new Array(assignments.length).fill(true));
      return;
    }
    const saved = localStorage.getItem(lsKeyAssign);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === assignments.length) {
          setCheckedAssignments(parsed);
          return;
        }
      } catch {}
    }
    setCheckedAssignments(new Array(assignments.length).fill(false));
  }, [assignments, lessonCompleted, isArchived, lsKeyAssign]);

  useEffect(() => {
    if (!readingItems) return;
    if (lessonCompleted || isArchived) {
      setCheckedReadings(new Array(readingItems.length).fill(true));
      return;
    }
    const saved = localStorage.getItem(lsKeyRead);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === readingItems.length) {
          setCheckedReadings(parsed);
          return;
        }
      } catch {}
    }
    setCheckedReadings(new Array(readingItems.length).fill(false));
  }, [readingItems, lessonCompleted, isArchived, lsKeyRead]);

  useEffect(() => {
    if (!lessonCompleted && !isArchived && checkedAssignments.length > 0) {
      localStorage.setItem(lsKeyAssign, JSON.stringify(checkedAssignments));
    }
  }, [checkedAssignments, lessonCompleted, isArchived, lsKeyAssign]);

  useEffect(() => {
    if (!lessonCompleted && !isArchived && checkedReadings.length > 0) {
      localStorage.setItem(lsKeyRead, JSON.stringify(checkedReadings));
    }
  }, [checkedReadings, lessonCompleted, isArchived, lsKeyRead]);

  useEffect(() => {
    if (!lessonId) return;
    let cancelled = false;
    (async () => {
      setCheckingEnroll(true);
      try {
        await fetchStudentClassrooms(lessonId);
      } finally {
        if (!cancelled) setCheckingEnroll(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId, fetchStudentClassrooms]);

  const toggleAssignment = (idx) => {
    if (lessonCompleted || isArchived) return;
    setCheckedAssignments((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const toggleReading = (idx) => {
    if (lessonCompleted || isArchived) return;
    setCheckedReadings((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const allAssignmentsCompleted =
    assignments.length === 0 ||
    (checkedAssignments.length === assignments.length &&
      checkedAssignments.every(Boolean));

  const allReadingsCompleted =
    readingItems.length === 0 ||
    (checkedReadings.length === readingItems.length &&
      checkedReadings.every(Boolean));

  const canMarkDone =
    !lessonCompleted &&
    !isArchived &&
    allAssignmentsCompleted &&
    allReadingsCompleted;

  const handleMarkLessonComplete = async () => {
    if (isArchived) {
      toast.error("Archived lessons cannot be completed");
      return;
    }

    const studentId = localStorage.getItem("userId");
    if (!studentId) {
      toast.error("Please log in to complete lessons");
      return;
    }

    if (!allReadingsCompleted || !allAssignmentsCompleted) {
      toast.error("Complete all readings and assignments first");
      return;
    }

    setCompletingLesson(true);

    try {
      const response = await axios.post(
        `/api/lessons/${lessonId}/complete`,
        { student_id: studentId },
        { withCredentials: true }
      );

      localStorage.removeItem(lsKeyAssign);
      localStorage.removeItem(lsKeyRead);

      toast.success(
        response.data.courseCompleted
          ? `Lesson completed! Course completed with ${response.data.newCredits} credits!`
          : `Lesson completed! You now have ${response.data.newCredits} credits (${response.data.newProgress}% progress)`
      );

      setLessonCompleted(true);
      setStudentProgress({
        credits: response.data.newCredits,
        progress: response.data.newProgress,
        courseCompleted: response.data.courseCompleted,
      });

      if (refetchLayout) {
        refetchLayout();
      }

      if (assignments.length > 0)
        setCheckedAssignments(new Array(assignments.length).fill(true));
      if (readingItems.length > 0)
        setCheckedReadings(new Array(readingItems.length).fill(true));
    } catch (error) {
      console.error("Error completing lesson:", error);
      toast.error(error.response?.data?.error || "Failed to complete lesson");
    } finally {
      setCompletingLesson(false);
    }
  };

  const promptSelectClassroom = () => {
    toast.error("Please join a classroom to access the lesson content.");
  };

  if (!lesson) {
    return (
      <div className="p-6">
        <p className="text-base-content/70">Lesson not found.</p>
      </div>
    );
  }

  const contentUnlocked = Boolean(enrollmentStatus && joinedClassroomId);
  const prerequisitesBlocked =
    prerequisiteStatus && !prerequisiteStatus.accessAllowed;
  const canAccessContent = contentUnlocked && !prerequisitesBlocked;

  const remainingAssign =
    Math.max(
      assignments.length - checkedAssignments.filter(Boolean).length,
      0
    ) || 0;
  const remainingRead =
    Math.max(readingItems.length - checkedReadings.filter(Boolean).length, 0) ||
    0;

  return (
    <div className="p-6 space-y-6 bg-base-200 rounded-box">
      <h1 className="text-3xl font-bold">{lesson.title}</h1>
      <p className="text-base-content">{lesson.description}</p>

      {isArchived && (
        <div className="alert bg-base-200 border border-base-300">
          <div>
            <h3 className="font-medium text-sm mb-1">
              Archived Lesson - Read Only
            </h3>
            <p className="text-xs text-base-content/70">
              This lesson is archived and cannot be completed for credits. You
              can review the materials for reference.
            </p>
          </div>
        </div>
      )}

      {lessonCompleted && (
        <div className="alert alert-success">
          <div>
            <h2 className="text-lg font-semibold mb-2">Lesson Completed!</h2>
            <p className="text-sm">
              You have earned {lesson.credit_value || 0} credits for completing
              this lesson.
              {studentProgress && (
                <>
                  <br />
                  Course Progress: {studentProgress.credits}/30 credits (
                  {studentProgress.progress}%)
                  {studentProgress.courseCompleted && (
                    <>
                      <br />
                      <strong>Course Completed!</strong>
                    </>
                  )}
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {checkingEnroll || checkingPrerequisites ? (
        <div className="card bg-base-100 shadow p-4">
          <h2 className="text-lg font-semibold mb-2">
            {checkingEnroll
              ? "Checking enrollment..."
              : "Checking prerequisites..."}
          </h2>
          <p className="text-sm text-base-content/70">Please wait.</p>
        </div>
      ) : prerequisitesBlocked ? (
        <UnmetPrerequisites
          unmetPrerequisites={prerequisiteStatus?.unmetPrerequisites}
          allPrerequisites={prerequisiteStatus?.allPrerequisites}
          lessonTitle={lesson.title}
        />
      ) : canAccessContent ? (
        <>
          <div className="card bg-base-100 shadow p-4">
            <h2 className="text-lg font-semibold mb-2">Classroom</h2>
            <div className="flex flex-row gap-2">
              <button
                className="btn btn-neutral"
                onClick={() =>
                  document
                    .getElementById(`classroom_details_${joinedClassroomId}`)
                    .showModal()
                }
              >
                Details
              </button>
              <ClassroomDetailsModal
                modalId={`classroom_details_${joinedClassroomId}`}
                classroomId={joinedClassroomId}
              />
              <NavLink to={`classroom`}>
                <button className="btn btn-neutral">Other Classrooms</button>
              </NavLink>
            </div>
          </div>

          {readingItems.length > 0 && (
            <div className="card bg-base-100 shadow p-4">
              <h2 className="text-lg font-semibold mb-2">
                Reading List{" "}
                {lessonCompleted && (
                  <span className="badge badge-success ml-2">Completed</span>
                )}
                {isArchived && (
                  <span className="badge badge-ghost ml-2 border-base-300">
                    Read Only
                  </span>
                )}
              </h2>

              <ul className="space-y-2 mb-4">
                {readingItems.map((item, idx) => (
                  <li
                    key={`read-${idx}`}
                    className="flex items-start gap-3 p-2 rounded hover:bg-base-200"
                  >
                    <input
                      type="checkbox"
                      className="checkbox mt-1 flex-shrink-0"
                      checked={!!checkedReadings[idx]}
                      onChange={() => toggleReading(idx)}
                      disabled={lessonCompleted || isArchived}
                    />
                    <span
                      className={`flex-1 ${
                        lessonCompleted || isArchived
                          ? "line-through opacity-60"
                          : ""
                      } ${
                        checkedReadings[idx] ? "text-success font-medium" : ""
                      }`}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              {!lessonCompleted && !isArchived && readingItems.length > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Reading Progress</span>
                    <span>
                      {checkedReadings.filter(Boolean).length}/
                      {readingItems.length}
                    </span>
                  </div>
                  <progress
                    className="progress progress-primary w-full"
                    value={checkedReadings.filter(Boolean).length}
                    max={readingItems.length}
                  />
                </div>
              )}
            </div>
          )}

          {lesson.content_type === "article" && lesson.content_body && (
            <div className="card bg-base-100 shadow p-4">
              <h2 className="text-lg font-semibold mb-2">Article</h2>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{lesson.content_body}</p>
              </div>
            </div>
          )}

          {lesson.content_type === "video" && lesson.content_url && (
            <div className="card bg-base-100 shadow p-4">
              <h2 className="text-lg font-semibold mb-2">Video</h2>
              <a
                href={lesson.content_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                Watch Video
              </a>
            </div>
          )}

          {assignments.length > 0 && (
            <div className="card bg-base-100 shadow p-4">
              <h2 className="text-lg font-semibold mb-2">
                Assignments{" "}
                {lessonCompleted && (
                  <span className="badge badge-success ml-2">Completed</span>
                )}
                {isArchived && (
                  <span className="badge badge-ghost ml-2 border-base-300">
                    Read Only
                  </span>
                )}
              </h2>

              <ul className="space-y-2 mb-4">
                {assignments.map((a, idx) => (
                  <li
                    key={`asg-${idx}`}
                    className="flex items-start gap-3 p-2 rounded hover:bg-base-200"
                  >
                    <input
                      type="checkbox"
                      className="checkbox mt-1 flex-shrink-0"
                      checked={!!checkedAssignments[idx]}
                      onChange={() => toggleAssignment(idx)}
                      disabled={lessonCompleted || isArchived}
                    />
                    <span
                      className={`flex-1 ${
                        lessonCompleted || isArchived
                          ? "line-through opacity-60"
                          : ""
                      } ${
                        checkedAssignments[idx]
                          ? "text-success font-medium"
                          : ""
                      }`}
                    >
                      {a}
                    </span>
                  </li>
                ))}
              </ul>

              {!lessonCompleted && !isArchived && assignments.length > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Assignment Progress</span>
                    <span>
                      {checkedAssignments.filter(Boolean).length}/
                      {assignments.length}
                    </span>
                  </div>
                  <progress
                    className="progress progress-primary w-full"
                    value={checkedAssignments.filter(Boolean).length}
                    max={assignments.length}
                  />
                </div>
              )}
            </div>
          )}

          {(assignments.length > 0 || readingItems.length > 0) &&
            !isArchived && (
              <button
                className={`btn w-full ${
                  lessonCompleted
                    ? "btn-success"
                    : canMarkDone
                    ? "btn-primary"
                    : "btn-disabled"
                }`}
                onClick={handleMarkLessonComplete}
                disabled={lessonCompleted || completingLesson || !canMarkDone}
              >
                {completingLesson ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Completing Lesson...
                  </>
                ) : lessonCompleted ? (
                  "✓ Lesson Completed"
                ) : canMarkDone ? (
                  <>Mark as Done (+{lesson.credit_value || 0} credits)</>
                ) : (
                  <>
                    Complete {remainingRead + remainingAssign} more item
                    {remainingRead + remainingAssign === 1 ? "" : "s"}
                  </>
                )}
              </button>
            )}

          {isArchived &&
            (assignments.length > 0 || readingItems.length > 0) && (
              <div className="alert alert-info">
                <span className="text-sm">
                  This archived lesson cannot be completed for credits.
                </span>
              </div>
            )}

          {assignments.length === 0 &&
            readingItems.length === 0 &&
            !isArchived && (
              <div className="card bg-base-100 shadow p-4">
                <h2 className="text-lg font-semibold mb-2">Complete Lesson</h2>
                <p className="text-sm text-base-content/70 mb-4">
                  Mark this lesson as complete to earn{" "}
                  {lesson.credit_value || 0} credits.
                </p>
                <button
                  className={`btn w-full ${
                    lessonCompleted ? "btn-success" : "btn-primary"
                  }`}
                  onClick={handleMarkLessonComplete}
                  disabled={lessonCompleted || completingLesson}
                >
                  {completingLesson ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Completing Lesson...
                    </>
                  ) : lessonCompleted ? (
                    "✓ Lesson Completed"
                  ) : (
                    <>Mark as Done (+{lesson.credit_value || 0} credits)</>
                  )}
                </button>
              </div>
            )}
        </>
      ) : (
        <>
          <div className="card bg-base-100 shadow p-4">
            <h2 className="text-lg font-semibold mb-2">Content Locked</h2>
            <p className="text-sm text-base-content/70 mb-3">
              Join a classroom to access the lesson content including reading
              list and assignments for this lesson.
            </p>
            <NavLink to={`classroom`}>
              <button className="btn btn-neutral">Choose a Classroom</button>
            </NavLink>
          </div>

          <div
            className="card bg-base-100 shadow p-4 opacity-60 cursor-not-allowed select-none"
            role="button"
            tabIndex={0}
            onClick={promptSelectClassroom}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && promptSelectClassroom()
            }
          >
            <h2 className="text-lg font-semibold mb-2">
              Reading List (Locked)
            </h2>
            <p className="text-sm text-base-content/70">
              You need to join a classroom to view the reading list.
            </p>
          </div>

          <div
            className="card bg-base-100 shadow p-4 opacity-60 cursor-not-allowed select-none"
            role="button"
            tabIndex={0}
            onClick={promptSelectClassroom}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && promptSelectClassroom()
            }
          >
            <h2 className="text-lg font-semibold mb-2">
              {lesson.content_type === "video" ? "Video" : "Article"} (Locked)
            </h2>
            <p className="text-sm text-base-content/70">
              Lesson content is unavailable until you choose a classroom.
            </p>
          </div>

          <div
            className="card bg-base-100 shadow p-4 opacity-60 cursor-not-allowed select-none"
            role="button"
            tabIndex={0}
            onClick={promptSelectClassroom}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && promptSelectClassroom()
            }
          >
            <h2 className="text-lg font-semibold mb-2">Assignments (Locked)</h2>
            <p className="text-sm text-base-content/70">
              Join a classroom to attempt assignments for this lesson.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default StudentLesson;
