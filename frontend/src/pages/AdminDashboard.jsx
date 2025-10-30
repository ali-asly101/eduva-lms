import { useEffect } from "react";
import { useUserStore } from "../store/useUserStore";
import { PackageIcon, PlusCircleIcon, RefreshCwIcon } from "lucide-react";
//import ProductCard from "../components/ProductCard";
import AddInstructorModal from "../components/AddInstructorModal";

export default function AdminDashboard() {
  const { users, loading, error, fetchUsers } = useUserStore();
  
  return (
  <main className="max-w-6xl mx-auto px-4 py-8 ">
      <div className="flex justify-between items-center mb-8">
          {/* Add Instructor button */}
          <button
            className="btn btn-primary"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = "/add-instructor";
            }}
          >
            <PlusCircleIcon className="size-5 mr-2" />
            Add Instructor
          </button>
        </div>
      
    </main>);
}
