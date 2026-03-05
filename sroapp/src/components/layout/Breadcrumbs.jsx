import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const routeLabels = {
  dashboard: "Dashboard",
  "activity-request": "New Activity Request",
  "edit-activity": "Edit Activity",
  requests: "My Requests",
  "activities-calendar": "Activities Calendar",
  "org-application": "Recognition Application",
  "annual-report": "Annual Report",
  "appointment-booking": "Book Appointment",
  admin: "Admin Dashboard",
  "create-activity": "Create Activity",
  "student-activities": "Student Activities",
  "org-applications": "Recognition Applications",
  organizations: "Organization Summary",
  "annual-reports": "Annual Reports",
  "appointment-settings": "Appointments",
  documents: "Student Forms",
  "super-admin": "Super Admin",
};

const Breadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  if (pathSegments.length === 0) return null;

  const crumbs = pathSegments.map((segment, index) => {
    const path = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = routeLabels[segment] || segment;
    const isLast = index === pathSegments.length - 1;

    return { path, label, isLast };
  });

  return (
    <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      <Link
        to="/"
        className="text-white/60 hover:text-white transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.path} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3 text-white/40" />
          {crumb.isLast ? (
            <span className="text-white font-medium text-xs">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className="text-white/60 hover:text-white transition-colors text-xs"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
