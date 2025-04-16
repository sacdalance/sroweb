import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const AdminPanel = () => {
  // Stats data for the summary section
  const statsSummary = [
    { title: "Total Submissions", count: 100, path: "/admin/all-submissions" },
    { title: "Pending Activity Requests", count: 25, path: "/admin/pending-activities" },
    { title: "Approved Activity Requests", count: 20, path: "/admin/approved-activities" },
    { title: "Pending Applications", count: 30, path: "/admin/pending-applications" },
    { title: "Approved Applications", count: 25, path: "/admin/approved-applications" },
    { title: "Annual Reports", count: 15, path: "/admin/annual-reports" },
  ];

  // Mock data for incoming activity requests
  const incomingRequests = Array.from({ length: 8 }, (_, i) => ({
    id: `request-${i + 1}`,
    submissionDate: "Submission Date",
    activityName: "Activity Name",
    organization: "Organization",
  }));

  // Mock data for calendar events
  const calendarEvents = [
    {
      id: 1,
      name: "EVENT NAME",
      time: "8:00 AM to 5:00 PM",
      location: "Location",
      category: "Category",
      organization: "Insert Mahabanog Org Name"
    },
    {
      id: 2,
      name: "BASED BUDDIES",
      time: "3:00 PM to 6:00 PM",
      location: "Saeeum Cafe",
      category: "Educational",
      organization: "Junior Blockchain Education Consortium of the Philippines"
    },
    {
      id: 3,
      name: "EVENT NAME",
      time: "4:00 PM to 6:00 PM",
      location: "Location",
      category: "Category",
      organization: "Organization Name"
    }
  ];

  const handleViewDetails = (id) => {
    console.log(`Viewing details for: ${id}`);
  };

  // Current week range for the calendar (e.g., April 6 - 12)
  const currentWeekRange = "APRIL 6 - 12";
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const activeDay = "WED"; // Highlighted day

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#7B1113] mb-6">Admin Dashboard</h1>
      
      {/* Summary of Submissions */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-[#7B1113] mb-4">Summary of Submissions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statsSummary.map((stat) => (
            <div 
              key={stat.path}
              className="block p-4 bg-[#F8F9FA] border border-gray-200 rounded-md shadow-sm relative"
            >
              <span className="absolute top-2 right-2 text-[#014421]">
                <ArrowRight className="w-4 h-4" />
              </span>
              <h3 className="text-4xl font-bold mb-2 text-[#7B1113]">{stat.count}</h3>
              <p className="text-sm text-gray-600">{stat.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Incoming Activity Requests Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#7B1113]">Incoming Activity Requests</h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#f5f5f5]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#014421]">Submission Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#014421]">Activity Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#014421]">Organization</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#014421]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {incomingRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{request.submissionDate}</td>
                    <td className="px-4 py-3 text-sm">{request.activityName}</td>
                    <td className="px-4 py-3 text-sm">{request.organization}</td>
                    <td className="px-4 py-3 text-sm">
                      <Button
                        onClick={() => handleViewDetails(request.id)}
                        className="px-3 py-1 rounded-md bg-[#7B1113] hover:bg-[#5e0d0e] text-white text-xs"
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 flex justify-center">
              <Link to="/admin/pending-requests">
                <Button className="bg-[#014421] hover:bg-[#013319] text-white text-sm flex items-center gap-1">
                  See More <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Activities Calendar Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#7B1113]">Activities Calendar</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#014421] text-[#014421]">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{currentWeekRange}</span>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[#014421] text-[#014421]">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Card className="mb-4">
            <CardContent className="p-0">
              {/* Week days */}
              <div className="grid grid-cols-7 text-center border-b">
                {daysOfWeek.map((day) => (
                  <div 
                    key={day} 
                    className={`py-2 font-medium text-xs
                      ${day === activeDay ? 'bg-[#014421] text-white rounded-md mx-1 my-1' : ''}
                    `}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Calendar Events */}
          <div className="space-y-3">
            {calendarEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-sm overflow-hidden border">
                <div className={`p-3 ${event.id === 2 ? 'bg-[#014421]' : 'bg-[#f5f5f5]'}`}>
                  <h3 className={`font-semibold ${event.id === 2 ? 'text-white' : 'text-[#7B1113]'}`}>
                    {event.name}
                  </h3>
                  <p className={`text-xs ${event.id === 2 ? 'text-white' : 'text-gray-500'}`}>
                    {event.time} • {event.location}
                  </p>
                </div>
                <div className="p-3 border-l-4 border-[#014421]">
                  <div className="flex justify-between">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                      {event.category}
                    </span>
                    <span className="text-xs text-right font-medium">
                      {event.organization}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <Link to="/admin/activities-calendar">
              <Button className="bg-[#014421] hover:bg-[#013319] text-white text-sm flex items-center gap-1">
                See Activities Calendar <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
  