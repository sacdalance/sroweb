import { Link } from "react-router-dom";

const AdminPanel = () => {
  const adminModules = [
    {
      title: "Appointment Settings",
      description: "Manage appointment time slots and availability",
      path: "/admin/appointment-settings",
      icon: "📅"
    },
    // Add more admin modules as needed
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminModules.map((module) => (
          <Link 
            key={module.path}
            to={module.path}
            className="block p-4 bg-white rounded-md shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">{module.icon}</span>
              <h2 className="text-xl font-semibold">{module.title}</h2>
            </div>
            <p className="text-gray-600">{module.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminPanel;
  