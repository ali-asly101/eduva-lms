import { create } from "zustand";

export const useAuthStore = create((set) => ({
  userEmail: localStorage.getItem("userEmail"),
  setLocalUserEmail: (email) => {
    if (email) {
      localStorage.setItem("userEmail", email);
    } else {
      localStorage.removeItem("userEmail");
    }
    set({ userEmail: email });
  },

  userId: localStorage.getItem("userId"),
  setLocalUserId: (id) => {
    if (id) {
      localStorage.setItem("userId", id);
    } else {
      localStorage.removeItem("userId");
    }
    set({ userId: id });
  },

  role: localStorage.getItem("role"),
  setLocalRole: (role) => {
    if (role) {
      localStorage.setItem("role", role);
    } else {
      localStorage.removeItem("role");
    }
    set({ role: role });
  },

  clearLocalStorage: () => {
    localStorage.clear(),
    set({ userEmail: null, userId: null, role: null });
  },
}));
