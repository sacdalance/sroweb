import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import supabase from "@/lib/supabase";
import { LogOut } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const Sidebar = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
  const isUser = role === 1;
  const isSRO = role === 2;
  const isODSA = role === 3;
  const isSuperAdmin = role === 4;

  const dashboardLink = isUser || isSuperAdmin ? "/dashboard" : "/admin";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("sroRemindersSeen");
    navigate("/login");
  };

  const linkClass = (path) =>
    `block px-4 py-2 rounded-md -mx-2 transition-all duration-200 ease-in-out transform 
    ${
      location.pathname === path
        ? "text-[#7B1113] text-[17px] font-bold bg-white shadow-sm"
        : "text-[15px] text-black hover:text-gray-700 hover:scale-[1.05] cursor-pointer"
    }`;

  if (!isValidUPMail) return null;

  return (
    <aside className="w-80 h-screen bg-[#F3F4F6] text-black fixed top-0 left-0 z-20 pt-20 px-5   flex flex-col">
      <ScrollArea className="flex-1 min-h-0 pr-2">
        <div className="flex flex-col items-center mb-8">
          <img
            src={
              user?.user_metadata?.avatar_url ||
              "https://static.vecteezy.com/system/resources/thumbnails/018/795/669/small_2x/man-or-profile-icon-png.png"
            }
            className="w-24 h-24 rounded-full"
            alt="User"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-xl font-semibold mt-3 text-center">
            {user?.user_metadata?.full_name || "User"}
          </h2>
          <p className="text-base italic text-center">
            {{
              1: "Student",
              2: "SRO Staff",
              3: "ODSA Staff",
              4: "Super Admin",
            }[role] || "Undefined"}
          </p>
          <p className="text-sm text-center break-all">{user.email}</p>
        </div>

        <hr className="border-t border-[#DBDBDB] my-4" />

        <div className="mb-4 mt-4 font-medium">
          <Link to={dashboardLink} className={linkClass(dashboardLink)}>
            Dashboard
          </Link>
        </div>

        <hr className="border-t border-[#DBDBDB] my-4" />

        {(isUser || isSuperAdmin) && (
          <>
            <div className="mb-6">
              <h3 className="uppercase text-base font-bold mb-3">Student Activities</h3>
              <ul className="space-y-2 text-[15px] font-medium">
                <li><Link to="/activity-request" className={linkClass("/activity-request")}>Submit a Request</Link></li>
                <li><Link to="/activities" className={linkClass("/activities")}>My Activities</Link></li>
                <li><Link to="/appointment-booking" className={linkClass("/appointment-booking")}>Appointment Booking</Link></li>
              </ul>
            </div>

            <hr className="border-t border-[#DBDBDB] my-4" />

            <div className="mb-6">
              <h3 className="uppercase text-base font-bold mb-3 whitespace-nowrap">Organizational Requirements</h3>
              <ul className="space-y-2 text-[15px] font-medium">
                <li><Link to="/org-application" className={linkClass("/org-application")}>Organizational Application</Link></li>
                <li><Link to="/annual-report" className={linkClass("/annual-report")}>Annual Report</Link></li>
              </ul>
            </div>

            <hr className="border-t border-[#DBDBDB] my-4" />
          </>
        )}

        {(isSRO || isODSA || isSuperAdmin) && (
          <div className="mb-6">
            <h3 className="uppercase text-base font-bold mb-3">Admin Panel</h3>
            <ul className="space-y-2 text-[15px] font-medium">
              <li><Link to="/admin" className={linkClass("/admin")}>Admin Dashboard</Link></li>
              <li><Link to="/admin/appointment-settings" className={linkClass("/admin/appointment-settings")}>Appointment Settings</Link></li>
              <li><Link to="/admin/create-activity" className={linkClass("/admin/create-activity")}>Create Activity</Link></li>
              <li><Link to="/admin/pending-requests" className={linkClass("/admin/pending-requests")}>Pending Requests</Link></li>
              <li><Link to="/admin/activity-summary" className={linkClass("/admin/activity-summary")}>Activity Summary</Link></li>
              <li><Link to="/admin/activities-calendar" className={linkClass("/admin/activities-calendar")}>Activities Calendar</Link></li>
              <li><Link to="/admin/org-applications" className={linkClass("/admin/org-applications")}>Org Applications</Link></li>
              <li><Link to="/admin/organizations" className={linkClass("/admin/organizations")}>Organizations</Link></li>
              <li><Link to="/admin/annual-reports" className={linkClass("/admin/annual-reports")}>Annual Reports</Link></li>
            </ul>
          </div>
        )}
      </ScrollArea>

      <div className="py-6 border-t border-[#DBDBDB]">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-[15px] font-medium py-3 px-4 rounded-md -mx-2 w-full transition-transform duration-200 ease-in-out hover:bg-white hover:text-[#7B1113] hover:scale-105 cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
