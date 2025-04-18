import { createBrowserRouter, RouterProvider, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";
import Layout from "../components/layout/Layout";
import LoadingSpinner from "../components/ui/loading-spinner";
import Home from "../pages/Home";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";

// user 
import Dashboard from "../pages/Dashboard";
import ActivityRequest from "../pages/ActivityRequest";
import Activities from "../pages/Activities";
import OrgApplication from "../pages/OrgApplication";
import AnnualReport from "../pages/AnnualReport";
import AppointmentBooking from "../pages/AppointmentBooking";

// admin
import AdminPanel from "../pages/admin/AdminPanel";
import AdminCreateActivity from "../pages/admin/AdminCreateActivity";
import AdminPendingRequests from "../pages/admin/AdminPendingRequests";
import AdminActivitySummary from "../pages/admin/AdminActivitySummary";
import AdminActivitiesCalendar from "../pages/admin/AdminActivitiesCalendar";
import AdminOrgApplications from "../pages/admin/AdminOrgApplications";
import AdminOrganizations from "../pages/admin/AdminOrganizations";
import AdminAnnualReports from "../pages/admin/AdminAnnualReports";
import AdminAppointmentSettings from "../pages/admin/AdminAppointmentSettings";
import RequireAdmin from "../components/RequireAdmin";

// route
import { checkOrCreateUser } from "@/api/authAPI";
import RequireUser from "@/components/RequireUser";
import RequireSRO from "@/components/RequireSRO";
import RequireODSA from "@/components/RequireODSA";
import RequireSuperAdmin from "@/components/RequireSuperAdmin";

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

      try {
        await checkOrCreateUser(user.email, user.user_metadata.full_name);
        console.log("User synced!");
      } catch (err) {
        console.error("Sync error:", err.message);
      }

      // Fetch role from 'account' table
      const { data, error } = await supabase
        .from("account")
        .select("role_id")
        .eq("email", user.email)
        .single();

      const roleId = data?.role_id;

      if (!error && roleId) {
        if (roleId === 2 || roleId === 3 || roleId === 4) {
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

  if (loading) return <LoadingSpinner />;

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

  if (loading) return <LoadingSpinner />;

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
  
          // ✅ USER ROUTES (User + SuperAdmin)
          {
            path: "dashboard",
            element: (
              <RequireUser>
                <Dashboard />
              </RequireUser>
            ),
          },
          {
            path: "activity-request",
            element: (
              <RequireUser>
                <ActivityRequest />
              </RequireUser>
            ),
          },
          {
            path: "activities",
            element: (
              <RequireUser>
                <Activities />
              </RequireUser>
            ),
          },
          {
            path: "org-application",
            element: (
              <RequireUser>
                <OrgApplication />
              </RequireUser>
            ),
          },
          {
            path: "annual-report",
            element: (
              <RequireUser>
                <AnnualReport />
              </RequireUser>
            ),
          },
          {
            path: "appointment-booking",
            element: (
              <RequireUser>
                <AppointmentBooking />
              </RequireUser>
            ),
          },
  
          // ✅ ADMIN ROUTES (Each role separated)
          {
            path: "admin",
            element: (
              <>
                <RequireSRO><AdminPanel /></RequireSRO>
                <RequireODSA><AdminPanel /></RequireODSA>
                <RequireSuperAdmin><AdminPanel /></RequireSuperAdmin>
              </>
            ),
          },
          {
            path: "admin/appointment-settings",
            element: (
              <>
                <RequireSRO><AdminAppointmentSettings /></RequireSRO>
                <RequireODSA><AdminAppointmentSettings /></RequireODSA>
                <RequireSuperAdmin><AdminAppointmentSettings /></RequireSuperAdmin>
              </>
            ),
          },
          {
            path: "admin/create-activity",
            element: (
              <>
                <RequireSRO><AdminCreateActivity /></RequireSRO>
                <RequireODSA><AdminCreateActivity /></RequireODSA>
                <RequireSuperAdmin><AdminCreateActivity /></RequireSuperAdmin>
              </>
            ),
          },
          {
            path: "admin/pending-requests",
            element: (
              <>
                <RequireSRO><AdminPendingRequests /></RequireSRO>
                <RequireODSA><AdminPendingRequests /></RequireODSA>
                <RequireSuperAdmin><AdminPendingRequests /></RequireSuperAdmin>
              </>
            ),
          },
          {
            path: "admin/activity-summary",
            element: (
              <>
                <RequireSRO><AdminActivitySummary /></RequireSRO>
                <RequireODSA><AdminActivitySummary /></RequireODSA>
                <RequireSuperAdmin><AdminActivitySummary /></RequireSuperAdmin>
              </>
            ),
          },
          {
            path: "admin/activities-calendar",
            element: (
              <>
                <RequireSRO><AdminActivitiesCalendar /></RequireSRO>
                <RequireODSA><AdminActivitiesCalendar /></RequireODSA>
                <RequireSuperAdmin><AdminActivitiesCalendar /></RequireSuperAdmin>
              </>
            ),
          },
          {
            path: "admin/org-applications",
            element: (
              <>
                <RequireSRO><AdminOrgApplications /></RequireSRO>
                <RequireODSA><AdminOrgApplications /></RequireODSA>
                <RequireSuperAdmin><AdminOrgApplications /></RequireSuperAdmin>
              </>
            ),
          },
          {
            path: "admin/organizations",
            element: (
              <>
                <RequireSRO><AdminOrganizations /></RequireSRO>
                <RequireODSA><AdminOrganizations /></RequireODSA>
                <RequireSuperAdmin><AdminOrganizations /></RequireSuperAdmin>
              </>
            ),
          },
          {
            path: "admin/annual-reports",
            element: (
              <>
                <RequireSRO><AdminAnnualReports /></RequireSRO>
                <RequireODSA><AdminAnnualReports /></RequireODSA>
                <RequireSuperAdmin><AdminAnnualReports /></RequireSuperAdmin>
              </>
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
