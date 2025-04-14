import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="p-4 bg-[#9B2242]-900 text-white flex justify-between">
      <h1 className="text-lg font-bold">SRO Web App</h1>
      <div className="space-x-4">
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/activity-request">Activity Request</Link>
        <Link to="/org-application">Org Application</Link>
        <Link to="/annual-report">Annual Report</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/admin">Admin</Link>
      </div>
    </nav>
  );
};

export default Navbar;
