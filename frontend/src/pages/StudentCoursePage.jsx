import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function StudentCoursePage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get(`/api/courses/${courseId}`);
        if (mounted) setCourse(data);
      } catch (e) {
        console.error("Failed to load course:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [courseId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="skeleton h-8 w-1/3 mb-3" />
        <div className="skeleton h-4 w-2/3 mb-2" />
        <div className="skeleton h-4 w-1/2" />
      </div>
    );
  }

  if (!course) {
    return <div className="p-6 text-error">Course not found.</div>;
  }

  return (
    <div className="p-6">
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h1 className="text-2xl font-bold mb-1">{course.title}</h1>
          <p className="text-sm text-gray-500 mb-4">
            Course ID: <span className="font-mono">{course.course_id}</span>
          </p>
          <p className="mb-4">{course.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat">
              <div className="stat-title">Total Credits</div>
              <div className="stat-value text-lg">
                {course.total_credits ?? 30}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Lessons</div>
              <div className="stat-value text-lg">
                {course.total_lessons ?? course.lesson_count ?? 0}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Status</div>
              <div className="stat-value text-lg capitalize">
                {course.status}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Active Classrooms</div>
              <div className="stat-value text-lg">
                {course.active_classrooms ?? 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
