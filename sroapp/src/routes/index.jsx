import { createBrowserRouter, RouterProvider, Navigate, Outlet, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useRef } from "react";
import supabase from "@/lib/supabase";
import Layout from "../components/layout/Layout";
import { PageLoadingSkeleton } from "@/components/ui/skeletons";
import { UserAuthProvider, useAuth } from "@/context/UserAuthContext";
import NotFound from "../pages/NotFound";
import Login from "../pages/Login";
import IdleTimeoutWarning from "@/components/IdleTimeoutWarning";

// user — lazy loaded for code splitting
const Dashboard = lazy(() => import("../pages/Dashboard"));
const AdviserDashboard = lazy(() => import("../pages/AdviserDashboard"));
const ActivityRequest = lazy(() => import("../pages/ActivityRequest"));
const Requests = lazy(() => import("../pages/Requests"));
const OrgApplication = lazy(() => import("../pages/OrgApplication"));
const AnnualReport = lazy(() => import("../pages/AnnualReport"));
const AppointmentBooking = lazy(() => import("../pages/AppointmentBooking"));
const EditActivity = lazy(() => import("../pages/EditActivity"));
const ActivitiesCalendar = lazy(() => import("../pages/ActivitiesCalendar"));

// admin — lazy loaded
const AdminPanel = lazy(() => import("../pages/admin/AdminPanel"));
const AdminCreateActivity = lazy(() => import("../pages/admin/AdminCreateActivity"));
const AdminStudentActivities = lazy(() => import("../pages/admin/AdminStudentActivities"));
const AdminOrgApplications = lazy(() => import("../pages/admin/AdminOrgApplications"));
const AdminOrganizations = lazy(() => import("../pages/admin/AdminOrganizations"));
const OrgProfile = lazy(() => import("../pages/admin/OrgProfile"));
const AdminAnnualReports = lazy(() => import("../pages/admin/AdminAnnualReports"));
const AdminAppointmentSettings = lazy(() => import("../pages/admin/AdminAppointmentSettings"));
const AdminDocuments = lazy(() => import("../pages/admin/AdminDocuments"));
const SuperAdminPage = lazy(() => import("../pages/admin/SuperAdminPage"));
const EmailTestButton = lazy(() => import("../pages/EmailTestButton"));

// route
import { checkOrCreateUser } from "@/api/authAPI";
import RequireUser from "@/auth/RequireUser";
import RequireAdminRole from "@/auth/RequireAdmin";

const RedirectHome = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    const syncAndRedirect = async () => {
      if (!hasSynced.current) {
        hasSynced.current = true;
        try {
          await checkOrCreateUser(user.email, user.user_metadata.full_name);
        } catch (err) {
          console.error("Sync error:", err.message);
        }
      }

      if (role === 5) {
        navigate("/adviser");
      } else if (role && [2, 3, 4].includes(role)) {
        navigate("/admin");
      } else if (role) {
        navigate("/dashboard");
      }
      // If role is still null, wait for next render when role populates
    };

    syncAndRedirect();
  }, [user, role, loading, navigate]);

  if (loading) return <PageLoadingSkeleton />;
  return null;
};

/**
 * Protects routes from unauthenticated users.
 */
const PrivateRoute = () => {
  const { user, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Clear session even if the API call fails
    }
    window.location.href = "/login";
  };

  if (loading) return <PageLoadingSkeleton />;

  // Show error if email is not a UP Mail
  if (user && !user.email.endsWith("@up.edu.ph")) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-[64px] lg:text-[80px] font-extrabold text-sro-primary leading-tight">
          OOPS!
        </h1>
        <h2 className="text-[32px] lg:text-[44px] font-bold text-sro-primary mb-4">
          WRONG EMAIL DOMAIN
        </h2>
        <p className="text-sm sm:text-base text-gray-700 mb-6">
          The email <strong>{user.email}</strong> is not a valid UP Mail address.
        </p>
        <button
          onClick={handleSignOut}
          className="cursor-pointer bg-sro-primary text-white px-6 py-2 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:bg-sro-primary/90"
        >
          Sign Out
        </button>
      </div>
    );
  }

  // If logged in and email is valid, render the route
  return user ? (
    <>
      <IdleTimeoutWarning />
      <Suspense fallback={<PageLoadingSkeleton />}><Outlet /></Suspense>
    </>
  ) : <Navigate to="/login" replace />;
};

/**
 * Redirects logged-in users from `/login` to `/dashboard`.
 */
const RedirectIfLoggedIn = ({ element }) => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoadingSkeleton />;

  return user ? <Navigate to="/dashboard" replace /> : element;
};

// Auth wrapper — provides UserAuthContext to all route components
const AuthWrapper = () => (
  <UserAuthProvider>
    <Outlet />
  </UserAuthProvider>
);

// Define routes
const router = createBrowserRouter([
  {
    element: <AuthWrapper />,
    children: [
      {
        path: "/",
        element: <Layout />,
        children: [
          { index: true, element: <RedirectHome /> },
          {
            element: <PrivateRoute />,
            children: [
          // USER ROUTES (User + SuperAdmin)
          { path: "dashboard", element: <RequireUser><Dashboard /></RequireUser> },
          { path: "activity-request", element: <RequireUser><ActivityRequest /></RequireUser> },
          { path: "edit-activity", element: <RequireUser><EditActivity /></RequireUser> },
          { path: "requests", element: <RequireUser><Requests /></RequireUser> },
          { path: "activities-calendar", element: <RequireUser><ActivitiesCalendar /></RequireUser> },
          { path: "org-application", element: <RequireUser><OrgApplication /></RequireUser> },
          { path: "annual-report", element: <RequireUser><AnnualReport /></RequireUser> },
          { path: "appointment-booking", element: <RequireUser><AppointmentBooking /></RequireUser> },
          { path: "email-test-button", element: <RequireUser><EmailTestButton /></RequireUser> },

          // Adviser route
          {
            path: "adviser", element: <RequireAdminRole childrenByRole={
              { 4: <AdviserDashboard />, 5: <AdviserDashboard /> }} />
          },

          // Admin routes using unified RequireAdminRole
          {
            path: "admin/super-admin", element: <RequireUser><SuperAdminPage /></RequireUser>
          },
          {
            path: "admin", element: <RequireAdminRole childrenByRole={
              { 2: <AdminPanel />, 3: <AdminPanel />, 4: <AdminPanel /> }} />
          },
          {
            path: "admin/appointment-settings", element: <RequireAdminRole childrenByRole={
              { 2: <AdminAppointmentSettings />, 4: <AdminAppointmentSettings /> }} />
          },
          {
            path: "admin/create-activity", element: <RequireAdminRole childrenByRole={
              { 2: <AdminCreateActivity />, 4: <AdminCreateActivity /> }} />
          },
          {
            path: "admin/documents", element: <RequireAdminRole childrenByRole={
              { 2: <AdminDocuments />, 4: <AdminDocuments /> }} />
          },
          {
            path: "admin/student-activities", element: <RequireAdminRole childrenByRole={
              { 2: <AdminStudentActivities />, 3: <AdminStudentActivities />, 4: <AdminStudentActivities /> }} />
          },

          {
            path: "admin/activity-summary", element: <Navigate to="/admin/student-activities" replace />
          },

          {
            path: "admin/org-applications", element: <RequireAdminRole childrenByRole={
              { 2: <AdminOrgApplications />, 4: <AdminOrgApplications /> }} />
          },
          {
            path: "admin/organizations", element: <RequireAdminRole childrenByRole={
              { 2: <AdminOrganizations />, 4: <AdminOrganizations /> }} />
          },
          {
            path: "admin/organizations/:orgId", element: <RequireAdminRole childrenByRole={
              { 2: <OrgProfile />, 4: <OrgProfile /> }} />
          },
          {
            path: "admin/annual-reports", element: <RequireAdminRole childrenByRole={
              { 2: <AdminAnnualReports />, 3: <AdminAnnualReports />, 4: <AdminAnnualReports /> }} />
          },

        ],
      },
    ],
  },
      { path: "/login", element: <RedirectIfLoggedIn element={<Login />} /> },
      { path: "/offline", element: <NotFound /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

const AppRoutes = () => {
  return <RouterProvider router={router} />;
};

export default AppRoutes;
