import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import supabase from "@/lib/supabase";
import {
  LogOut, X, ChevronDown,
  LayoutDashboard, FileText, PlusCircle, CalendarCheck,
  Calendar, Award, BookOpen, Shield, ClipboardList,
  Users, FolderOpen, Settings,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingSpinner from "@/components/ui/loading-spinner.jsx";
import { SUPERADMIN_EMAILS } from "@/lib/permissions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PropTypes from "prop-types";
import React from "react";
import { cn } from "@/lib/utils";

const XL_BREAKPOINT = 1280;

const NavItem = ({ to, icon: Icon, label, isActive, collapsed, onClick }) => (
  <TooltipProvider delayDuration={0}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={to}
          onClick={onClick}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            collapsed ? "justify-center px-0 w-10 h-10 mx-auto" : "border-l-[3px]",
            isActive
              ? collapsed
                ? "bg-sro-primary/10 text-sro-primary font-semibold"
                : "bg-sro-primary/10 text-sro-primary border-sro-primary font-semibold"
              : collapsed
                ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-transparent"
          )}
        >
          <Icon className={cn("w-[18px] h-[18px] shrink-0", isActive && "text-sro-primary")} />
          {!collapsed && <span className="truncate">{label}</span>}
        </Link>
      </TooltipTrigger>
      {collapsed && (
        <TooltipContent side="right" className="text-xs">
          {label}
        </TooltipContent>
      )}
    </Tooltip>
  </TooltipProvider>
);

const NavSection = ({ title, children, collapsed, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (collapsed) {
    return <div className="space-y-1 py-1">{children}</div>;
  }

  return (
    <div className="py-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-200",
            !isOpen && "-rotate-90"
          )}
        />
      </button>
      {isOpen && <div className="space-y-0.5">{children}</div>}
    </div>
  );
};

const Sidebar = ({ isOpen, onClose, setIsOpen, collapsed = false }) => {
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
  const showStudent = isUser || isSuperAdmin;
  const showAdmin = isSRO || isODSA || isSuperAdmin;
  const dashboardLink = showStudent ? "/dashboard" : "/admin";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("sroRemindersSeen");
    navigate("/login");
  };

  const isSmallScreen = typeof window !== "undefined" && window.innerWidth < XL_BREAKPOINT;

  const handleNavClick = () => {
    if (isSmallScreen) setIsOpen(false);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= XL_BREAKPOINT) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsOpen]);

  if (!isValidUPMail) return null;

  const roleName = {
    1: "Student",
    2: "SRO Staff",
    3: "ODSA Staff",
    4: "Super Admin",
  }[role];

  return (
    <aside
      className={cn(
        "bg-white border-r border-gray-200 h-screen flex flex-col fixed z-[60] xl:z-0 top-0 left-0 transition-all duration-300 shrink-0",
        collapsed ? "w-[68px]" : "w-72",
        "xl:static xl:translate-x-0",
        !isOpen && "-translate-x-full xl:translate-x-0",
        isOpen && "translate-x-0 shadow-2xl"
      )}
      aria-label="Sidebar"
    >
      {/* Mobile close button */}
      <div className="xl:hidden absolute top-4 right-4 z-[70]">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <ScrollArea className="flex-1 pt-16 xl:pt-14">
        <div className="flex flex-col min-h-full px-3 pb-4">
          {/* Profile section */}
          <div className={cn(
            "flex items-center gap-3 mt-6 mb-6 px-2",
            collapsed && "flex-col gap-2 items-center"
          )}>
            <img
              src={
                user?.user_metadata?.avatar_url ||
                "https://static.vecteezy.com/system/resources/thumbnails/018/795/669/small_2x/man-or-profile-icon-png.png"
              }
              className={cn(
                "rounded-full ring-2 ring-sro-primary/20 transition-all shrink-0",
                collapsed ? "w-9 h-9 min-w-[36px]" : "w-11 h-11 min-w-[44px]"
              )}
              alt="User"
              referrerPolicy="no-referrer"
            />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-gray-900 truncate">
                  {user?.user_metadata?.full_name || "User"}
                </h2>
                <p className="text-xs text-sro-primary font-medium">
                  {roleName || (
                    <LoadingSpinner text="..." variant="inline" className="text-sro-primary" />
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="h-px bg-gray-100 mx-2 mb-2" />

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {/* Student & Super Admin */}
            {showStudent && (
              <>
                <NavItem
                  to={dashboardLink}
                  icon={LayoutDashboard}
                  label="Dashboard"
                  isActive={location.pathname === dashboardLink}
                  collapsed={collapsed}
                  onClick={handleNavClick}
                />

                <NavSection title="Student Activities" collapsed={collapsed}>
                  <NavItem to="/requests" icon={FileText} label="My Requests" isActive={location.pathname === "/requests"} collapsed={collapsed} onClick={handleNavClick} />
                  <NavItem to="/activity-request" icon={PlusCircle} label="New Activity Request" isActive={location.pathname === "/activity-request"} collapsed={collapsed} onClick={handleNavClick} />
                  <NavItem to="/appointment-booking" icon={CalendarCheck} label="Book Appointment" isActive={location.pathname === "/appointment-booking"} collapsed={collapsed} onClick={handleNavClick} />
                  <NavItem to="/activities-calendar" icon={Calendar} label="Activities Calendar" isActive={location.pathname === "/activities-calendar"} collapsed={collapsed} onClick={handleNavClick} />
                </NavSection>

                <NavSection title="Org Requirements" collapsed={collapsed}>
                  <NavItem to="/org-application" icon={Award} label="Recognition Application" isActive={location.pathname === "/org-application"} collapsed={collapsed} onClick={handleNavClick} />
                  <NavItem to="/annual-report" icon={BookOpen} label="Annual Report" isActive={location.pathname === "/annual-report"} collapsed={collapsed} onClick={handleNavClick} />
                </NavSection>
              </>
            )}

            {/* Admin */}
            {showAdmin && (
              <>
                {showStudent && <div className="h-px bg-gray-100 mx-2 my-2" />}

                <NavItem
                  to="/admin"
                  icon={Shield}
                  label="Admin Dashboard"
                  isActive={location.pathname === "/admin"}
                  collapsed={collapsed}
                  onClick={handleNavClick}
                />

                <NavSection title="Activities" collapsed={collapsed}>
                  {(isSRO || isSuperAdmin) && (
                    <NavItem to="/admin/create-activity" icon={PlusCircle} label="Create Activity" isActive={location.pathname === "/admin/create-activity"} collapsed={collapsed} onClick={handleNavClick} />
                  )}
                  <NavItem to="/admin/student-activities" icon={ClipboardList} label="Student Activities" isActive={location.pathname === "/admin/student-activities"} collapsed={collapsed} onClick={handleNavClick} />
                </NavSection>

                <NavSection title="Organizations" collapsed={collapsed}>
                  {(isSRO || isSuperAdmin) && (
                    <NavItem to="/admin/appointment-settings" icon={CalendarCheck} label="Appointments" isActive={location.pathname === "/admin/appointment-settings"} collapsed={collapsed} onClick={handleNavClick} />
                  )}
                  <NavItem to="/admin/documents" icon={FolderOpen} label="Student Forms" isActive={location.pathname === "/admin/documents"} collapsed={collapsed} onClick={handleNavClick} />
                  <NavItem to="/admin/organizations" icon={Users} label="Organization Summary" isActive={location.pathname === "/admin/organizations"} collapsed={collapsed} onClick={handleNavClick} />
                  <NavItem to="/admin/org-applications" icon={Award} label="Recognition Applications" isActive={location.pathname === "/admin/org-applications"} collapsed={collapsed} onClick={handleNavClick} />
                  <NavItem to="/admin/annual-reports" icon={BookOpen} label="Annual Reports" isActive={location.pathname === "/admin/annual-reports"} collapsed={collapsed} onClick={handleNavClick} />
                </NavSection>
              </>
            )}

            {isSuperAdminEmail && (
              <>
                <div className="h-px bg-gray-100 mx-2 my-2" />
                <NavItem to="/admin/super-admin" icon={Settings} label="Super Admin" isActive={location.pathname === "/admin/super-admin"} collapsed={collapsed} onClick={handleNavClick} />
              </>
            )}
          </nav>
        </div>
      </ScrollArea>

      {/* Sign out button - pinned at bottom */}
      <div className="border-t border-gray-100 p-3">
        <button
          onClick={handleSignOut}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-sro-primary hover:bg-sro-primary-50 rounded-lg transition-all duration-200",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  collapsed: PropTypes.bool,
};

export default Sidebar;
