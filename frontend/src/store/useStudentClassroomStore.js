import axios from "axios";
import { Flag } from "lucide-react";
import { create } from "zustand";

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:4000" : "";

export const useStudentClassroomStore = create((set) => ({
  classrooms: [],
  studentClassrooms: [],
  enrollmentStatus: false,
  joinedClassroomId: null,
  supervisors: [],

  fetchLessonClassrooms: async (lessonId) => {
    try {
      const { data } = await axios.get(
        `${BASE_URL}/api/classrooms/lessons/${lessonId}/classrooms`
      );
      set({ classrooms: data });
    } catch (error) {
      console.log("Error in fetchClassrooms function", error);
    }
  },

  fetchStudentClassrooms: async (lessonId) => {
    const studentId = localStorage.getItem("userId");
    try {
      const { data } = await axios.get(
        `${BASE_URL}/api/classrooms/student/${studentId}/lesson/${lessonId}`
      );

      set({
        studentClassrooms: data,
        enrollmentStatus: data.length > 0,
        joinedClassroomId: data.length > 0 ? data[0].id : null,
      });
    } catch (error) {
      console.log("Error in fetchClassrooms function", error);
    }
  },

  enrollClassroom: async (classroomId, lessonId) => {
    const studentId = localStorage.getItem("userId");
    const requestData = {
      student_id: studentId,
      classroom_id: classroomId,
      lesson_id: lessonId,
    };

    try {
      await axios.post(`${BASE_URL}/api/classrooms/student/`, requestData);

      set({
        enrollmentStatus: true,
        joinedClassroomId: classroomId,
      });
      return "success";
    } catch (error) {
      console.log("Error enrolling", error);
      return "failure";
    }
  },

  fetchClassroomSupervisors: async (classroomId) => {
    try {
      const { data } = await axios.get(
        `${BASE_URL}/api/classroomSupervisors/${classroomId}/supervisors`
      );

      // store supervisors under their classroomId
      set((state) => ({
        supervisors: {
          ...state.supervisors,
          [classroomId]: data,
        },
      }));
    } catch (error) {
      console.log("Error in fetchClassroomSupervisors", error);
    }
  },
}));
