import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { signUp } from "../services/api";
import { signIn } from "../services/api";

export default function AddInstructor() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signup"); // "login" | "signup"
  const [role, setRole] = useState("instructor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const canSignup = role === "instructor";

  // If user switches to a non-student role, force back to login mode
  useEffect(() => {
    if (!canSignup && mode === "signup") setMode("login");
  }, [canSignup, mode]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { user } = await signIn(email, password, role);

      if (user.role !== role) {
        toast.error(
          `This account is a ${user.role}. Please select '${user.role}' to log in.`
        );
        return;
      }

      window.localStorage.setItem("userEmail", user.email);
      window.localStorage.setItem("userId", user.id);
      window.localStorage.setItem("role", user.role);

      if (user.role === "student") navigate("/student");
      else if (user.role === "instructor") navigate("/instructor");
      else navigate("/admin");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!canSignup) return;

    if (mode !== "signup") {
      setMode("signup");
      return;
    }

    if (!email || !password || !firstName || !lastName) {
      toast.error(
        "please fill title (optional), first name, last name, email, password"
      );
      return;
    }

    try {
      const { user } = await signUp({
        role,
        email,
        title,
        first_name: firstName,
        last_name: lastName,
        password,
      });

      //window.localStorage.setItem("userEmail", user.email);
      //window.localStorage.setItem("userId", user.id);
      //window.localStorage.setItem("role", user.role);

      toast.success(`welcome, ${user.first_name} (${user.role})`);

      if (user.role === "student") window.location.assign("/student");
      else if (user.role === "instructor")
        window.location.assign("/admin");
      else window.location.assign("/admin");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "signup failed");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-base-100 rounded-2xl shadow-xl p-6">
        <div className="flex justify-center mb-4">
          {/* ✅ Keep the logo */}
          <img src="/instructor.png" alt="Eduva" className="w-40 h-auto" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-4">
          Create an instructor account
        </h1>

        {/* ✅ Fixed role display (no student/admin buttons) */}
        <div className="mb-4">
          <div className="label">
            <span className="label-text">Role</span>
          </div>
          <p className="px-3 py-2 rounded bg-base-200 font-medium">
            Instructor
          </p>
        </div>

        {/* Auth form */}
        <form className="space-y-3">
          {mode === "signup" && canSignup && (
            <>
              <input
                type="text"
                placeholder="Title (Mr/Ms/Dr...)"
                className="input input-bordered w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                type="text"
                placeholder="First Name"
                className="input input-bordered w-full"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Last Name"
                className="input input-bordered w-full"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            className="input input-bordered w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="input input-bordered w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              onClick={handleLogin}
              className="btn btn-primary flex-1"
              disabled={mode === "signup"}
            >
              Login
            </button>

            <button
              type="button"
              onClick={handleSignUp}
              disabled={!canSignup}
              className="btn flex-1 btn-outline"
            >
              {mode === "signup" ? "Create Account" : "Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
