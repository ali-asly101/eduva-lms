import { Book, ClipboardListIcon, School, Users2 } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function InstructorSidebar() {
  return (
    <aside className="w-64 p-4 border-gray-200">
      <h2 className="text-xl font-bold mb-4 tracking-wide bg-base-200 rounded-box px-4 py-2">
        Instructor
      </h2>
      <ul className="menu rounded-box p-2 border border-base-300 bg-base-100 menu-md space-y-1">
        <li>
          <NavLink
            to="/instructor"
            end
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <Book /> Courses
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/instructor/classrooms"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <School /> Classroom
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/instructor/students"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <Users2 /> Students
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/instructor/report"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <ClipboardListIcon /> Reports
          </NavLink>
        </li>
      </ul>
    </aside>
  );
}