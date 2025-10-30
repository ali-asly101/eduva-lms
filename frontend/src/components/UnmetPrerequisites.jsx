import { AlertTriangleIcon, BookOpenIcon, CheckCircleIcon } from "lucide-react";
import React from "react";
import { NavLink, useParams } from "react-router-dom";

function UnmetPrerequisites({
  unmetPrerequisites,
  allPrerequisites,
  lessonTitle,
}) {
  const { courseId } = useParams();

  if (!unmetPrerequisites || unmetPrerequisites.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Main blocked access alert */}
      <div className="alert alert-warning">
        <AlertTriangleIcon className="w-5 h-5" />
        <div>
          <h2 className="text-lg font-semibold mb-2">Lesson Access Blocked</h2>
          <p className="text-sm">
            You cannot access "{lessonTitle}" because you have not completed all
            required prerequisite lessons.
          </p>
        </div>
      </div>

      {/* Unmet prerequisites section */}
      <div className="card bg-base-100 shadow p-4">
        <h3 className="text-lg font-semibold mb-4 text-warning">
          Required Prerequisites ({unmetPrerequisites.length} remaining)
        </h3>
        <div className="space-y-3">
          {unmetPrerequisites.map((prerequisite) => (
            <div
              key={prerequisite.id}
              className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20"
            >
              <div className="flex items-center gap-3">
                <BookOpenIcon className="w-5 h-5 text-warning" />
                <div>
                  <p className="font-medium">{prerequisite.title}</p>
                  <p className="text-sm text-base-content/70">
                    Lesson ID: {prerequisite.lesson_id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-warning badge-sm">
                  Not Completed
                </span>
                <NavLink
                  to={`/student/course/${courseId}/lesson/${prerequisite.id}`}
                  className="btn btn-warning btn-sm"
                >
                  Complete Now
                </NavLink>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All prerequisites overview */}
      {allPrerequisites && allPrerequisites.length > 0 && (
        <div className="card bg-base-100 shadow p-4">
          <h3 className="text-lg font-semibold mb-4">
            All Prerequisites Overview
          </h3>
          <div className="space-y-2">
            {allPrerequisites.map((prerequisite) => (
              <div
                key={prerequisite.id}
                className="flex items-center justify-between p-2 rounded hover:bg-base-200"
              >
                <div className="flex items-center gap-3">
                  {prerequisite.completed ? (
                    <CheckCircleIcon className="w-5 h-5 text-success" />
                  ) : (
                    <BookOpenIcon className="w-5 h-5 text-warning" />
                  )}
                  <div>
                    <p className="font-medium">{prerequisite.title}</p>
                    <p className="text-sm text-base-content/70">
                      Lesson ID: {prerequisite.lesson_id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {prerequisite.completed ? (
                    <span className="badge badge-success badge-sm">
                      Completed
                    </span>
                  ) : (
                    <span className="badge badge-warning badge-sm">
                      Pending
                    </span>
                  )}
                  {!prerequisite.completed && (
                    <NavLink
                      to={`/student/course/${courseId}/lesson/${prerequisite.id}`}
                      className="btn btn-warning btn-xs"
                    >
                      Start
                    </NavLink>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help section */}
      <div className="card bg-base-100 shadow p-4">
        <h3 className="text-lg font-semibold mb-2">
          📚 What are Prerequisites?
        </h3>
        <p className="text-sm text-base-content/70 mb-3">
          Prerequisites are lessons that must be completed before you can access
          this lesson. They ensure you have the necessary knowledge and skills
          to succeed.
        </p>
        <div className="text-sm text-base-content/70">
          <p className="mb-1">
            <strong>To unlock this lesson:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Complete all the required prerequisite lessons shown above</li>
            <li>Mark each prerequisite lesson as "Done" to earn credits</li>
            <li>
              Return to this lesson - access will be automatically granted
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default UnmetPrerequisites;
