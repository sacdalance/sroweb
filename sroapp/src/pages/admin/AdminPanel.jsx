import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import supabase from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import axios from "axios";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";
import LoadingSpinner from "@/components/ui/loading-spinner.jsx";

const AdminPanel = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
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

  // State for filtered events
  const [filteredEvents, setFilteredEvents] = useState([]);

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
    { title: "Total Submissions", count: requestsCounts.forAppeal + requestsCounts.pending + requestsCounts.approved || 0, path: "/admin/all-submissions" },
    { title: "Pending Activity Requests", count: requestsCounts.forAppeal + requestsCounts.pending || 0, path: "/admin/pending-requests" },
    { title: "Approved Activity Requests", count: requestsCounts.approved || 0 },
    { title: "Pending Applications", count: requestsCounts.pendingApplications || 0, path: "/admin/org-applications" },
    { title: "Approved Applications", count: requestsCounts.approvedApplications || 0 },
    { title: "Annual Reports", count: requestsCounts.annualReports || 0, path: "/admin/annual-reports" },
  ];

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

        // Initialize counters for "For Appeal" and "Pending" statuses
        let forAppealCount = 0;
        let pendingCount = 0;

        // Filter and transform the data
        const transformedRequests = allActivities.map((request) => {
          const isForAppeal = request.final_status === "For Appeal";
          const isPending = request.final_status === "Pending" || request.final_status === null;

          // Increment counters based on status
          if (isForAppeal) forAppealCount++;
          if (isPending) pendingCount++;

          return {
            id: request.activity_id,
            submissionDate: new Date(request.created_at).toLocaleDateString(),
            activityName: request.activity_name,
            organization: request.organization?.org_name || "N/A",
            activityDate: request.schedule?.[0]?.start_date
              ? new Date(request.schedule[0].start_date).toLocaleDateString()
              : "TBD",
            status: request.final_status || "Pending", // Treat NULL as "Pending"
          };
        });

        // Log the counts for debugging
        console.log("For Appeal Count:", forAppealCount);
        console.log("Pending Count:", pendingCount);

        // Update state with transformed requests
        setIncomingRequests(transformedRequests);

        // Update the counts in state without overwriting the approved count
        setRequestsCounts((prevCounts) => ({
          ...prevCounts,
          forAppeal: forAppealCount,
          pending: pendingCount,
        }));
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
          .from("activity")
          .select(`
            *,
            organization:organization(*),
            schedule:activity_schedule(*)
          `)
          .eq("final_status", "Approved"); // Fetch only approved activities

        if (error) throw error;

        // Count approved activities
        const approvedCount = data.filter(
          (activity) => activity.final_status?.toLowerCase() === "approved"
        ).length;

        // Transform the data to match our events structure
        const transformedEvents = [];
        data.forEach((activity) => {
          if (Array.isArray(activity.schedule)) {
            activity.schedule.forEach((sched) => {
              if (sched.start_date) {
                const startTime = sched.start_time
                  ? new Date(`1970-01-01T${sched.start_time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "00:00";
                const endTime = sched.end_time
                  ? new Date(`1970-01-01T${sched.end_time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "00:00";
                const categoryLabel = categoryMap[activity.activity_type] || "Others";
                transformedEvents.push({
                  id: activity.activity_id + "_" + sched.activity_schedule_id,
                  name: activity.activity_name,
                  time: `${startTime} to ${endTime}`,
                  location: activity.venue,
                  category: categoryLabel,
                  organization: activity.organization?.org_name,
                  date: sched.start_date,
                });
              }
            });
          }
        });
        setEvents(transformedEvents);

        // Update the approved count in state
        setRequestsCounts((prevCounts) => ({
          ...prevCounts,
          approved: approvedCount, // Update the approved count
        }));
      } catch (err) {
        console.error("Error fetching activities:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchActivities();
  }, []);

  // Recalculate filtered events whenever `events` or `currentWeekStart` changes
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize time to start of the day

    const currentWeekStartDate = new Date(currentWeekStart);
    const currentWeekEndDate = new Date(currentWeekStart);
    currentWeekEndDate.setDate(currentWeekEndDate.getDate() + 6); // End of the week

    const isCurrentWeek = today >= currentWeekStartDate && today <= currentWeekEndDate;

    const newFilteredEvents = events.filter((event) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0); // Normalize time to start of the day

      if (isCurrentWeek) {
        // Show only today's events for the current week
        return eventDate.getTime() === today.getTime();
      } else {
        // Show all events for the selected week
        return eventDate >= currentWeekStartDate && eventDate <= currentWeekEndDate;
      }
    });

    setFilteredEvents(newFilteredEvents);
  }, [events, currentWeekStart]);

  // Filter events for the current week
  const filteredEventsForCurrentWeek = events.filter(event => isDateInCurrentWeek(event.date));

  const handleViewDetails = async (request) => {
    setModalLoading(true);
    setIsModalOpen(true);
    setSelectedActivity(null);

    // Fetch full activity details from Supabase
    const { data, error } = await supabase
      .from("activity")
      .select(`
        *,
        account:account(*),
        schedule:activity_schedule(*),
        organization:organization(*)
      `)
      .eq("activity_id", request.id)
      .single();

    if (error) {
      console.error("Failed to fetch activity details:", error);
      setSelectedActivity(request); // fallback to minimal
    } else {
      setSelectedActivity(data);
    }
    setModalLoading(false);
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

  // Fetch organization requests (annual reports, pending applications, and approved applications)
  const fetchOrganizationRequests = async () => {
    try {
      // Get the current year
      const currentYear = new Date().getFullYear();

      // Fetch and count annual reports where the last 4 digits of academic_year match the current year
      const { data: annualReportsData, error: annualReportsError } = await supabase
        .from("org_annual_report")
        .select("*", { count: "exact" })
        .ilike("academic_year", `%${currentYear}`); // Match rows where academic_year ends with the current year

      if (annualReportsError) throw annualReportsError;

      // Log the count of annual reports
      console.log(`Annual Reports Count for ${currentYear}:`, annualReportsData.length);

      // Fetch and count pending applications from the org_application table
      const { data: pendingApplicationsData, error: pendingApplicationsError } = await supabase
        .from("org_application")
        .select("*", { count: "exact" })
        .eq("final_status", "Pending"); // Filter for rows where final_status is "Pending"

      if (pendingApplicationsError) throw pendingApplicationsError;

      // Log the count of pending applications
      console.log(`Pending Applications Count:`, pendingApplicationsData.length);

      // Fetch and count approved applications from the org_application table
      const { data: approvedApplicationsData, error: approvedApplicationsError } = await supabase
        .from("org_application")
        .select("*", { count: "exact" })
        .eq("final_status", "Approved"); // Filter for rows where final_status is "Approved"

      if (approvedApplicationsError) throw approvedApplicationsError;

      // Log the count of approved applications
      console.log(`Approved Applications Count:`, approvedApplicationsData.length);

      // Update the counts in state
      setRequestsCounts((prevCounts) => ({
        ...prevCounts,
        annualReports: annualReportsData.length, // Update the annualReports count
        pendingApplications: pendingApplicationsData.length, // Update the pendingApplications count
        approvedApplications: approvedApplicationsData.length, // Update the approvedApplications count
      }));
    } catch (error) {
      console.error("Error fetching organization requests:", error);
    }
  };

  useEffect(() => {
    const fetchAnnualReports = async () => {
      try {
        setRequestsLoading(true); // Optional: Show loading state if needed

        // Get the current year
        const currentYear = new Date().getFullYear();

        // Fetch and count annual reports where the last 4 digits of academic_year match the current year
        const { data, error } = await supabase
          .from("org_annual_report")
          .select("*", { count: "exact" })
          .ilike("academic_year", `%${currentYear}`); // Match rows where academic_year ends with the current year

        if (error) throw error;

        // Log the count of annual reports
        console.log(`Annual Reports Count for ${currentYear}:`, data.length);

        // Update the counts in state
        setRequestsCounts((prevCounts) => ({
          ...prevCounts,
          annualReports: data.length, // Update the annualReports count
        }));
      } catch (error) {
        console.error("Error fetching annual reports:", error);
      } finally {
        setRequestsLoading(false); // Optional: Hide loading state if needed
      }
    };

    fetchAnnualReports();
  }, []);

  // Fetch approved organization requests
  const fetchApprovedOrganizationRequests = async () => {
    try {
      // Get the current year
      const currentYear = new Date().getFullYear();

      // Fetch and count approved applications from the org_recognition table
      const { data: approvedApplicationsData, error: approvedApplicationsError } = await supabase
        .from("org_recognition")
        .select("*", { count: "exact" })
        .eq("status", "Approved"); // Filter for rows where status is "Approved"

      if (approvedApplicationsError) throw approvedApplicationsError;

      // Log the count of approved applications
      console.log(`Approved Applications Count:`, approvedApplicationsData.length);

      // Update the counts in state
      setRequestsCounts((prevCounts) => ({
        ...prevCounts,
        approvedApplications: approvedApplicationsData.length, // Update the approvedApplications count
      }));
    } catch (error) {
      console.error("Error fetching approved organization requests:", error);
    }
  };

  useEffect(() => {
    fetchApprovedOrganizationRequests();
  }, []);

  const categoryMap = {
    charitable: "Charitable",
    serviceWithinUPB: "Service (within UPB)",
    serviceOutsideUPB: "Service (outside UPB)",
    contestWithinUPB: "Contest (within UPB)",
    contestOutsideUPB: "Contest (outside UPB)",
    educational: "Educational",
    incomeGenerating: "Income-Generating Project",
    massOrientation: "Mass Orientation/General Assembly",
    booth: "Booth",
    rehearsals: "Rehearsals/Preparation",
    specialEvents: "Special Event",
    others: "Others",
  };

  // --- Activities Calendar Filtering Logic (same as Dashboard.jsx fix) ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentWeekStartDate = new Date(currentWeekStart);
  currentWeekStartDate.setHours(0, 0, 0, 0);
  const currentWeekEndDate = new Date(currentWeekStart);
  currentWeekEndDate.setDate(currentWeekEndDate.getDate() + 6);
  currentWeekEndDate.setHours(23, 59, 59, 999);

  const isCurrentWeek =
    today >= currentWeekStartDate && today <= currentWeekEndDate;

  // Always filter events for the current week
  const weekEvents = useMemo(
    () =>
      events.filter((event) => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= currentWeekStartDate && eventDate <= currentWeekEndDate;
      }),
    [events, currentWeekStart]
  );

  // Then, for current week, filter for today only
  const eventsToShow = isCurrentWeek
    ? weekEvents.filter((event) => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === today.getTime();
      })
    : weekEvents;

  return (
    <div className="flex flex-col min-h-screen bg-[#ffffff]">
      {/* Responsive Flex Layout */}
      <div className="flex flex-col md:flex-row flex-wrap w-full max-w-[1500px] mx-auto p-4 md:p-6 gap-6 min-h-[80vh]">
        {/* Main Content */}
        <main className="flex-1 min-w-0 flex flex-col gap-6 w-full">
          {/* Summary of Submissions */}
          <section>
            <h2 className="text-2xl font-bold text-[#7B1113] mb-4">Summary of Submissions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
          </section>

          {/* Two Column Responsive Section */}
          <section className="flex flex-col lg:flex-row gap-6 min-w-0">
            {/* Left: Incoming Activity Requests */}
            <div className="flex-1 min-w-0">
              <Card className="shadow-sm h-full flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold text-[#7B1113] flex items-center gap-2">
                    Incoming Activity Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 min-w-0 flex flex-col">
                  <div className="overflow-x-auto w-full flex-1">
                    {(requestsLoading || loading || incomingRequests.length === 0) ? (
                      <div className="flex flex-col items-center justify-center p-10 text-center text-gray-600">
                        <Loader2 className="h-6 w-6 mb-2 animate-spin text-[#7B1113]" />
                        <p>Loading Requests...</p>
                      </div>
                    ) : requestsError ? (
                      <div className="text-center py-4 text-red-500">
                        Error loading requests: {requestsError}
                      </div>
                    ) : (
                      <div className="max-h-[800px] overflow-y-auto custom-scrollbar">
                        <table className="min-w-full border-separate border-spacing-0">
                          <thead className="bg-[#ffffff]">
                            <tr>
                              <th className="px-1 py-2 text-center text-xs font-medium text-black w-24">Submission<br />Date</th>
                              <th className="px-1 py-2 text-center text-xs font-medium text-black w-32">Activity<br />Name</th>
                              <th className="px-1 py-2 text-center text-xs font-medium text-black w-32">Organization</th>
                              <th className="px-1 py-2 text-center text-xs font-medium text-black w-24">Activity<br />Date</th>
                              <th className="px-1 py-2 text-center text-xs font-medium text-black w-20">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {incomingRequests.map((request) => (
                              <tr
                                key={request.id}
                                className="hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleViewDetails(request)}
                              >
                                <td className="px-1 py-2 text-xs text-gray-700 text-center break-words">{request.submissionDate}</td>
                                <td className="px-1 py-2 text-xs text-gray-700 text-center break-words">{request.activityName}</td>
                                <td className="px-1 py-2 text-xs text-gray-700 text-center break-words">{request.organization}</td>
                                <td className="px-1 py-2 text-xs text-gray-700 text-center break-words">{request.activityDate}</td>
                                <td className="px-1 py-2 text-xs text-center">
                                  <Badge
                                    className={
                                      request.status === "Pending"
                                        ? "bg-[#F3AA2C] text-[#7B1113] hover:bg-[#F3AA2C]" // Gold fill, maroon text
                                        : request.status === "For Appeal"
                                        ? "bg-[#7B1113] text-white hover:bg-[#7B1113]"      // Maroon fill, white text
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-100"     // Default
                                    }
                                  >
                                    {request.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  {/* See More Button */}
                  <div className="flex justify-center mt-auto border-t pt-4">
                    <Link to="/admin/pending-requests">
                      <Button className="bg-[#014421] hover:bg-[#013319] text-white text-sm flex items-center gap-1">
                        See More <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Activities Calendar */}
            <div className="flex-1 min-w-0">
              <Card className="shadow-sm flex flex-col h-full">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold text-[#7B1113]">Activities Calendar</CardTitle>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 p-0 border-[#014421] text-[#014421] rounded-md"
                        onClick={() => handleWeekNavigation("prev")}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-medium px-1 text-center leading-tight whitespace-nowrap">
                        {(() => {
                          const range = getWeekRange(currentWeekStart);
                          // Instead of splitting and stacking, just show as a single line
                          return range;
                        })()}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 p-0 border-[#014421] text-[#014421] rounded-md"
                        onClick={() => handleWeekNavigation("next")}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow min-w-0">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center p-10 text-center text-gray-600">
                      <Loader2 className="h-6 w-6 mb-2 animate-spin text-[#7B1113]" />
                      <p>Loading Calendar...</p>
                    </div>
                  ) : (
                    <div className="w-full">
                      {/* Responsive: horizontal scroll for cards on small screens, vertical grid on large */}
                      <div className="w-full">
                        {/* Desktop/tablet: Days left, cards right (vertical) */}
                        <div className="hidden sm:grid grid-cols-[70px_1fr] gap-2">
                          {/* Days of the week */}
                          <div className="flex flex-col gap-2 h-full">
                            {Array.from({ length: 7 }, (_, i) => {
                              const date = new Date(currentWeekStart);
                              date.setDate(date.getDate() - date.getDay() + i);
                              const day = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][i];
                              const isToday = new Date().toDateString() === date.toDateString();
                              return (
                                <div
                                  key={i}
                                  className={`flex flex-col items-center justify-center rounded-lg w-16 h-[100px]
                                    ${isToday ? "bg-[#F3AA2C] text-[#7B1113] font-bold border-2 border-[#F3AA2C] shadow" : ""}
                                  `}
                                >
                                  <span className="text-xs">{day}</span>
                                  <span className="text-base">{date.getDate()}</span>
                                </div>
                              );
                            })}
                          </div>
                          {/* Activity cards in vertical stack */}
                          <div className="flex flex-col gap-2 h-full min-w-0">
                            {Array.from({ length: 7 }, (_, i) => {
                              const date = new Date(currentWeekStart);
                              date.setDate(date.getDate() - date.getDay() + i);
                              date.setHours(0, 0, 0, 0);

                              const dayEvents = events.filter(event => {
                                const eventDate = new Date(event.date);
                                eventDate.setHours(0, 0, 0, 0);
                                return eventDate.getTime() === date.getTime();
                              });

                              return (
                                <div key={i} className="flex-1 min-w-0">
                                  {dayEvents.length > 0 ? (
                                    <div
                                      key={dayEvents[0].id}
                                      className="bg-[#7B1113] rounded-lg overflow-hidden p-3 flex flex-col min-w-0 h-[100px] w-full max-w-full mx-auto justify-between"
                                      style={{ width: "100%", maxWidth: "100%" }}
                                    >
                                      {/* Top Row: Location + Time Slot */}
                                      <div className="flex items-center mb-1 min-w-0">
                                        <span className="text-white text-xs truncate flex-1 min-w-0">{dayEvents[0].location}</span>
                                        <span className="text-white text-xs ml-2 flex-shrink-0 truncate">{dayEvents[0].time}</span>
                                      </div>
                                      {/* Activity Name */}
                                      <h3 className="text-white font-bold text-base mb-1 truncate">{dayEvents[0].name}</h3>
                                      {/* Organization and Category */}
                                      <div className="flex flex-row items-start gap-2 min-w-0 w-full">
                                        <span className="text-white text-sm truncate flex-1 min-w-0">{dayEvents[0].organization}</span>
                                        <span className="text-white/80 italic text-xs sm:text-sm text-right flex-shrink-0">{dayEvents[0].category}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="rounded-lg overflow-hidden border border-gray-200 h-[100px] w-full max-w-full mx-auto flex items-center justify-center">
                                      <span className="text-gray-500 text-sm truncate">No Activities</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {/* Mobile: Days left, cards horizontally aligned with no scroll */}
                        <div className="sm:hidden flex flex-col gap-2">
                          {Array.from({ length: 7 }, (_, i) => {
                            const date = new Date(currentWeekStart);
                            date.setDate(date.getDate() - date.getDay() + i);
                            date.setHours(0, 0, 0, 0);

                            const day = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][i];
                            const isToday = new Date().toDateString() === date.toDateString();

                            const dayEvents = events.filter(event => {
                              const eventDate = new Date(event.date);
                              eventDate.setHours(0, 0, 0, 0);
                              return eventDate.getTime() === date.getTime();
                            });

                            return (
                              <div key={i} className="flex flex-row items-center gap-2 w-full">
                                {/* Day label aligned with cards */}
                                <div
                                  className={`flex flex-col items-center justify-center rounded-lg w-16 h-[100px] flex-shrink-0
                                    ${isToday ? "bg-[#F3AA2C] text-[#7B1113] font-bold border-2 border-[#F3AA2C] shadow" : ""}
                                  `}
                                >
                                  <span className="text-xs">{day}</span>
                                  <span className="text-base">{date.getDate()}</span>
                                </div>
                                {/* Cards for this day, wrap if needed */}
                                <div className="flex flex-row flex-wrap gap-2 w-full min-w-0">
                                  {dayEvents.length > 0 ? (
                                    dayEvents.map(event => (
                                      <div
                                        key={event.id}
                                        className="bg-[#7B1113] rounded-lg overflow-hidden p-3 flex flex-col min-w-0 h-[100px] flex-1 basis-[220px] max-w-full justify-between"
                                        style={{ minWidth: 0 }}
                                      >
                                        <div className="flex items-center mb-1 min-w-0">
                                          <span className="text-white text-xs truncate flex-1 min-w-0">{event.location}</span>
                                          <span className="text-white text-xs ml-2 flex-shrink-0 truncate">{event.time}</span>
                                        </div>
                                        <h3 className="text-white font-bold text-base mb-1 truncate">{event.name}</h3>
                                        <div className="flex flex-row items-start gap-2 min-w-0 w-full">
                                          <span className="text-white text-sm truncate flex-1 min-w-0">{event.organization}</span>
                                          <span className="text-white/80 italic text-xs truncate text-right flex-shrink-0">{event.category}</span>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="rounded-lg overflow-hidden border border-gray-200 h-[100px] flex-1 basis-[220px] max-w-full flex items-center justify-center min-w-0">
                                      <span className="text-gray-500 text-sm truncate">No Activities</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <div className="flex justify-center mt-auto border-t pt-4">
                  <Link to="/admin/activities-calendar">
                    <Button className="bg-[#014421] hover:bg-[#013319] text-white text-sm flex items-center gap-1">
                      See More Activities <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </section>
        </main>
      </div>

      {/* Activity Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {modalLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-10 w-10 animate-spin text-[#7B1113]" />
          </div>
        ) : (
          selectedActivity && (
            <ActivityDialogContent
              activity={selectedActivity}
              setActivity={setSelectedActivity}
              isModalOpen={isModalOpen}
              readOnly={true}
            />
          )
        )}
      </Dialog>
    </div>
  );
};

export default AdminPanel;