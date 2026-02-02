import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import supabase from "@/lib/supabase";
import { LogOut, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingSpinner from "@/components/ui/loading-spinner.jsx";
import { SUPERADMIN_EMAILS } from "@/lib/permissions";
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
  const isSuperAdminEmail = user && SUPERADMIN_EMAILS.includes(user.email);

  const dashboardLink = isUser || isSuperAdmin ? "/dashboard" : "/admin";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("sroRemindersSeen");
    navigate("/login");
  };

  const linkClass = (path) =>
    `block px-6 py-3 xl:px-4 xl:py-2 xl:-mr-6 rounded-none xl:rounded-l-md transition-all duration-200 ease-in-out transform text-center sm:text-left
    ${location.pathname === path
      ? "text-sro-primary text-[17px] font-bold bg-white shadow-sm"
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
          bg-gray-100 border-r h-screen flex flex-col
          fixed z-[60] xl:z-0 top-0 left-0 transition-transform duration-300 
          w-full sm:w-64 shrink-0
          -translate-x-full
          xl:static xl:translate-x-0 xl:block
          ${isOpen ? "translate-x-0 shadow-lg" : ""}
        `}
        aria-label="Sidebar"
      >
        {/* Make the entire sidebar scrollable except the close button */}
        <div className="xl:hidden absolute top-4 right-4 z-[70]">
          <button onClick={onClose} className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300">
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>
        <ScrollArea className="h-screen pt-16 xl:pt-14 flex flex-col pl-0 xl:pl-6 pr-0">
          <div className="pr-0 xl:pr-6 flex flex-col min-h-0">
            {/* Profile section */}
            <div className="flex flex-col items-center mb-8 mt-12 xl:mt-10">
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
              <p className="text-base italic text-center text-sro-primary">
                {{
                  1: "Student",
                  2: "SRO Staff",
                  3: "ODSA Staff",
                  4: "Super Admin",
                }[role] || (
                    <LoadingSpinner text="Assigning..." variant="inline" className="text-sro-primary" />
                  )}
              </p>
              <p className="text-sm text-center break-all">{user?.email}</p>
            </div>

            {/* Navigation links */}
            <div className="space-y-1">
              {/* Student & Super Admin: Student sidebar */}
              {(isUser || isSuperAdmin) && (
                <>
                  <hr className="border-t border-sro-border-light my-4" />
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
                    <h3 className="uppercase text-base font-bold mb-3 text-center sm:text-left px-6 xl:px-0">Student Activities</h3>
                    <ul className="space-y-2 text-[15px] font-medium">
                      <li>
                        <Link
                          to="/requests"
                          className={linkClass("/requests")}
                          onClick={() => isSmallScreen && setIsOpen(false)}
                        >
                          <span className="flex-1 whitespace-nowrap">
                            My Requests
                          </span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/activity-request"
                          className={linkClass("/activity-request")}
                          onClick={() => isSmallScreen && setIsOpen(false)}
                        >
                          <span className="flex-1 whitespace-nowrap">
                            New Activity Request
                          </span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/appointment-booking"
                          className={linkClass("/appointment-booking")}
                          onClick={() => isSmallScreen && setIsOpen(false)}
                        >
                          <span className="flex-1 whitespace-nowrap">
                            Book Appointment
                          </span>
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
                    </ul>
                  </div>
                  <div className="mb-6">
                    <h3 className="uppercase text-base font-bold mb-3 text-center sm:text-left px-6 xl:px-0 whitespace-nowrap">Org Requirements</h3>
                    <ul className="space-y-2 text-[15px] font-medium">
                      <li>
                        <Link
                          to="/org-application"
                          className={linkClass("/org-application")}
                          onClick={() => isSmallScreen && setIsOpen(false)}
                        >
                          <span className="flex-1 whitespace-nowrap">
                            Recognition Application
                          </span>
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
                  {/* Admin Dashboard - Top Level */}
                  <ul className="space-y-2 text-[15px] font-medium">
                    <hr className="border-t border-sro-border-light my-4" />
                    <li>
                      <Link
                        to="/admin"
                        className={linkClass("/admin")}
                        onClick={() => isSmallScreen && setIsOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    </li>
                  </ul>

                  {/* ACTIVITIES Section */}
                  <hr className="border-t border-sro-border-light my-4" />
                  <h3 className="uppercase text-base font-bold mb-3 text-center sm:text-left px-6 xl:px-0">ACTIVITIES</h3>
                  <ul className="space-y-2 text-[15px] font-medium">

                    {(isSRO || isSuperAdmin) && (
                      <li>
                        <Link
                          to="/admin/create-activity"
                          className={linkClass("/admin/create-activity")}
                          onClick={() => isSmallScreen && setIsOpen(false)}
                        >
                          Create Activity
                        </Link>
                      </li>
                    )}

                    <li>
                      <Link
                        to="/admin/student-activities"
                        className={linkClass("/admin/student-activities")}
                        onClick={() => isSmallScreen && setIsOpen(false)}
                      >
                        Student Activities
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/admin/activity-summary"
                        className={linkClass("/admin/activity-summary")}
                        onClick={() => isSmallScreen && setIsOpen(false)}
                      >
                        Activity Summary
                      </Link>
                    </li>
                  </ul>

                  {/* ORGANIZATIONS Section */}
                  <hr className="border-t border-sro-border-light my-4" />
                  <h3 className="uppercase text-base font-bold mb-3 text-center sm:text-left px-6 xl:px-0">ORGANIZATIONS</h3>
                  <ul className="space-y-2 text-[15px] font-medium">

                    {(isSRO || isSuperAdmin) && (
                      <li>
                        <Link
                          to="/admin/appointment-settings"
                          className={linkClass("/admin/appointment-settings")}
                          onClick={() => isSmallScreen && setIsOpen(false)}
                        >
                          Appointments
                        </Link>
                      </li>
                    )}

                    <li>
                      <Link
                        to="/admin/organizations"
                        className={linkClass("/admin/organizations")}
                        onClick={() => isSmallScreen && setIsOpen(false)}
                      >
                        Organization Summary
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/admin/org-applications"
                        className={linkClass("/admin/org-applications")}
                        onClick={() => isSmallScreen && setIsOpen(false)}
                      >
                        Recognition Applications
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
                  <hr className="border-t border-sro-border-light my-4" />
                </div>
              )}

              {isSuperAdminEmail && (
                <div className="mb-6">
                  <hr className="border-t border-sro-border-light my-4" />
                  <ul className="space-y-2 text-[15px] font-medium">
                    <li>
                      <Link
                        to="/admin/super-admin"
                        className={linkClass("/admin/super-admin")}
                        onClick={() => isSmallScreen && setIsOpen(false)}
                      >
                        Super Admin Page
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Footer section */}
            <div className="mt-auto px-6 pb-6 border-gray-200 space-y-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sro-primary hover:bg-sro-primary hover:text-white rounded-md transition-colors duration-200"
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
