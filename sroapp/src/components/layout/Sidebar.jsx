import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside className="w-64 h-screen bg-gray-900 text-white p-4 fixed">
      <h2 className="text-xl font-semibold mb-6">SRO Menu</h2>
      <ul className="space-y-4">
        <li>
          <Link to="/" className="block hover:text-gray-400">Home</Link>
        </li>
        <li>
          <Link to="/dashboard" className="block hover:text-gray-400">Dashboard</Link>
        </li>
        <li>
          <Link to="/activity-request" className="block hover:text-gray-400">Activity Request</Link>
        </li>
        <li>
          <Link to="/org-recognition" className="block hover:text-gray-400">Org Recognition</Link>
        </li>
        <li>
          <Link to="/reports" className="block hover:text-gray-400">Reports</Link>
        </li>
        <li>
          <Link to="/profile" className="block hover:text-gray-400">Profile</Link>
        </li>
        <li>
          <Link to="/admin" className="block hover:text-gray-400">Admin</Link>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
