import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import supabase from "@/lib/supabase";
import { LogOut, Calendar, ClipboardList, Users, BuildingIcon, FileText, PenSquare, Settings } from "lucide-react";

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
  
  // Check if a path is currently active or its subpath is active
  const isActive = (path) => {
    if (path === "/admin" && location.pathname === "/admin") return true;
    if (path !== "/admin" && location.pathname.startsWith(path)) return true;
    return false;
  };

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
            className={`block text-sm font-bold ${isActive(dashboardLink) ? "text-[#7B1113] font-bold" : ""}`}
          >
            Dashboard
          </Link>
        </div>

        <hr className="border-t border-[#DBDBDB] my-2" />

        {/* Admin Pages - only shown to admins */}
        {isAdmin && (
          <>
            <div className="mb-4">
              <h3 className="uppercase text-sm font-bold mb-2 text-[#014421]">Admin</h3>
              <ul className="space-y-1 text-sm font-normal">
                <li>
                  <Link to="/admin/create-activity" className={`flex items-center ${isActive("/admin/create-activity") ? "text-[#7B1113] font-bold" : ""}`}>
                    <PenSquare className={`w-4 h-4 mr-2 ${isActive("/admin/create-activity") ? "text-[#7B1113]" : "text-[#014421]"}`} />
                    Create Activity Form
                  </Link>
                </li>
                <li>
                  <Link to="/admin/pending-requests" className={`flex items-center ${isActive("/admin/pending-requests") ? "text-[#7B1113] font-bold" : ""}`}>
                    <ClipboardList className={`w-4 h-4 mr-2 ${isActive("/admin/pending-requests") ? "text-[#7B1113]" : "text-[#014421]"}`} />
                    Pending Requests
                  </Link>
                </li>
                <li>
                  <Link to="/admin/activity-summary" className={`flex items-center ${isActive("/admin/activity-summary") ? "text-[#7B1113] font-bold" : ""}`}>
                    <FileText className={`w-4 h-4 mr-2 ${isActive("/admin/activity-summary") ? "text-[#7B1113]" : "text-[#014421]"}`} />
                    Activity Summary
                  </Link>
                </li>
                <li>
                  <Link to="/admin/activities-calendar" className={`flex items-center ${isActive("/admin/activities-calendar") ? "text-[#7B1113] font-bold" : ""}`}>
                    <Calendar className={`w-4 h-4 mr-2 ${isActive("/admin/activities-calendar") ? "text-[#7B1113]" : "text-[#014421]"}`} />
                    Activities Calendar
                  </Link>
                </li>
                <li>
                  <Link to="/admin/org-applications" className={`flex items-center ${isActive("/admin/org-applications") ? "text-[#7B1113] font-bold" : ""}`}>
                    <Users className={`w-4 h-4 mr-2 ${isActive("/admin/org-applications") ? "text-[#7B1113]" : "text-[#014421]"}`} />
                    Organization Applications
                  </Link>
                </li>
                <li>
                  <Link to="/admin/organizations" className={`flex items-center ${isActive("/admin/organizations") ? "text-[#7B1113] font-bold" : ""}`}>
                    <BuildingIcon className={`w-4 h-4 mr-2 ${isActive("/admin/organizations") ? "text-[#7B1113]" : "text-[#014421]"}`} />
                    Approved Organizations
                  </Link>
                </li>
                <li>
                  <Link to="/admin/annual-reports" className={`flex items-center ${isActive("/admin/annual-reports") ? "text-[#7B1113] font-bold" : ""}`}>
                    <FileText className={`w-4 h-4 mr-2 ${isActive("/admin/annual-reports") ? "text-[#7B1113]" : "text-[#014421]"}`} />
                    Annual Reports
                  </Link>
                </li>
                <li>
                  <Link to="/admin/appointment-settings" className={`flex items-center ${isActive("/admin/appointment-settings") ? "text-[#7B1113] font-bold" : ""}`}>
                    <Settings className={`w-4 h-4 mr-2 ${isActive("/admin/appointment-settings") ? "text-[#7B1113]" : "text-[#014421]"}`} />
                    Appointment Settings
                  </Link>
                </li>
              </ul>
            </div>
            <hr className="border-t border-[#DBDBDB] my-2" />
          </>
        )}

        {/* Student Activities - only shown to non-admins */}
        {!isAdmin && (
          <>
            <div className="mb-4">
              <h3 className="uppercase text-sm font-bold mb-2 text-[#014421]">Student Activities</h3>
              <ul className="space-y-1 text-sm font-normal">
                <li>
                  <Link to="/activity-request" className={`flex items-center ${isActive("/activity-request") ? "text-[#7B1113] font-bold" : ""}`}>
                    <PenSquare className={`w-4 h-4 mr-2 ${isActive("/activity-request") ? "text-[#7B1113]" : "text-[#014421]"}`} />
                    Activity Request
                  </Link>
                </li>
                <li>
                  <Link to="/appointment-booking" className={`flex items-center ${isActive("/appointment-booking") ? "text-[#7B1113] font-bold" : ""}`}>
                    <Calendar className={`w-4 h-4 mr-2 ${isActive("/appointment-booking") ? "text-[#7B1113]" : "text-[#014421]"}`} />
                    Appointment Booking
                  </Link>
                </li>
              </ul>
            </div>

            <hr className="border-t border-[#DBDBDB] my-2" />

            {/* Org Requirements */}
            <div className="mb-4">
              <h3 className="uppercase text-sm font-bold mb-2 whitespace-nowrap text-[#014421]">
                Organizational Requirements
              </h3>
              <ul className="space-y-1 text-sm font-normal">
                <li>
                  <Link to="/org-application" className={`flex items-center ${isActive("/org-application") ? "text-[#7B1113] font-bold" : ""}`}>
                    <BuildingIcon className={`w-4 h-4 mr-2 ${isActive("/org-application") ? "text-[#7B1113]" : "text-[#014421]"}`} />
                    Organizational Application
                  </Link>
                </li>
                <li>
                  <Link to="/annual-report" className={`flex items-center ${isActive("/annual-report") ? "text-[#7B1113] font-bold" : ""}`}>
                    <FileText className={`w-4 h-4 mr-2 ${isActive("/annual-report") ? "text-[#7B1113]" : "text-[#014421]"}`} />
                    Annual Report
                  </Link>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Logout */}
      <div className="mb-6">
        <hr className="border-t border-[#DBDBDB] my-2" />
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm font-semibold py-2 px-3 hover:bg-gray-200 transition rounded w-full text-[#7B1113]"
        >
          <LogOut className="w-5 h-5 text-[#7B1113]" />
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
