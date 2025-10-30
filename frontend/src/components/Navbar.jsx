import axios from "axios";
import { CircleUserRound, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export default function Navbar({ theme, setTheme, wallpaper, setWallpaper }) {
  const navigate = useNavigate();
  const { userEmail, userId, role } = useAuthStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Fetch user's full name
  useEffect(() => {
    const loadName = async () => {
      if (!userId) return;
      try {
        const { data } = await axios.get(`/api/users/${userId}`);
        setFirstName(data.first_name ?? "");
        setLastName(data.last_name ?? "");
      } catch (e) {
        console.warn("Could not fetch user full name:", e);
      }
    };
    loadName();
  }, [userId]);

  const isLoggedIn = !!userEmail;

  // Navigate to each user's dashboard
  const handleDashboardClick = () => {
    if (role === "student") navigate("/student");
    else if (role === "instructor") navigate("/instructor");
    else if (role === "admin") navigate("/admin");
    else navigate("/");
  };

  // Navigate to student profile (only if student)
  const handleProfileClick = () => {
    if (role === "student") navigate("/student/profile");
  };

  return (
    <div className="navbar bg-base-100 shadow-sm bg-opacity-90 backdrop-blur-sm">
      <div className="navbar-start pl-6 gap-1">
        <button
          onClick={handleDashboardClick}
          className="btn btn-ghost text-xl"
        >
          <img
            src="/eduva.png"
            alt="Eduva"
            className="h-10 w-10 object-contain"
          />
          <div className="font-semibold">EDUVA</div>
        </button>
      </div>

      <div className="navbar-end pr-6">
        {isLoggedIn ? (
          <div className="flex items-center gap-4">
            {/* Theme toggle */}
            <label className="swap swap-rotate">
              <input
                type="checkbox"
                className="theme-controller"
                value="dim"
                onChange={() => setTheme(theme === "light" ? "dim" : "light")}
                checked={theme === "dim"}
              />
              <Moon className="swap-on" />
              <Sun className="swap-off" />
            </label>

            {/* Wallpaper selector */}
            <select
              className="select select-sm select-bordered"
              value={wallpaper}
              onChange={(e) => setWallpaper(e.target.value)}
            >
              <option value="default">Default</option> 
              <option value="abstract">Abstract</option>
              <option value="minimal">Minimal</option>
              <option value="nature">Nature</option>
              <option value="vibrant">Vibrant</option>
              <option value="zen">Zen</option>
            </select>

            {/* User display */}
            {role === "student" ? (
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost flex items-center gap-2"
                  onClick={handleProfileClick}
                >
                  <CircleUserRound size={32} />
                  <div className="text-left">
                    <div className="font-medium">{firstName || "User"}</div>
                    <div className="text-xs text-gray-500">{lastName}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CircleUserRound size={32} />
                <div className="text-left pr-4">
                  <div className="font-medium">{firstName || "User"}</div>
                  <div className="text-xs text-gray-500">{lastName}</div>
                </div>
              </div>
            )}
            <Link to="/logout" className="btn btn-neutral btn-sm">
              Logout
            </Link>
          </div>
        ) : (
          <Link to="/" className="btn btn-neutral btn-sm">
            Login
          </Link>
        )}
      </div>
    </div>
  );
}
