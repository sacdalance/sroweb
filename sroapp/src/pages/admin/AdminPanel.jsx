import { useState, useEffect } from "react";
  import { Link } from "react-router-dom";
  import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
  import { Button } from "../../components/ui/button";
  import { ArrowRight, ChevronLeft, ChevronRight, FileText, Calendar, Clock, User, Loader2, Pencil } from "lucide-react";
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
  } from "@/components/ui/dialog";
  import { Badge } from "@/components/ui/badge";
  import { Eye, ChevronDown } from "lucide-react";
  import supabase from "@/lib/supabase";
  import { Input } from "@/components/ui/input";
  import {
  fetchIncomingRequests,
  fetchApprovedActivities,
  fetchOrgStats,
  fetchActivityDetails,
} from "@/api/adminActivityAPI";

  const AdminPanel = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [error, setError] = useState(null);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(true);
    const [requestsError, setRequestsError] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
    const [announcementsLoading, setAnnouncementsLoading] = useState(true);
    const [announcementsError, setAnnouncementsError] = useState(null);
    const [requestsCounts, setRequestsCounts] = useState({
      approved: 0,
      forAppeal: 0,
      pending: 0,
    });

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

    useEffect(() => {
    const getIncoming = async () => {
      try {
        setRequestsLoading(true);
        const { data: sessionData } = await supabase.auth.getSession();
        const access_token = sessionData?.session?.access_token;
        const requests = await fetchIncomingRequests(access_token);

        // Calculate counts and map to frontend format
        let forAppeal = 0, pending = 0;
        const transformed = requests.map((request) => {
          const isForAppeal = request.final_status === "For Appeal";
          const isPending = request.final_status === "Pending" || request.final_status === null;
          if (isForAppeal) forAppeal++;
          if (isPending) pending++;
          return {
            id: request.activity_id,
            submissionDate: new Date(request.created_at).toLocaleDateString(),
            activityName: request.activity_name,
            organization: request.organization?.org_name || "N/A",
            activityDate: request.schedule?.[0]?.start_date
              ? new Date(request.schedule[0].start_date).toLocaleDateString()
              : "TBD",
            status: request.final_status || "Pending",
          };
        });

        setIncomingRequests(transformed);
        setRequestsCounts((prev) => ({ ...prev, forAppeal, pending }));
      } catch (err) {
        console.error(err);
        setRequestsError(err.message);
      } finally {
        setRequestsLoading(false);
      }
    };
    getIncoming();
  }, []);

  useEffect(() => {
    const getApproved = async () => {
      try {
        setLoading(true);
        const data = await fetchApprovedActivities();

        const approvedCount = data.filter(
          (activity) => activity.final_status?.toLowerCase() === "approved"
        ).length;

        const transformed = data.map((activity) => {
          const startTime = activity.schedule[0]?.start_time
            ? new Date(`1970-01-01T${activity.schedule[0].start_time}`).toLocaleTimeString([], {
                hour: "2-digit", minute: "2-digit",
              })
            : "00:00";
          const endTime = activity.schedule[0]?.end_time
            ? new Date(`1970-01-01T${activity.schedule[0].end_time}`).toLocaleTimeString([], {
                hour: "2-digit", minute: "2-digit",
              })
            : "00:00";
          return {
            id: activity.activity_id,
            name: activity.activity_name,
            time: `${startTime} to ${endTime}`,
            location: activity.venue,
            category: activity.activity_type,
            organization: activity.organization?.org_name,
            date: activity.schedule[0]?.start_date,
          };
        });

        setEvents(transformed);
        setRequestsCounts((prev) => ({ ...prev, approved: approvedCount }));
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    getApproved();
  }, []);

  useEffect(() => {
    const getStats = async () => {
      try {
        const { annualReportsCount, pendingApplicationsCount } = await fetchOrgStats();
        setRequestsCounts((prev) => ({
          ...prev,
          annualReports: annualReportsCount,
          pendingApplications: pendingApplicationsCount,
        }));
      } catch (err) {
        console.error(err);
      }
    };
    getStats();
  }, []);

  useEffect(() => {
    const getCounts = async () => {
      try {
        const activity = await fetchActivityCounts();
        const orgStats = await fetchOrgStats();

        setRequestsCounts({
          approved: activity.approved,
          pending: activity.pending,
          forAppeal: activity.forAppeal,
          annualReports: orgStats.annualReportsCount,
          pendingApplications: orgStats.pendingApplicationsCount,
        });
      } catch (err) {
        console.error("Failed to fetch summary counts", err);
      }
    };
    getCounts();
  }, []);


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
      { title: "Total Submissions", count: requestsCounts.forAppeal + requestsCounts.pending + requestsCounts.approved || 0, path: "/admin/all-submissions" },
      { title: "Pending Activity Requests", count: requestsCounts.forAppeal + requestsCounts.pending || 0, path: "/admin/pending-requests" },
      { title: "Approved Activity Requests", count: requestsCounts.approved || 0 },
      { title: "Pending Applications", count: requestsCounts.pendingApplications || 0, path: "/admin/org-applications" },
      { title: "Approved Applications", count: requestsCounts.annualReports || 0 },
      { title: "Annual Reports", count: requestsCounts.annualReports || 0, path: "/admin/annual-reports" },
    ];


    // Filter events for the current week
    const filteredEvents = events.filter(event => isDateInCurrentWeek(event.date));

    const handleViewDetails = async (request) => {
      try {
        setSelectedActivity(null);
        setIsModalOpen(true);
        const { sdgGoals, partners } = await fetchActivityDetails(request.id);
        setSelectedActivity({
          ...request,
          sdgGoals,
          partners,
        });
      } catch (err) {
        console.error("Error fetching activity details:", err);
      }
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
      <div className="max-w-[1500px] mx-auto p-6">
        
        {/* Summary of Submissions */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-[#7B1113] mb-4">Summary of Submissions</h2>
          <div className="grid grid-cols-6 gap-4">
            {statsSummary.map((stat, index) => (
              <div
                key={index}
                className="block p-4 bg-[#F8F9FA] border border-gray-200 rounded-xl shadow-sm relative hover:bg-gray-50 transition-colors aspect-[4/3] flex flex-col justify-end items-start"
              >
                {requestsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-[#7B1113]" />
                  </div>
                ) : (
                  <>
                    <h3 className="text-5xl font-bold mb-1 text-[#7B1113]">{stat.count}</h3>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Incoming Activity Requests */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold text-[#7B1113] flex items-center gap-2">
                  Incoming Activity Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-hidden">
                  {requestsLoading ? (
                    <div>Loading...</div>
                  ) : requestsError ? (
                    <div className="text-center py-4 text-red-500">
                      Error loading requests: {requestsError}
                    </div>
                  ) : incomingRequests.length > 0 ? (
                    <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                      <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                          <thead className="bg-[#f5f5f5]">
                            <tr>
                              <th className="px-5 py-3 text-center text-sm font-medium text-black">Submission Date</th>
                              <th className="px-5 py-3 text-center text-sm font-medium text-black">Activity Name</th>
                              <th className="px-10 py-3 text-center text-sm font-medium text-black">Organization</th>
                              <th className="px-10 py-3 text-center text-sm font-medium text-black">Activity Date</th>
                              <th className="px-10 py-3 text-center text-sm font-medium text-black">Status</th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-black">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {incomingRequests.map((request) => (
                              <tr key={request.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 text-sm text-gray-700 text-center">{request.submissionDate}</td>
                                <td className="px-6 py-3 text-sm text-gray-700 text-center">{request.activityName}</td>
                                <td className="px-6 py-3 text-sm text-gray-700 text-center">{request.organization}</td>
                                <td className="px-6 py-3 text-sm text-gray-700 text-center">{request.activityDate}</td>
                                <td className="px-6 py-3 text-sm text-center">
                                  <Badge
                                    className={
                                      request.status === "For Appeal"
                                        ? "bg-gray-100 text-gray-700 hover:bg-gray-100"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                                    }
                                  >
                                    {request.status}
                                  </Badge>
                                </td>
                                <td className="px-6 py-3 text-center">
                                  <button
                                    onClick={() => {
                                      setSelectedActivity(request);
                                      setIsModalOpen(true);
                                    }}
                                    className="text-gray-600 hover:text-[#7B1113] transition-transform transform hover:scale-125"
                                  >
                                    <Eye className="h-5 w-5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No pending or appeal requests
                    </div>
                  )}
                </div>
                {/* See More Button */}
                <div className="p-4 flex justify-center border-t">
                  <Link to="/admin/pending-requests">
                    <Button className="bg-[#014421] hover:bg-[#013319] text-white text-sm flex items-center gap-1">
                      See More <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Announcements and Calendar */}
          <div className="lg:col-span-1 space-y-6 ">
            {/* Activities Calendar Section */}
            <Card className="shadow-sm flex flex-col h-full">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-bold text-[#7B1113]">Activities Calendar</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 border-[#014421] text-[#014421]"
                      onClick={() => handleWeekNavigation("prev")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">{getWeekRange(currentWeekStart)}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 border-[#014421] text-[#014421]"
                      onClick={() => handleWeekNavigation("next")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                {/* Days of the week with day numbers */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = new Date(currentWeekStart);
                    date.setDate(date.getDate() - date.getDay() + i);
                    const day = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][i];
                    const isToday = new Date().toDateString() === date.toDateString();
                    
                    return (
                      <div key={i} className="flex flex-col items-center">
                        <div 
                          className={`text-sm font-medium py-1
                            ${isToday ? 'text-[#7B1113] font-bold' : 'text-gray-600'}
                          `}
                        >
                          {day}
                        </div>
                        <div className={`text-sm ${isToday ? 'text-[#7B1113] font-bold' : 'text-gray-500'}`}>
                          {date.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Calendar Events */}
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#7B1113]" />
                    <span className="ml-2 text-gray-600">Loading activities...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-4 text-red-500">
                    Error loading activities: {error}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      // Check if we're viewing the current week
                      const currentWeekStartDate = new Date(currentWeekStart);
                      const currentWeekEndDate = new Date(currentWeekStart);
                      currentWeekEndDate.setDate(currentWeekEndDate.getDate() + 6);
                      
                      const isCurrentWeek = today >= currentWeekStartDate && today <= currentWeekEndDate;

                      if (isCurrentWeek) {
                        // For current week, show activities only for today with filler if none
                        const todayEvents = filteredEvents.filter(event => {
                          const eventDate = new Date(event.date);
                          eventDate.setHours(0, 0, 0, 0);
                          return eventDate.getTime() === today.getTime();
                        });

                        if (todayEvents.length > 0) {
                          return todayEvents.map((event) => (
                            <div key={event.id} className="bg-[#7B1113] rounded-lg overflow-hidden">
                              <div className="p-3 space-y-1">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center text-white text-sm">
                                      <span>{event.time}</span>
                                      <span className="mx-1">•</span>
                                      <span>{event.location}</span>
                                    </div>
                                    <h3 className="text-white font-bold text-lg">
                                      {event.name}
                                    </h3>
                                  </div>
                                  <div className="flex flex-col items-end text-sm">
                                    <span className="text-white">{event.organization}</span>
                                    <span className="text-white/80 italic">{event.category}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                        } else {
                          return (
                            <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                              <div className="p-6 text-center">
                                <h3 className="text-gray-500 text-lg font-medium mb-1">No Activities Today</h3>
                              </div>
                            </div>
                          );
                        }
                      } else {
                        // For other weeks, show all activities of that week
                        const weekEvents = filteredEvents.filter(event => {
                          const eventDate = new Date(event.date);
                          return eventDate >= currentWeekStartDate && eventDate <= currentWeekEndDate;
                        });

                        if (weekEvents.length > 0) {
                          return weekEvents.map((event) => (
                            <div key={event.id} className="bg-[#7B1113] rounded-lg overflow-hidden">
                              <div className="p-3 space-y-1">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center text-white text-sm">
                                      <span>{event.time}</span>
                                      <span className="mx-1">•</span>
                                      <span>{event.location}</span>
                                    </div>
                                    <h3 className="text-white font-bold text-lg">
                                      {event.name}
                                    </h3>
                                  </div>
                                  <div className="flex flex-col items-end text-sm">
                                    <span className="text-white">{event.organization}</span>
                                    <span className="text-white/80 italic">{event.category}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                        } else {
                          return (
                            <div className="text-center py-4 text-gray-500">
                              No activities scheduled for this week
                            </div>
                          );
                        }
                      }
                    })()}
                  </div>
                )}
              </CardContent>
              <div className="flex justify-center mt-auto border-t pt-4">
                <Link to="/admin/activities-calendar">
                  <Button className="bg-[#014421] hover:bg-[#013319] text-white text-sm flex items-center gap-1">
                    See Activities Calendar <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </Card>
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
                    {selectedActivity?.partners?.length > 0 ? (
                      selectedActivity.partners.map((partner, index) => (
                        <p key={index}>{partner}</p>
                      ))
                    ) : (
                      <p>No partners listed</p>
                    )}
                  </div>
                </div>

                {/* List of Sustainable Development Goals */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-[#7B1113]">List of Sustainable Development Goals</h3>
                  <div className="flex gap-2">
                    {selectedActivity?.sdgGoals?.length > 0 ? (
                      selectedActivity.sdgGoals.map((goal, index) => (
                        <span key={index} className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {goal}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No SDG goals listed</span>
                    )}
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
