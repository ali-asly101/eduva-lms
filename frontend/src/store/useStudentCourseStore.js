import axios from "axios";
import { create } from "zustand";

// base url will be dynamic depending on the environment
const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:4000" : "";

export const useStudentCourseStore = create((set, get) => ({
  courses: [],
  selectedCourse: null,
  selectCourse: (id) => {
    const course = get().courses.find((c) => c.id === id) || null;
    set({ selectedCourse: course });
  },

  fetchCourses: async () => {
    const studentId = localStorage.getItem("userId");
    try {
      const response = await axios.get(`api/enrolments/students/${studentId}`);
      const data = response.data;
      set({ courses: data });
    } catch (error) {
      console.log("Error in fetchCourses function", error);
    }
  },

  completeCourse: async (course) => {
    const studentId = localStorage.getItem("userId");
    const completionData = {
      student_id: studentId,
      course_id: course.id,
      final_grade: 100.00,
      completion_status: "completed",
      total_credits_earned: course.total_credits,
      certificate_issued: false,
      certificate_number: 0,
    };

    const updatedStudentEnrolment = {
      "progress": 100,
      "status": "completed"
    };

    try {
      //await axios.put(`${BASE_URL}/api/enrolments/students/${studentId}/courses/${course.id}`, updatedStudentEnrolment);
      await axios.post(`${BASE_URL}/api/completionStatus`, completionData);
      return "success";
    } catch (error) {
      console.log("Error in completeCourse function", error);
      return "failure";
    }
  },
}));
