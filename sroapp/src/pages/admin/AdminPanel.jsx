import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, FileText, Calendar, Clock, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const AdminPanel = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

  // Function to check if a date falls within the current week
  const isDateInCurrentWeek = (dateString) => {
    const eventDate = new Date(dateString);
    eventDate.setHours(0, 0, 0, 0); // Normalize time to start of day
    
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Saturday)
    weekEnd.setHours(23, 59, 59, 999);

    console.log('Event Date:', eventDate);
    console.log('Week Start:', weekStart);
    console.log('Week End:', weekEnd);
    console.log('Is in week:', eventDate >= weekStart && eventDate <= weekEnd);
    
    return eventDate >= weekStart && eventDate <= weekEnd;
  };

  // Function to format date range
  const getWeekRange = (date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const startMonth = start.toLocaleString('default', { month: 'long' }).toUpperCase();
    const endMonth = end.toLocaleString('default', { month: 'long' }).toUpperCase();
    
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
  };

  // Function to get current day of week
  const getCurrentDay = () => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[new Date().getDay()];
  };

  // Function to handle week navigation
  const handleWeekNavigation = (direction) => {
    const newDate = new Date(currentWeekStart);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    newDate.setDate(newDate.getDate() - newDate.getDay());
    setCurrentWeekStart(newDate);
  };

  // Stats data for the summary section
  const statsSummary = [
    { title: "Total Submissions", count: 100, path: "/admin/all-submissions" },
    { title: "Pending Activity Requests", count: 25, path: "/admin/pending-requests" },
    { title: "Approved Activity Requests", count: 20},
    { title: "Pending Applications", count: 30, path: "/admin/org-applications" },
    { title: "Approved Applications", count: 25},
    { title: "Annual Reports", count: 15, path: "/admin/annual-reports" },
  ];

  // Mock data for incoming activity requests
  const incomingRequests = Array.from({ length: 8 }, (_, i) => ({
    id: `request-${i + 1}`,
    submissionDate: "Submission Date",
    activityName: "Activity Name",
    organization: "Organization",
  }));

  // Mock data for calendar events with dates
  const calendarEvents = [
    {
      id: 1,
      name: "EVENT NAME",
      time: "8:00 AM to 5:00 PM",
      location: "Location",
      category: "Category",
      organization: "Insert Mahabanog Org Name",
      date: "2024-04-06" // Saturday
    },
    {
      id: 2,
      name: "BASED BUDDIES",
      time: "3:00 PM to 6:00 PM",
      location: "Saeeum Cafe",
      category: "Educational",
      organization: "Junior Blockchain Education Consortium of the Philippines",
      date: "2024-04-07" // Sunday
    },
    {
      id: 3,
      name: "EVENT NAME",
      time: "4:00 PM to 6:00 PM",
      location: "Location",
      category: "Category",
      organization: "Organization Name",
      date: "2024-04-08" // Monday
    },
    {
      id: 4,
      name: "ANOTHER EVENT",
      time: "10:00 AM to 12:00 PM",
      location: "UPB Grounds",
      category: "Service",
      organization: "Computer Science Society",
      date: "2024-04-10" // Wednesday
    },
    {
      id: 5,
      name: "FINAL EVENT",
      time: "2:00 PM to 4:00 PM",
      location: "AVR 1",
      category: "Educational",
      organization: "UP Aguman",
      date: "2024-04-12" // Friday
    }
  ];

  // Filter events for the current week
  const filteredEvents = calendarEvents.filter(event => isDateInCurrentWeek(event.date));

  const handleViewDetails = (request) => {
    setSelectedActivity(request);
    setIsModalOpen(true);
  };

  const handleApprove = async () => {
    try {
      // API call to approve activity
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error approving activity:", error);
    }
  };

  const handleReject = async () => {
    try {
      // API call to reject activity
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error rejecting activity:", error);
    }
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
            stat.title === "Total Submissions" ? (
              <div 
                key={stat.path}
                className="block p-4 bg-[#F8F9FA] border border-gray-200 rounded-md shadow-sm relative hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-4xl font-bold mb-2 text-[#7B1113]">{stat.count}</h3>
                <p className="text-sm text-gray-600">{stat.title}</p>
              </div>
            ) : (
              <Link 
                to={stat.path}
                key={stat.path}
                className="block p-4 bg-[#F8F9FA] border border-gray-200 rounded-md shadow-sm relative hover:bg-gray-50 transition-colors"
              >
                <span className="absolute top-2 right-2 text-[#014421]">
                  <ArrowRight className="w-4 h-4" />
                </span>
                <h3 className="text-4xl font-bold mb-2 text-[#7B1113]">{stat.count}</h3>
                <p className="text-sm text-gray-600">{stat.title}</p>
              </Link>
            )
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
                        onClick={() => handleViewDetails(request)}
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
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 border-[#014421] text-[#014421]"
                onClick={() => handleWeekNavigation('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{getWeekRange(currentWeekStart)}</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 border-[#014421] text-[#014421]"
                onClick={() => handleWeekNavigation('next')}
              >
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
                      ${day === getCurrentDay() ? 'bg-[#014421] text-white rounded-md mx-1 my-1' : ''}
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
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
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
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No activities scheduled for this week
              </div>
            )}
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

      {/* Activity Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[1000px] w-[90vw] sm:w-[85vw] mx-auto">
          <DialogHeader className="px-2">
            <DialogTitle className="text-xl font-bold text-[#7B1113]">Activity Details</DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-6 px-2">
              {/* Activity Title, Description and Organization */}
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">{selectedActivity.activityName}</h2>
                <p className="text-sm text-gray-600">{selectedActivity.organization}</p>
                <p className="text-sm text-gray-700 mt-2">{selectedActivity.activityDescription}</p>
              </div>

              {/* General Information */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#7B1113]">General Information</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                  <div className="flex">
                    <span className="w-32 text-gray-600">Activity Type:</span>
                    <span>{selectedActivity.activityType}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Adviser Name:</span>
                    <span>{selectedActivity.adviser}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Charge Fee:</span>
                    <span>No</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Adviser Contact:</span>
                    <span>{selectedActivity.adviserContact || "09123456789"}</span>
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#7B1113]">Specifications</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                  <div className="flex">
                    <span className="w-32 text-gray-600">Venue:</span>
                    <span>{selectedActivity.venue}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Green Monitor:</span>
                    <span>Monitor</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Venue Approver:</span>
                    <span>Approver</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Monitor Contact:</span>
                    <span>Contact</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Venue Contact:</span>
                    <span>Contact</span>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#7B1113]">Schedule</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex">
                    <span className="w-32 text-gray-600">Date:</span>
                    <span>{selectedActivity.activityDate}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Time:</span>
                    <span>10:00 AM - 2:00 PM</span>
                  </div>
                </div>
              </div>

              {/* University Partners */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#7B1113]">University Partners</h3>
                <div className="text-sm">
                  <p>Department of Mathematics and Computer Science</p>
                </div>
              </div>

              {/* List of Sustainable Development Goals */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#7B1113]">List of Sustainable Development Goals</h3>
                <div className="flex gap-2">
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">No Poverty</span>
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">Good Health and Well-being</span>
                </div>
              </div>

              {/* Bottom Section with Status and View Form Button */}
              <div className="flex justify-between items-center">
                <Button 
                  className="text-sm bg-[#014421] hover:bg-[#013319] text-white"
                >
                  View Scanned Form
                </Button>
                <Badge 
                  variant={selectedActivity.status === 'Approved' ? 'success' : 'warning'}
                  className="text-sm px-4 py-1"
                >
                  {selectedActivity.status}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
  