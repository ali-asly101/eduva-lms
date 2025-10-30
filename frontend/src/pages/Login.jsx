import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { signIn, signUp } from "../services/api";
import { useAuthStore } from "../store/useAuthStore";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  
  const { setLocalUserEmail, setLocalUserId, setLocalRole } = useAuthStore.getState();

  const canSignup = role === "student";

  useEffect(() => {
    if (!canSignup && mode === "signup") setMode("login");
  }, [canSignup, mode]);

  useEffect(() => {
    if (mode === "login") {
      setConfirmPassword("");
    }
  }, [mode]);

  // Email validation function
  const validateEmail = (email) => {
    if (!email) {
      return "Email is required";
    }
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    
    return null; // No error
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { user } = await signIn(email, password, role);

      if (user.role !== role) {
        toast.error(`This account is a ${user.role}. Please select '${user.role}' to log in.`);
        return;
      }

      setLocalUserEmail(user.email);
      setLocalUserId(user.id);
      setLocalRole(user.role);

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

    // Check required fields
    if (!firstName || !lastName) {
      toast.error("Please fill in your first name and last name");
      return;
    }

    // Validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      toast.error(emailError);
      return;
    }

    // Validate password
    if (!password) {
      toast.error("Password is required");
      return;
    }

    const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.error("Password must be at least 8 characters and contain at least one special symbol");
      return;
    }

    // Password confirmation validation
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
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

      setLocalUserEmail(user.email);
      setLocalUserId(user.id);
      setLocalRole(user.role);

      toast.success(`Welcome, ${user.first_name} (${user.role})`);

      if (user.role === "student") window.location.assign("/student");
      else if (user.role === "instructor") window.location.assign("/instructor");
      else window.location.assign("/admin");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-base-100 rounded-2xl shadow-xl p-6">
        <div className="flex justify-center mb-4">
          <img src="/eduva_text.png" alt="Eduva" className="w-40 h-auto" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-4">
          {mode === "signup" ? "Create an account" : "Welcome to Eduva LMS"}
        </h1>

        <div className="mb-4">
          <div className="label">
            <span className="label-text">Select role</span>
          </div>
          <div className="join w-full">
            {["student", "instructor", "admin"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`btn join-item w-1/3 ${role === r ? "btn-primary" : ""}`}
              >
                {r[0].toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
          {!canSignup && (
            <p className="text-xs opacity-70 mt-2">
              Instructors/Admins are created by Admin – only Students can sign up.
            </p>
          )}
        </div>

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

          {mode === "signup" && canSignup && (
            <input
              type="password"
              placeholder="Re-enter Password"
              className="input input-bordered w-full"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}

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
              title={canSignup ? (mode === "signup" ? "Create account" : "Switch to sign up") : "Only students can sign up"}
              className={`btn flex-1 ${canSignup ? "btn-outline" : "btn-disabled"}`}
              aria-disabled={!canSignup}
            >
              {mode === "signup" ? "Create Account" : "Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}