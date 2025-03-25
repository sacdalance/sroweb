import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import ActivityRequest from "../pages/ActivityRequest";
import OrgRecognition from "../pages/OrgRecognition";
import Reports from "../pages/Reports";
import Profile from "../pages/Profile";
import AdminPanel from "../pages/AdminPanel";
import NotFound from "../pages/NotFound";
import AppointmentBooking from "../pages/AppointmentBooking";
import AdminAppointmentSettings from "../pages/AdminAppointmentSettings";

// Define routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />, // Wraps all pages inside Layout
    children: [
      { index: true, element: <Home /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "activity-request", element: <ActivityRequest /> },
      { path: "org-recognition", element: <OrgRecognition /> },
      { path: "appointments", element: <AppointmentBooking /> },
      { path: "reports", element: <Reports /> },
      { path: "profile", element: <Profile /> },
      { path: "admin", element: <AdminPanel /> },
      { path: "admin/appointment-settings", element: <AdminAppointmentSettings /> },
    ],
  },
  { path: "/login", element: <Login /> }, // Separate login page (no layout)
  { path: "*", element: <NotFound /> },   // 404 Page
]);

const AppRoutes = () => {
  return <RouterProvider router={router} />;
};

export default AppRoutes;
