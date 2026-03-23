import { createBrowserRouter, RouterProvider, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import supabase from "@/lib/supabase";
import Layout from "../components/layout/Layout";
import { PageLoadingSkeleton } from "@/components/ui/skeletons";
import { UserAuthProvider, useAuth } from "@/context/UserAuthContext";
import NotFound from "../pages/NotFound";
import Login from "../pages/Login";

// user
import Dashboard from "../pages/Dashboard";
import AdviserDashboard from "../pages/AdviserDashboard";
import ActivityRequest from "../pages/ActivityRequest";
import Requests from "../pages/Requests";
import OrgApplication from "../pages/OrgApplication";
import AnnualReport from "../pages/AnnualReport";
import AppointmentBooking from "../pages/AppointmentBooking";
import EditActivity from "../pages/EditActivity";
import ActivitiesCalendar from "../pages/ActivitiesCalendar";

// admin
import AdminPanel from "../pages/admin/AdminPanel";
import AdminCreateActivity from "../pages/admin/AdminCreateActivity";
import AdminStudentActivities from "../pages/admin/AdminStudentActivities";

import AdminOrgApplications from "../pages/admin/AdminOrgApplications";
import AdminOrganizations from "../pages/admin/AdminOrganizations";
import AdminAnnualReports from "../pages/admin/AdminAnnualReports";
import AdminAppointmentSettings from "../pages/admin/AdminAppointmentSettings";
import AdminDocuments from "../pages/admin/AdminDocuments";
import SuperAdminPage from "../pages/admin/SuperAdminPage";

// route
import { checkOrCreateUser } from "@/api/authAPI";
import RequireUser from "@/auth/RequireUser";
import RequireAdminRole from "@/auth/RequireAdmin";

// try
import EmailTestButton from "@/pages/EmailTestButton";

const RedirectHome = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    const syncAndRedirect = async () => {
      try {
        await checkOrCreateUser(user.email, user.user_metadata.full_name);
        console.log("User synced!");
      } catch (err) {
        console.error("Sync error:", err.message);
      }

      if (role === 5) {
        navigate("/adviser");
      } else if (role && [2, 3, 4].includes(role)) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
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
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) return <PageLoadingSkeleton />;

  // Show error if email is not a UP Mail
  if (user && !user.email.endsWith("@up.edu.ph")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white-100 text-center px-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Please use your UP Mail</h2>
        <p className="text-gray-700 mb-6">The email <strong>{user.email}</strong> is not a valid UP Mail address.</p>
        <button
          onClick={handleSignOut}
          className="bg-sro-primary text-white px-6 py-2 rounded-md hover:bg-sro-primary/90 transition"
        >Sign Out</button>
      </div>
    );
  }

  // If logged in and email is valid, render the route
  return user ? <Outlet /> : <Navigate to="/login" replace />;
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
          // ✅ USER ROUTES (User + SuperAdmin)
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
              { 5: <AdviserDashboard /> }} />
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
