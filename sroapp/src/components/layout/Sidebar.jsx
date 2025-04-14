import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import supabase from "@/lib/supabase";
import { LogOut } from "lucide-react";

const Sidebar = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();
  const location = useLocation(); // for highlighting active link

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);

      if (user) {
        const { data, error } = await supabase
          .from("account")
          .select("role_id")
          .eq("email", user.email)
          .single();
        if (!error && data) setRole(data.role_id);
      }
    };

    fetchUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const isValidUPMail = user && user.email.endsWith("@up.edu.ph");
  const isAdmin = role === 2 || role === 3;
  const dashboardLink = isAdmin ? "/admin" : "/dashboard";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // Highlight class if current location matches
const linkClass = (path) =>
  `hover:text-gray-700 ${location.pathname === path ? "text-[#7B1113] font-bold" : ""}`;

  if (!isValidUPMail) return null;

  return (
    <aside className="w-72 min-h-screen bg-[#F3F4F6] text-black fixed top-0 left-0 z-20 pt-20 px-4 flex flex-col justify-between">
      <div>
        {/* Profile */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={user?.user_metadata?.avatar_url || "https://via.placeholder.com/80"}
            className="w-20 h-20 rounded-full"
            alt="User"
          />
          <h2 className="text-lg font-semibold mt-2 text-center">
            {user?.user_metadata?.full_name || "User"}
          </h2>
          <p className="text-sm italic text-center">{isAdmin ? "Admin" : "Student"}</p>
          <p className="text-xs text-center break-all">{user.email}</p>
        </div>

        <hr className="border-t border-[#DBDBDB] my-2" />

        {/* Dashboard */}
        <div className="mb-4 mt-4">
          <Link
            to={dashboardLink}
            className={`block text-sm font-bold ${linkClass(dashboardLink)}`}
          >
            Dashboard
          </Link>
        </div>

        <hr className="border-t border-[#DBDBDB] my-2" />

        {/* Student Activities */}
        <div className="mb-4">
          <h3 className="uppercase text-sm font-bold mb-2">Student Activities</h3>
          <ul className="space-y-1 text-sm font-normal">
            <li>
              <Link to="/activity-request" className={linkClass("/activity-request")}>
                Activity Request
              </Link>
            </li>
            <li>
              <Link to="/appointment-booking" className={linkClass("/appointment-booking")}>
                Appointment Booking
              </Link>
            </li>
          </ul>
        </div>

        <hr className="border-t border-[#DBDBDB] my-2" />

        {/* Org Requirements */}
        <div className="mb-4">
          <h3 className="uppercase text-sm font-bold mb-2 whitespace-nowrap">
            Organizational Requirements
          </h3>
          <ul className="space-y-1 text-sm font-normal">
            <li>
              <Link to="/org-application" className={linkClass("/org-application")}>
                Organizational Application
              </Link>
            </li>
            <li>
              <Link to="/annual-report" className={linkClass("/annual-report")}>
                Annual Report
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Logout */}
      <div className="mb-6">
        <hr className="border-t border-[#DBDBDB] my-2" />
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm font-semibold py-2 px-3 hover:bg-gray-200 transition rounded w-full"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
