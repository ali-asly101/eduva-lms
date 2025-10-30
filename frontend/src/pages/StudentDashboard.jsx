import { PlusCircleIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { useStudentCourseStore } from "../store/useStudentCourseStore";

function StudentDashboard() {
  const { courses, fetchCourses, completeCourse } = useStudentCourseStore();
  const [search, setSearch] = useState("");

  const filteredCourses = Array.isArray(courses)
    ? courses.filter(
        (course) =>
          course.status === "active" &&
          course.title.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* ===== Header ===== */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold bg-base-200 px-4 py-2 rounded-box">
          My Courses
        </h1>
      </div>

      {/* ===== Actions Row ===== */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        {/* Enroll Course button */}
        <button
          className="btn btn-neutral w-full sm:w-auto flex items-center justify-center"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = "student/enroll";
          }}
        >
          <PlusCircleIcon className="size-5 mr-2" />
          Enroll Course
        </button>

        {/* Search box */}
        <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
          <input
            type="text"
            placeholder="Search Courses"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered w-full sm:w-64 md:w-80 rounded-full pl-8 pr-12"
          />
          {search && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-gray-900 transition-colors duration-200"
              onClick={() => setSearch("")}
            >
              <X />
            </button>
          )}
        </div>
      </div>

      {/* ===== Course Cards ===== */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Link to={`/student/course/${course.id}`} key={course.id}>
              <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                {/* Image */}
                <figure className="relative w-full px-4 pt-4">
                  <img
                    src="eduva_text.png"
                    alt="eduva text logo"
                    className="object-contain h-48 mx-auto"
                  />
                </figure>

                {/* Body */}
                <div className="card-body text-base sm:text-lg flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold truncate">{course.title}</h3>
                      <span className="font-bold text-gray-500 text-sm sm:text-base">
                        {course.progress}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-4 mb-2">
                      {course.description}
                    </p>
                    <p className="text-sm">
                      Status:{" "}
                      {course.progress === 100 ? "Completed" : "In progress"}
                    </p>
                  </div>

                  {course.progress === 100 && (
                    <button
                      className="btn btn-primary mt-4 w-full sm:w-auto"
                      onClick={(e) => {
                        e.preventDefault();
                        completeCourse(course);
                        toast.success("Well done!");
                      }}
                    >
                      Done
                    </button>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center text-center">
          <div className="mt-16 bg-base-300 rounded-box py-12 w-2/3">
            <p className="text-gray-600 text-2xl sm:text-3xl font-bold">
              No courses found
            </p>
            <p className="text-gray-600 text-base sm:text-xl mt-4">
              Enroll in a course to get started
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

export default StudentDashboard;
