import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import ActivityRequest from "../pages/ActivityRequest";
import OrgRecognition from "../pages/OrgRecognition";
import Reports from "../pages/Reports";
import Profile from "../pages/Profile";
import AdminPanel from "../pages/AdminPanel";
import NotFound from "../pages/NotFound";
import Navbar from "../components/layout/Navbar"; // Import Navbar

const AppRoutes = () => {
  return (
    <Router>
        <Navbar /> {/* Add Navbar */}
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/activity-request" element={<ActivityRequest />} />
            <Route path="/org-recognition" element={<OrgRecognition />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<NotFound />} /> {/* 404 Page */}
        </Routes>
    </Router>
  );
};

export default AppRoutes;
