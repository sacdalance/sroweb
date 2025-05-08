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
import axios from "axios";

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

  // Function to fetch announcements from Supabase
  const fetchAnnouncements = async () => {
    try {
      setAnnouncementsLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('posted_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setAnnouncementsError(err.message);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  // Function to handle creating a new announcement
  const handleCreateAnnouncement = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert([
          {
            title: newAnnouncement.title,
            content: newAnnouncement.content,
            posted_by: 'Admin', // You might want to get this from the authenticated user
            posted_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;

      // Refresh announcements
      await fetchAnnouncements();
      setIsAnnouncementModalOpen(false);
      setNewAnnouncement({ title: '', content: '' });
    } catch (error) {
      console.error('Error creating announcement:', error);
      // You might want to show an error message to the user here
    }
  };

  // Fetch incoming activity requests
  useEffect(() => {
    const fetchIncomingRequests = async () => {
        try {
            setRequestsLoading(true);
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            const access_token = sessionData?.session?.access_token;

            if (!access_token) {
                console.error("No access token found");
                return;
            }

            const res = await axios.get("/api/activities/incoming", {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            });

            console.log("Fetched incoming requests:", res.data);
            const allActivities = res.data;

            // Filter requests based on status
            const filteredRequests = allActivities.filter((request) => {
                const isAppeal = request.final_status === "For Appeal";
                const isPending = request.final_status === "Pending" || request.final_status === null; // Include NULL as pending
                return isAppeal || isPending;
            });

            // Transform the data for display
            const transformedRequests = filteredRequests.map((request) => ({
                id: request.activity_id,
                submissionDate: new Date(request.created_at).toLocaleDateString(),
                activityName: request.activity_name,
                organization: request.organization?.org_name || "N/A",
                activityDate: request.schedule?.[0]?.start_date
                    ? new Date(request.schedule[0].start_date).toLocaleDateString()
                    : "TBD",
                status: request.final_status || "Pending", // Treat NULL as "Pending"
            }));

            setIncomingRequests(transformedRequests);
        } catch (error) {
            console.error("Error fetching incoming requests:", error);
            setRequestsError(error.message);
        } finally {
            setRequestsLoading(false);
        }
    };

    fetchIncomingRequests();
  }, []);

  // Fetch activities from Supabase
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('activity')
          .select(`
            *,
            organization:organization(*),
            schedule:activity_schedule(*)
          `)
          .eq('final_status', 'Approved');

        if (error) throw error;

        // Transform the data to match our events structure
        const transformedEvents = data.map(activity => ({
          id: activity.activity_id,
          name: activity.activity_name,
          time: `${activity.schedule[0]?.start_time || '00:00'} to ${activity.schedule[0]?.end_time || '00:00'}`,
          location: activity.venue,
          category: activity.activity_type,
          organization: activity.organization?.org_name,
          date: activity.schedule[0]?.start_date
        }));

        setEvents(transformedEvents);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Filter events for the current week
  const filteredEvents = events.filter(event => isDateInCurrentWeek(event.date));

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

  // Fetch announcements on component mount
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <div className="max-w-[1500px] mx-auto p-6">
      
      {/* Summary of Submissions */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-[#7B1113] mb-4">Summary of Submissions</h2>
        <div className="grid grid-cols-6 gap-4">
          {statsSummary.map((stat) => (
            stat.title === "Total Submissions" ? (
              <div 
                key={stat.path}
                className="block p-4 bg-[#F8F9FA] border border-gray-200 rounded-xl shadow-sm relative hover:bg-gray-50 transition-colors aspect-[4/3] flex flex-col justify-end items-start"
              >
                <h3 className="text-5xl font-bold mb-1 text-[#7B1113]">{stat.count}</h3>
                <p className="text-sm text-gray-600">{stat.title}</p>
              </div>
            ) : (
              <Link 
                to={stat.path}
                key={stat.path}
                className="block p-4 bg-[#F8F9FA] border border-gray-200 rounded-xl shadow-sm relative hover:bg-gray-50 transition-colors aspect-[4/3] flex flex-col justify-end items-start"
              >
                <span className="absolute top-3 right-3 text-[#014421]">
                  <ArrowRight className="w-4 h-4" />
                </span>
                <h3 className="text-5xl font-bold mb-1 text-[#7B1113]">{stat.count}</h3>
                <p className="text-sm text-gray-600">{stat.title}</p>
              </Link>
            )
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Incoming Activity Requests */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold text-[#7B1113]">Incoming Activity Requests</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden">
                {requestsLoading ? (
                  <>
                    <table className="w-full">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-4 py-3 text-center text-sm font-medium text-black">Submission Date</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-black">Activity Name</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-black">Organization</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-black">Activity Date</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-black">Status</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-black"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {[...Array(5)].map((_, index) => (
                          <tr key={index} className="animate-pulse">
                            <td className="px-6 py-3 text-center">
                              <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                            </td>
                            <td className="px-6 py-3 text-center">
                              <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                            </td>
                            <td className="px-6 py-3 text-center">
                              <div className="h-4 bg-gray-200 rounded w-28 mx-auto"></div>
                            </td>
                            <td className="px-6 py-3 text-center">
                              <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                            </td>
                            <td className="px-6 py-3 text-center">
                              <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                            </td>
                            <td className="px-6 py-3 text-center">
                              <div className="h-5 w-5 bg-gray-200 rounded-full mx-auto"></div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="p-4 flex justify-center border-t">
                      <div className="h-9 bg-gray-200 rounded w-28"></div>
                    </div>
                  </>
                ) : requestsError ? (
                  <div className="text-center py-4 text-red-500">
                    Error loading requests: {requestsError}
                  </div>
                ) : incomingRequests.length > 0 ? (
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    <table className="w-full">
                      <thead className="bg-[#f5f5f5]">
                        <tr>
                          <th className="px-5 py-3 text-center text-sm font-medium text-black">Submission Date</th>
                          <th className="px-5 py-3 text-center text-sm font-medium text-black">Activity Name</th>
                          <th className="px-10 py-3 text-center text-sm font-medium text-black">Organization</th>
                          <th className="px-10 py-3 text-center text-sm font-medium text-black">Activity Date</th>
                          <th className="px-10 py-3 text-center text-sm font-medium text-black">Status</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-black"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {incomingRequests.slice(0, 5).map((request) => (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 text-sm text-gray-700 text-center">{request.submissionDate}</td>
                            <td className="px-6 py-3 text-sm text-gray-700 text-center">{request.activityName}</td>
                            <td className="px-6 py-3 text-sm text-gray-700 text-center">{request.organization}</td>
                            <td className="px-6 py-3 text-sm text-gray-700 text-center">{request.activityDate}</td>
                            <td className="px-6 py-3 text-sm text-center">
                              <Badge
                                className={
                                  request.status === "Appeal"
                                    ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
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
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No pending or appeal requests
                  </div>
                )}
                <div className="p-4 flex justify-center border-t">
                  <Link to="/admin/pending-requests">
                    <Button className="bg-[#014421] hover:bg-[#013319] text-white text-sm flex items-center gap-1">
                      See More <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Announcements and Calendar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Activities Calendar Section */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-[#7B1113]">Activities Calendar</CardTitle>
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
            </CardHeader>
            <CardContent>
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
              <div className="flex justify-center mt-4 border-t pt-4">
                <Link to="/admin/activities-calendar">
                  <Button className="bg-[#014421] hover:bg-[#013319] text-white text-sm flex items-center gap-1">
                    See Activities Calendar <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Announcement Modal */}
      <Dialog open={isAnnouncementModalOpen} onOpenChange={setIsAnnouncementModalOpen}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#7B1113] flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Write New Announcement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                placeholder="Enter announcement title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <textarea
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                placeholder="Write your announcement here..."
                className="w-full min-h-[150px] p-2 border rounded-md"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAnnouncementModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAnnouncement}
              className="bg-[#014421] hover:bg-[#013319] text-white flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              Post Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
