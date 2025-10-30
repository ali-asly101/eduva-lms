import { MinusCircleIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export default function Logout() {
  const navigate = useNavigate();
  const { clearLocalStorage } = useAuthStore();

  const handleLogout = () => {
    clearLocalStorage();
    navigate("/");
  };

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="bg-base-200 mt-6 items-center flex flex-col p-6 rounded-box ">
        <p className="text-lg">Are you sure you want to logout?</p>
        <div className="flex gap-2 pt-4">
          <button onClick={() => navigate(-1)} className="btn btn-error">
            Cancel
          </button>
          <button
            onClick={handleLogout}
            className="btn btn-neutral flex items-center"
          >
            <MinusCircleIcon className="size-5 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
