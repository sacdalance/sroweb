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
import StatusPill from "@/components/ui/StatusPill";

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
    pendingApplications: 0,
    approvedApplications: 0,
    annualReports: 0,
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
    { title: "Pending Requests", count: requestsCounts.forAppeal + requestsCounts.pending || 0, path: "/admin/pending-requests" },
    { title: "Approved Requests", count: requestsCounts.approved || 0 },
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
        const filteredActivities = allActivities.filter(activity => {
          // Exclude rejected events
          if (activity.final_status === "Rejected") return false;
          const isForAppeal = activity.final_status === "For Appeal";
          const isPending = activity.final_status === "Pending" || activity.final_status === null;

          // Increment counters based on status
          if (isForAppeal) forAppealCount++;
          if (isPending) pendingCount++;

          return true;
        });

        // Log the counts for debugging
        console.log("For Appeal Count:", forAppealCount);
        console.log("Pending Count:", pendingCount);

        // Update state with transformed requests (limit to 10, sorted by activity_id descending)
        setIncomingRequests(
          filteredActivities
            .sort((a, b) => Number(b.activity_id) - Number(a.activity_id))
            .slice(0, 10)
            .map(activity => ({
              id: activity.activity_id,
              submissionDate: new Date(activity.created_at).toLocaleDateString(),
              activityName: activity.activity_name,
              organization: activity.organization?.org_name || "N/A",
              activityDate: activity.schedule?.[0]?.start_date
                ? new Date(activity.schedule[0].start_date).toLocaleDateString()
                : "TBD",
              status: activity.final_status || "Pending",
            }))
        );

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

  useEffect(() => {
    const fetchPendingOrgRequests = async () => {
      try {
        setRequestsLoading(true);

        // Fetch pending applications with these combinations:
        // (sro_approved: null, odsa_approved: null)
        // (sro_approved: true, odsa_approved: null)
        // (sro_approved: true, odsa_approved: false)
        const { data, error } = await supabase
          .from("org_recognition")
          .select("*", { count: "exact" })
          .or(
            'and(sro_approved.is.null,odsa_approved.is.null),' +
            'and(sro_approved.eq.true,odsa_approved.is.null),' +
            'and(sro_approved.eq.true,odsa_approved.eq.false)'
          );

        if (error) throw error;

        // Log the count of pending applications
        console.log(`Pending Applications Count:`, data.length);

        // Update the counts in state
        setRequestsCounts((prevCounts) => ({
          ...prevCounts,
          pendingApplications: data.length,
        }));
      } catch (error) {
        console.error("Error fetching pending organization requests:", error);
      } finally {
        setRequestsLoading(false);
      }
    };

    fetchPendingOrgRequests();
  }, []);

  useEffect(() => {
    const fetchApprovedOrgRequests = async () => {
      try {
        setRequestsLoading(true);

        const { data: approvedApplicationsData, error: approvedApplicationsError } = await supabase
          .from("org_recognition")
          .select("*", { count: "exact" })
          .eq("sro_approved", true)
          .eq("odsa_approved", true);

        if (approvedApplicationsError) throw approvedApplicationsError;

        // Log the count of approved applications
        console.log(`Approved Applications Count:`, approvedApplicationsData.length);

        // Update the counts in state
        setRequestsCounts((prevCounts) => ({
          ...prevCounts,
          approvedApplications: approvedApplicationsData.length, // <-- use the correct variable
        }));
      } catch (error) {
        console.error("Error fetching approved organization requests:", error);
      } finally {
        setRequestsLoading(false);
      }
    };

    fetchApprovedOrgRequests();
  }, []);

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

  const handleEventClick = async (event) => {
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
      .eq("activity_id", event.id.split("_")[0])
      .single();

    if (error) {
      console.error("Failed to fetch activity details:", error);
      setSelectedActivity(event); // fallback to minimal
    } else {
      setSelectedActivity(data);
    }
    setModalLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#ffffff]">
      {/* Responsive Flex Layout */}
      <div className="flex flex-col md:flex-row flex-wrap w-full max-w-[1500px] mx-auto p-4 md:p-6 gap-6 min-h-[80vh]">
        {/* Main Content */}
        <main className="flex-1 min-w-0 flex flex-col gap-6 w-full">
          {/* Summary of Submissions */}
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#7B1113] mb-8 text-center sm:text-left">Summary of Submissions</h2>
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
              <Card className="shadow-sm h-auto flex flex-col max-h-full">
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
                          <thead className="bg-gray-100 border-b border-gray-200">
                            <tr>
                              <th className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[120px] truncate">Submission<br />Date</th>
                              <th className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[150px] truncate">Activity<br />Name</th>
                              <th className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[120px] truncate">Organization</th>
                              <th className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[120px] truncate">Activity<br />Date</th>
                              <th className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[120px] truncate">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {incomingRequests.map((request, idx) => (
                              <tr
                                key={request.id}
                                className="hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleViewDetails(request)}
                              >
                                <td className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[120px] truncate">{request.submissionDate}</td>
                                <td className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[150px] truncate">{request.activityName}</td>
                                <td className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[120px] truncate">{request.organization}</td>
                                <td className="px-2 py-2 text-xs text-gray-700 text-center break-words max-w-[120px] truncate">{request.activityDate}</td>
                                <td className="px-2 py-2 text-xs text-center">
                                  <StatusPill status={request.status} />
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
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0 border-1 border-[#014421] text-[#014421] rounded-full bg-white hover:bg-[#f3f4f6] shadow-none"
                        onClick={() => handleWeekNavigation("prev")}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <span className="text-xs font-medium px-1 text-center leading-tight whitespace-nowrap">
                        {(() => {
                          const range = getWeekRange(currentWeekStart);
                          return range;
                        })()}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0 border-1 border-[#014421] text-[#014421] rounded-full bg-white hover:bg-[#f3f4f6] shadow-none"
                        onClick={() => handleWeekNavigation("next")}
                      >
                        <ChevronRight className="h-6 w-6" />
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
                                    <div className="h-[100px] w-full max-w-full mx-auto">
                                      <div
                                        key={dayEvents[0].id}
                                        onClick={() => handleEventClick(dayEvents[0])}
                                        className="bg-[#7B1113] rounded-lg p-3 flex flex-col min-w-0 h-full w-full relative cursor-pointer hover:bg-[#5e0d0e] transition-colors"
                                      >
                                        {/* Activity Name and Time */}
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                          <h3 className="text-white font-bold text-base truncate flex-1">{dayEvents[0].name}</h3>
                                          <span className="text-white text-xs flex-shrink-0">{dayEvents[0].time}</span>
                                        </div>
                                        {/* Organization Name */}
                                        <span className="text-white/90 text-sm truncate mb-auto">{dayEvents[0].organization}</span>
                                        {/* Bottom Row: Location and Activity Count */}
                                        <div className="flex items-center justify-between mt-1">
                                          <span className="text-white/80 text-xs truncate">{dayEvents[0].location}</span>
                                          {dayEvents.length > 1 && (
                                            <Badge
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // Navigate to activities calendar
                                                window.location.href = '/admin/activities-calendar';
                                              }}
                                              className="bg-[#F3AA2C] hover:bg-[#F3AA2C]/90 text-[#7B1113] text-xs font-bold px-1.5 rounded-full ml-2 cursor-pointer"
                                            >
                                              +{dayEvents.length - 1} More Activities
                                            </Badge>
                                          )}
                                        </div>
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

      {/* Activity Details Dialog */}
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
              readOnly={false}
            />
          )
        )}
      </Dialog>
    </div>
  );
};

export default AdminPanel;