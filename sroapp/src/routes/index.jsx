import { createBrowserRouter, RouterProvider, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";
import Layout from "../components/layout/Layout";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import ActivityRequest from "../pages/ActivityRequest";
import Activities from "../pages/Activities";
import OrgApplication from "../pages/OrgApplication";
import AnnualReport from "../pages/AnnualReport";
import AdminPanel from "../pages/AdminPanel";
import AdminCreateActivity from "../pages/AdminCreateActivity";
import AdminPendingRequests from "../pages/AdminPendingRequests";
import AdminActivitySummary from "../pages/AdminActivitySummary";
import AdminActivitiesCalendar from "../pages/AdminActivitiesCalendar";
import AdminOrgApplications from "../pages/AdminOrgApplications";
import AdminOrganizations from "../pages/AdminOrganizations";
import AdminAnnualReports from "../pages/AdminAnnualReports";
import NotFound from "../pages/NotFound";
import AppointmentBooking from "../pages/AppointmentBooking";
import AdminAppointmentSettings from "../pages/AdminAppointmentSettings";
import RequireAdmin from "../components/RequireAdmin";

/**
 * Redirects "/" based on authentication status.
 */
const RedirectHome = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAndRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      setUser(user);

      // Fetch role from 'account' table
      const { data, error } = await supabase
        .from("account")
        .select("role_id")
        .eq("email", user.email)
        .single();

      const roleId = data?.role_id;

      if (!error && roleId) {
        if (roleId === 2 || roleId === 3) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        navigate("/dashboard"); // default fallback
      }

      setLoading(false);
    };

    checkUserAndRole();
  }, [navigate]);

  if (loading) return <h1 className="flex justify-center">Loading...</h1>;

  return null;
};

/**
 * Protects routes from unauthenticated users.
 */
const PrivateRoute = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Handles sign out when clicked
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/login");
  };

  if (loading) return <h1 className = "flex justify-center">Loading...</h1>;

  // Show error if email is not a UP Mail
  if (user && !user.email.endsWith("@up.edu.ph")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white-100 text-center px-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Please use your UP Mail</h2>
        <p className="text-gray-700 mb-6">The email <strong>{user.email}</strong> is not a valid UP Mail address.</p>
        <button
          onClick={handleSignOut}
          className="bg-[#7B1113] text-white px-6 py-2 rounded-md hover:bg-[#5e0d0e] transition"
        >
          Sign Out
        </button>
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();

    // Listen for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <h1 className = "flex justify-center">Loading...</h1>;

  return user ? <Navigate to="/dashboard" replace /> : element;
};

// Define routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <RedirectHome /> },
      {
        element: <PrivateRoute />,
        children: [
          { path: "home", element: <Home /> },
          { path: "dashboard", element: <Dashboard /> },
          { path: "activity-request", element: <ActivityRequest /> },
          { path: "activities", element: <Activities /> },
          { path: "org-application", element: <OrgApplication /> },
          { path: "annual-report", element: <AnnualReport /> },
          { path: "appointment-booking", element: <AppointmentBooking /> },
          {
            path: "admin",
            element: (
              <RequireAdmin>
                <AdminPanel />
              </RequireAdmin>
            ),
          },
          {
            path: "admin/appointment-settings",
            element: (
              <RequireAdmin>
                <AdminAppointmentSettings />
              </RequireAdmin>
            ),
          },
          {
            path: "admin/create-activity",
            element: (
              <RequireAdmin>
                <AdminCreateActivity />
              </RequireAdmin>
            ),
          },
          {
            path: "admin/pending-requests",
            element: (
              <RequireAdmin>
                <AdminPendingRequests />
              </RequireAdmin>
            ),
          },
          {
            path: "admin/activity-summary",
            element: (
              <RequireAdmin>
                <AdminActivitySummary />
              </RequireAdmin>
            ),
          },
          {
            path: "admin/activities-calendar",
            element: (
              <RequireAdmin>
                <AdminActivitiesCalendar />
              </RequireAdmin>
            ),
          },
          {
            path: "admin/org-applications",
            element: (
              <RequireAdmin>
                <AdminOrgApplications />
              </RequireAdmin>
            ),
          },
          {
            path: "admin/organizations",
            element: (
              <RequireAdmin>
                <AdminOrganizations />
              </RequireAdmin>
            ),
          },
          {
            path: "admin/annual-reports",
            element: (
              <RequireAdmin>
                <AdminAnnualReports />
              </RequireAdmin>
            ),
          },
        ],
      },
    ],
  },
  { path: "/login", element: <RedirectIfLoggedIn element={<Login />} /> },
  { path: "*", element: <NotFound /> },  
]);

const AppRoutes = () => {
  return <RouterProvider router={router} />;
};

export default AppRoutes;
