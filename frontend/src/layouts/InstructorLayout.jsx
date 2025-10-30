import { Outlet } from "react-router-dom";
import InstructorSidebar from "../components/InstructorSidebar";

export default function InstructorLayout() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
      <InstructorSidebar />
      <div className="flex-1 min-w-0">
        {/* All instructor pages render here */}
        <Outlet />
      </div>
    </div>
  );
}
