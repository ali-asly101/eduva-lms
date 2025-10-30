import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";

// base url will be dynamic depending on the environment
const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "";

export const useUserStore = create((set, get) => ({
  // users state
  Users: [],
  loading: false,
  error: null,
  currentUser: null,

  // form state which will be change depending on columns of database
  formData: {
    name: "",
    id: "",
    email: "",
    password: "",
    courseEnrolled: "",
    credits: "",
  },

  setFormData: (formData) => set({ formData }),
  resetForm: () => set({ formData: { name: "", id: "", email: "" , password: "", courseEnrolled: "", credits: ""} }),

  addUser: async (e) => {
    e.preventDefault();
    set({ loading: true });

    try {
      const { formData } = get();
      await axios.post(`${BASE_URL}/api/users`, formData);
      await get().fetchUsers();
      get().resetForm();
      toast.success("User added successfully");
      document.getElementById("add_user_modal").close();
    } catch (error) {
      console.log("Error in addUser function", error);
      toast.error("Something went wrong");
    } finally {
      set({ loading: false });
    }
  },

  fetchUsers: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BASE_URL}/api/users`);
      set({ users: response.data.data, error: null });
    } catch (err) {
      if (err.status == 429) set({ error: "Rate limit exceeded", users: [] });
      else set({ error: "Something went wrong", users: [] });
    } finally {
      set({ loading: false });
    }
  },

  deleteUser: async (id) => {
    console.log("deleteUser function called", id);
    set({ loading: true });
    try {
      await axios.delete(`${BASE_URL}/api/users/${id}`);
      set((prev) => ({ users: prev.users.filter((user) => user.id !== id) }));
      toast.success("User deleted successfully");
    } catch (error) {
      console.log("Error in deleteUser function", error);
      toast.error("Something went wrong");
    } finally {
      set({ loading: false });
    }
  },

  fetchUser: async (id) => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BASE_URL}/api/users/${id}`);
      set({
        currentUser: response.data.data,
        formData: response.data.data, // pre-fill form with current product data
        error: null,
      });
    } catch (error) {
      console.log("Error in fetchUser function", error);
      set({ error: "Something went wrong", currentUser: null });
    } finally {
      set({ loading: false });
    }
  },
  updateUser: async (id) => {
    set({ loading: true });
    try {
      const { formData } = get();
      const response = await axios.put(`${BASE_URL}/api/users/${id}`, formData);
      set({ currentUser: response.data.data });
      toast.success("User updated successfully");
    } catch (error) {
      toast.error("Something went wrong");
      console.log("Error in updateUser function", error);
    } finally {
      set({ loading: false });
    }
  },
}));
