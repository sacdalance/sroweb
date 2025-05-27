import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import supabase from "@/lib/supabase";
import { LogOut, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import PropTypes from 'prop-types';
import React from "react";

const SIDEBAR_WIDTH = 256;
const XL_BREAKPOINT = 1280; // Tailwind's xl

const Sidebar = ({ isOpen, onClose, setIsOpen }) => {
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
    `block px-4 py-2 -mr-6 rounded-l-md transition-all duration-200 ease-in-out transform 
    ${
      location.pathname === path
        ? "text-[#7B1113] text-[17px] font-bold bg-white shadow-sm"
        : "text-[15px] text-black hover:text-gray-700 hover:scale-[1.05] cursor-pointer"
    }`;

  // Responsive: Reset sidebar state on large screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= XL_BREAKPOINT) {
        setIsOpen(false); // Always close overlay/toggle on large screens
      }
    };
    window.addEventListener("resize", handleResize);
    // Initial check
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsOpen]);

  // Helper: Only show overlay on small screens
  const isSmallScreen = typeof window !== "undefined" && window.innerWidth < XL_BREAKPOINT;

  if (!isValidUPMail) return null;

  return (
    <>
      <aside
        className={`
          bg-[#F3F4F6] border-r h-screen flex flex-col
          fixed z-30 top-0 left-0 transition-transform duration-300 
          w-[${SIDEBAR_WIDTH}px]
          -translate-x-full
          xl:static xl:translate-x-0 xl:w-[${SIDEBAR_WIDTH}px] xl:block
          ${isOpen ? "translate-x-0 shadow-lg" : ""}
        `}
        style={{ minWidth: SIDEBAR_WIDTH }}
        aria-label="Sidebar"
      >
        {/* Make the entire sidebar scrollable except the close button */}
        <ScrollArea className="h-screen pt-14 flex flex-col pl-6 pr-0">
          <div className="pr-6 flex flex-col min-h-0">
            {/* Profile section */}
            <div className="flex flex-col items-center mb-8 mt-14">
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
                }[role] || (
                  <span className="inline-flex items-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Assigning...
                  </span>
                )}
              </p>
              <p className="text-sm text-center break-all">{user?.email}</p>
            </div>

            {/* Navigation links */}
            <div className="space-y-1">
              {/* Student & Super Admin: Student sidebar */}
              {(isUser || isSuperAdmin) && (
                <>
                  <hr className="border-t border-[#DBDBDB] my-4" />
                  <div className="mb-4 mt-4 font-medium">
                    <Link
                      to={dashboardLink}
                      className={linkClass(dashboardLink)}
                      onClick={() => isSmallScreen && setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                  </div>
                  <div className="mb-6">
                    <h3 className="uppercase text-base font-bold mb-3">Student Activities</h3>
                    <ul className="space-y-2 text-[15px] font-medium">
                      <li>
                        <Link
                          to="/activity-request"
                          className={linkClass("/activity-request")}
                          onClick={() => isSmallScreen && setIsOpen(false)}
                        >
                          Submit a Request
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/activities"
                          className={linkClass("/activities")}
                          onClick={() => isSmallScreen && setIsOpen(false)}
                        >
                          My Activities
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/activities-calendar"
                          className={linkClass("/activities-calendar")}
                          onClick={() => isSmallScreen && setIsOpen(false)}
                        >
                          Activities Calendar
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/appointment-booking"
                          className={linkClass("/appointment-booking")}
                          onClick={() => isSmallScreen && setIsOpen(false)}
                        >
                          Book an Appointment
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div className="mb-6">
                    <h3 className="uppercase text-base font-bold mb-3 whitespace-nowrap">Organizational Requirements</h3>
                    <ul className="space-y-2 text-[15px] font-medium">
                      <li>
                        <Link
                          to="/org-application"
                          className={linkClass("/org-application")}
                          onClick={() => isSmallScreen && setIsOpen(false)}
                        >
                          Application for Recognition
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/annual-report"
                          className={linkClass("/annual-report")}
                          onClick={() => isSmallScreen && setIsOpen(false)}
                        >
                          Annual Report
                        </Link>
                      </li>
                    </ul>
                  </div>
                </>
              )}

              {/* SRO Staff, ODSA Staff, Super Admin: Admin sidebar */}
              {(isSRO || isODSA || isSuperAdmin) && (
                <div className="mb-6">
                  <ul className="space-y-2 text-[15px] font-medium">
                    <hr className="border-t border-[#DBDBDB] my-4" />
                    <li>
                      <Link
                        to="/admin"
                        className={linkClass("/admin")}
                        onClick={() => isSmallScreen && setIsOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    </li>
                    <hr className="border-t border-[#DBDBDB] my-4" />
                    <h3 className="uppercase text-base font-bold mb-3">Admin Panel</h3>

                    {(isSRO || isSuperAdmin) && (
                      <>
                      <li>
                        <Link
                          to="/admin/appointment-settings"
                          className={linkClass("/admin/appointment-settings")}
                          onClick={() => isSmallScreen && setIsOpen(false)}
                        >
                          Appointments
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/admin/create-activity"
                          className={linkClass("/admin/create-activity")}
                          onClick={() => isSmallScreen && setIsOpen(false)}
                        >
                          Add an Activity
                        </Link>
                      </li>
                      </>
                    )}

                    <li>
                      <Link
                        to="/admin/pending-requests"
                        className={linkClass("/admin/pending-requests")}
                        onClick={() => isSmallScreen && setIsOpen(false)}
                      >
                        Pending Requests
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/admin/activity-summary"
                        className={linkClass("/admin/activity-summary")}
                        onClick={() => isSmallScreen && setIsOpen(false)}
                      >
                        Summary of Activities
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/admin/activities-calendar"
                        className={linkClass("/admin/activities-calendar")}
                        onClick={() => isSmallScreen && setIsOpen(false)}
                      >
                        Activities Calendar
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/admin/org-applications"
                        className={linkClass("/admin/org-applications")}
                        onClick={() => isSmallScreen && setIsOpen(false)}
                      >
                        Organization Applications
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/admin/organizations"
                        className={linkClass("/admin/organizations")}
                        onClick={() => isSmallScreen && setIsOpen(false)}
                      >
                        Summary of Organizations
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/admin/annual-reports"
                        className={linkClass("/admin/annual-reports")}
                        onClick={() => isSmallScreen && setIsOpen(false)}
                      >
                        Annual Reports
                      </Link>
                    </li>
                  </ul>
                  <hr className="border-t border-[#DBDBDB] my-4" />
                </div>
              )}
            </div>

            {/* Footer section */}
            <div className="mt-auto px-6 pb-6 border-gray-200">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[#7B1113] hover:bg-[#7B1113] hover:text-white rounded-md transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </ScrollArea>
        
      </aside>
    </>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  setIsOpen: PropTypes.func.isRequired,
};

export default Sidebar;
