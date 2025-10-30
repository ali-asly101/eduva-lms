import { BookOpen, Menu, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import ConfirmationModal from "../components/ConfirmationModal";
import { useCourseStore } from "../store/useCourseStore";

export default function CoursePage() {
  const {
    selectedCourse,
    allCourses,
    selectCourse,
    fetchAllCourses,
    enrolledCourses,
    enrollCourse,
  } = useCourseStore();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);

  const filteredCourses = Array.isArray(enrolledCourses)
    ? allCourses.filter(
        (course) =>
          !enrolledCourses.some((ec) => ec.id === course.id) &&
          course.title.toLowerCase().includes(search.toLowerCase()) &&
          course.status === "active"
      )
    : allCourses.filter((course) =>
        course.title.toLowerCase().includes(search.toLowerCase())
      );

  useEffect(() => {
    fetchAllCourses();
  }, [fetchAllCourses]);

  const handleEnroll = () => {
    if (selectedCourse) {
      setIsModalOpen(true);
    }
  };

  const confirmEnroll = async () => {
    const result = await enrollCourse();
    if (result === "success") {
      toast.success(`Enrolled in ${selectedCourse.title}!`);
    } else if (result === "already_enrolled") {
      toast.error("You are already enrolled in this course.");
    } else {
      toast.error("Failed to enroll in the course. Please try again.");
    }
    setIsModalOpen(false);
  };

  return (
    <div>
      {selectedCourse && (
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={confirmEnroll}
          title="Confirm Enrollment"
        >
          Are you sure you want to enroll in {selectedCourse.title}?
        </ConfirmationModal>
      )}

      {/* Top bar (mobile) */}
      <div className="flex items-center justify-between p-4 lg:hidden bg-base-200">
        <button
          className="btn btn-ghost btn-square"
          onClick={() => setLeftOpen((s) => !s)}
          aria-label="Toggle menu"
        >
          <Menu />
        </button>
        <h1 className="font-bold text-lg truncate">Enroll Courses</h1>
      </div>

      <div className="flex">
        {/* Left drawer / sidebar */}
        <div
          className={`absolute z-40 lg:static lg:translate-x-0 transition-transform duration-300 rounded-box border border-base-300 ml-2 lg:border-0 w-72 p-4
          ${leftOpen ? "translate-x-0" : "-translate-x-96"} lg:translate-x-0`}
        >
          <h2 className="text-xl font-bold mb-4 hidden lg:block bg-base-200 rounded-box px-4 py-2">
            Enroll Courses
          </h2>

          <ul className="menu rounded-box p-3 gap-2 border border-base-300 bg-base-100 menu-md space-y-1">
            <label className="input input-bordered flex items-center gap-2 w-full">
              <input
                type="text"
                placeholder="Search courses"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="grow"
              />
              <Search className="w-5 h-5 text-base-content/70" />
            </label>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <li key={course.id}>
                  <button
                    onClick={() => selectCourse(course.id)}
                    className={`flex gap-2 items-center ${
                      selectedCourse?.id === course.id ? "active" : ""
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    {course.title}
                  </button>
                </li>
              ))
            ) : (
              <li className="p-4 text-center text-sm text-base-content/70">
                No courses found.
              </li>
            )}
          </ul>
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col p-6">
          {/* If no course selected, show a top-right back button within content */}
          {!selectedCourse && (
            <div className="w-full flex justify-end mb-4">
              <Link to="/student" className="btn btn-neutral btn-sm">
                Back to Dashboard
              </Link>
            </div>
          )}

          {selectedCourse ? (
            <div className="w-full">
              {/* Course Header */}
              <div className="mb-8">
                {/* Title + Status on left, Back button on right */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-bold text-base-content/70 bg-base-200 p-4 rounded-box">
                      {selectedCourse.title}
                    </h1>
                    <span
                      className={`badge text-sm font-semibold px-3 py-1 rounded-full ${
                        selectedCourse.status === "active"
                          ? "badge-success"
                          : selectedCourse.status === "inactive"
                          ? "badge-error"
                          : "badge-warning"
                      }`}
                    >
                      {selectedCourse.status
                        ? selectedCourse.status.charAt(0).toUpperCase() +
                          selectedCourse.status.slice(1)
                        : "Unknown"}
                    </span>
                  </div>

                  {/* ✅ Right-aligned, same row as the course title */}
                  <Link to="/student" className="btn btn-neutral btn-sm">
                    Back to Dashboard
                  </Link>
                </div>

                <p className="text-lg text-base-content/70 leading-relaxed mb-6 bg-base-200 rounded-box px-4 py-2">
                  {selectedCourse.description}
                </p>
              </div>

              {/* Course Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Course ID Card */}
                <div className="card bg-base-100 shadow-md border border-base-300">
                  <div className="card-body p-4">
                    <h3 className="text-sm font-semibold text-base-content/70 uppercase tracking-wide mb-2">
                      Course ID
                    </h3>
                    <p className="text-lg font-mono text-base-content/70">
                      {selectedCourse.course_id || "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Director Card */}
                <div className="card bg-base-100 shadow-md border border-base-300">
                  <div className="card-body p-4">
                    <h3 className="text-sm font-semibold text-base-content/70 uppercase tracking-wide mb-2">
                      Course Director
                    </h3>
                    <p className="text-lg text-base-content/70">
                      {selectedCourse.director_first_name &&
                      selectedCourse.director_last_name
                        ? `${selectedCourse.director_first_name} ${selectedCourse.director_last_name}`
                        : selectedCourse.director_first_name ||
                          selectedCourse.director_last_name ||
                          "Not assigned"}
                    </p>
                    {selectedCourse.director_title && (
                      <p className="text-sm text-base-content/70 mt-1">
                        {selectedCourse.director_title}
                      </p>
                    )}
                    {selectedCourse.director_email && (
                      <p className="text-sm text-blue-600 mt-1">
                        {selectedCourse.director_email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Total Lessons Card */}
                <div className="card bg-base-100 shadow-md border border-base-300">
                  <div className="card-body p-4">
                    <h3 className="text-sm font-semibold text-base-content/70 uppercase tracking-wide mb-2">
                      Total Lessons
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-600">
                        {selectedCourse.lesson_count ||
                          selectedCourse.total_lessons ||
                          0}
                      </span>
                      <span className="text-sm text-base-content/70">
                        lessons
                      </span>
                    </div>
                  </div>
                </div>

                {/* Credits Card */}
                <div className="card bg-base-100 shadow-md border border-base-300">
                  <div className="card-body p-4">
                    <h3 className="text-sm font-semibold text-base-content/70 uppercase tracking-wide mb-2">
                      Course Credits
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-600">
                        {selectedCourse.total_credits || 30}
                      </span>
                      <span className="text-sm text-base-content/70">
                        credits
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {selectedCourse.active_classrooms && (
                <div className="card bg-base-100 shadow-md border border-base-300 mb-6">
                  <div className="card-body p-4">
                    <h4 className="font-semibold">Active Classrooms</h4>
                    <p className="text-sm opacity-75">
                      This course has {selectedCourse.active_classrooms} active
                      classroom
                      {selectedCourse.active_classrooms !== 1 ? "s" : ""}{" "}
                      available for enrollment.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleEnroll}
                  className="btn btn-primary btn-lg"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Enroll Now
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-base-200 w-full rounded-box">
              <BookOpen className="w-16 h-16 text-base-content/70 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-base-content/70 mb-2">
                No Course Selected
              </h2>
              <p className="text-base-content/70">
                Select a course from the sidebar to view detailed information
                including course ID, description, director, and lesson count.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
