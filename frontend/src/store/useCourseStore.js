import axios from "axios";
import { create } from "zustand";

// base url will be dynamic depending on the environment
const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:4000" : "";

export const useCourseStore = create((set, get) => ({
  // users state
  allCourses: [],
  selectedCourse: null,
  enrolledCourses: [],

  selectCourse: (id) => {
    const course = get().allCourses.find((c) => c.id === id) || null;
    set({ selectedCourse: course });
  },

  fetchAllCourses: async () => {
    const studentId = localStorage.getItem("userId");
    try {
      const [allCoursesRes, enrolledCoursesRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/courses`),
        axios.get(`${BASE_URL}/api/enrolments/students/${studentId}`),
      ]);

      set({
        allCourses: allCoursesRes.data,
        enrolledCourses: enrolledCoursesRes.data,
      });
    } catch (error) {
      console.log("Error in fetchCourses function", error);
    }
  },

  enrollCourse: async () => {
    const studentId = localStorage.getItem("userId");
    const selectedCourse = get().selectedCourse;

    if (get().enrolledCourses.length >= 1) {
      const isAlreadyEnrolled = get().enrolledCourses.some(
        (c) => c.id === selectedCourse.id
      );
      if (isAlreadyEnrolled) {
        console.log("Student is already enrolled in this course.");
        return "already_enrolled";
      }
    }

    const enrolmentData = {
      student_id: studentId,
      course_id: get().selectedCourse.id,
      progress: 0,
      credits: 0,
      status: "enrolled",
    };

    try {
      await axios.post(`${BASE_URL}/api/enrolments`, enrolmentData);
      if (get().enrolledCourses.length >= 1) {
        set((state) => ({
          enrolledCourses: [
            ...state.enrolledCourses,
            { ...selectedCourse, progress: 0 },
          ],
        }));
      } else {
        set({ enrolledCourses: [{ ...selectedCourse, progress: 0 }] });
      }
      return "success";
    } catch (error) {
      console.log("Error in enrollCourse function", error);
      return "failure";
    }
  },
}));
