import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";

import AddInstructor from "./pages/AddInstructor";
import AdminDashboard from "./pages/AdminDashboard";
import BrowseCoursePage from "./pages/BrowseCoursePage";
import ClassroomManagement from "./pages/ClassroomManagement";
import InstructorDashboard from "./pages/InstructorDashboard";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import StudentDashboard from "./pages/StudentDashboard";

import InstructorLayout from "./layouts/InstructorLayout";
import InstructorClassrooms from "./pages/InstructorClassrooms";
import InstructorLessonsClassrooms from "./pages/InstructorLessonsClassrooms";
import InstructorReport from "./pages/InstructorReport";
import InstructorReportCourse from "./pages/InstructorReportCourse";
import InstructorStudents from "./pages/InstructorStudents";

import { Toaster } from "react-hot-toast";
import { Route, Routes } from "react-router-dom";
import StudentCourseLayout from "./layouts/StudentCourseLayout";
import InstructorCourseStudentList from "./pages/InstructorCourseStudentList";
import StudentCoursePage from "./pages/StudentCoursePage";
import StudentLesson from "./pages/StudentLesson";
import StudentLessonClassroom from "./pages/StudentLessonClassroom";

// NEW
import InstructorClassroomStudentList from "./pages/InstructorClassroomStudentList";
import InstructorCourseLessonManagement from "./pages/InstructorCourseLessonManagement";

// NEW: Student Profile page
import StudentProfile from "./pages/StudentProfile";

// NEW: student progress report
import StudentProgress from "./pages/StudentProgress";

function App() {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") ? localStorage.getItem("theme") : "light"
  );

  // NEW: wallpaper state
  const [wallpaper, setWallpaper] = useState(
    localStorage.getItem("wallpaper") || "abstract"
  );

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Save wallpaper choice
  useEffect(() => {
    localStorage.setItem("wallpaper", wallpaper);
  }, [wallpaper]);

  return (
    <div
      className="min-h-screen bg-base-200 transition-colors duration-300"
      data-theme={theme}
      style={{
        backgroundImage:
          wallpaper === "default"
            ? "none"
            : `url(/wallpapers/${wallpaper}.jpg)`,
        backgroundSize: wallpaper === "default" ? "auto" : "cover",
        backgroundPosition: "center",
        backgroundAttachment: wallpaper === "default" ? "scroll" : "fixed",
        backgroundColor: "bg-base-200",
      }}
    >
      <Navbar
        theme={theme}
        setTheme={setTheme}
        wallpaper={wallpaper}
        setWallpaper={setWallpaper}
      />

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/logout" element={<Logout />} />

        {/* Student routes */}
        <Route path="/student/enroll" element={<BrowseCoursePage />} />
        <Route path="/student" element={<StudentDashboard />} />
        {/* NEW: Student profile */}
        <Route path="/student/profile" element={<StudentProfile />} />

        <Route
          path="/student/course/:courseId"
          element={<StudentCourseLayout />}
        >
          <Route index element={<StudentCoursePage />} />
          <Route path="lesson/:lessonId" element={<StudentLesson />} />
          <Route
            path="lesson/:lessonId/classroom"
            element={<StudentLessonClassroom />}
          />
        </Route>

        {/* Instructor */}
        <Route path="/instructor" element={<InstructorLayout />}>
          <Route index element={<InstructorDashboard />} />
          <Route path="courses" element={<InstructorDashboard />} />
          <Route path="classrooms" element={<InstructorClassrooms />} />
          <Route
            path="classrooms/:classroomId/students"
            element={<InstructorClassroomStudentList />}
          />
          <Route path="students" element={<InstructorStudents />} />
          <Route path="report" element={<InstructorReport />} />
          <Route
            path="report/course/:courseId"
            element={<InstructorReportCourse />}
          />
          <Route path="report/:id/progress" element={<StudentProgress />} />
          <Route path="classroomManagement" element={<ClassroomManagement />} />
          <Route
            path="courses/:courseId/classrooms"
            element={<InstructorLessonsClassrooms />}
          />
          <Route
            path="courses/:courseId/students"
            element={<InstructorCourseStudentList />}
          />
          <Route
            path="courses/:courseId/lessons"
            element={<InstructorCourseLessonManagement />}
          />
          <Route path="students/:id/profile" element={<StudentProfile />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/add-instructor" element={<AddInstructor />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
