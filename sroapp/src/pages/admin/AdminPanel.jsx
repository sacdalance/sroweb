import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowRight } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import supabase from "@/lib/supabase";
import { API_BASE_URL } from "@/lib/api-config";
import axios from "axios";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";
import LoadingSpinner from "@/components/ui/loading-spinner.jsx";
import StatusPill from "@/components/ui/StatusPill";
import WeeklyCalendar from "@/components/ui/WeeklyCalendar";
import DataTable from "@/components/ui/DataTable";
import { FileText, Calendar, CheckCircle, Clock, FileCheck, BookOpen } from "lucide-react";

const AdminPanel = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  // Specific loading states for each fetch
  const [incomingLoading, setIncomingLoading] = useState(true);
  const [pendingStatsLoading, setPendingStatsLoading] = useState(true);
  const [approvedStatsLoading, setApprovedStatsLoading] = useState(true);
  const [reportsStatsLoading, setReportsStatsLoading] = useState(true);

  const [requestsError, setRequestsError] = useState(null);
  const [requestsCounts, setRequestsCounts] = useState({
    approved: 0,
    forAppeal: 0,
    pending: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    annualReports: 0,
  });

  // Stats data for the summary section
  const statsSummary = [
    { title: "Total Submissions", count: requestsCounts.forAppeal + requestsCounts.pending + requestsCounts.approved || 0, path: "/admin/all-submissions", icon: FileText },
    { title: "Pending Requests", count: requestsCounts.forAppeal + requestsCounts.pending || 0, path: "/admin/student-activities", icon: Clock },
    { title: "Approved Requests", count: requestsCounts.approved || 0, path: "/admin/activity-summary", icon: CheckCircle },
    { title: "Pending Applications", count: requestsCounts.pendingApplications || 0, path: "/admin/org-applications", icon: BookOpen },
    { title: "Approved Applications", count: requestsCounts.approvedApplications || 0, path: "/admin/organizations", icon: FileCheck },
    { title: "Annual Reports", count: requestsCounts.annualReports || 0, path: "/admin/annual-reports", icon: Calendar },
  ];

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

  // Fetch incoming activity requests
  useEffect(() => {
    const fetchIncomingRequests = async () => {
      try {
        setIncomingLoading(true);
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const access_token = sessionData?.session?.access_token;

        if (!access_token) {
          console.error("No access token found");
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/api/activities/incoming`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        console.log("Fetched incoming requests:", res.data);
        const allActivities = res.data;

        let forAppealCount = 0;
        let pendingCount = 0;

        const filteredActivities = allActivities.filter(activity => {
          if (activity.final_status === "Rejected") return false;
          const isForAppeal = activity.final_status === "For Appeal";
          const isPending = activity.final_status === "Pending" || activity.final_status === null;

          if (isForAppeal) forAppealCount++;
          if (isPending) pendingCount++;

          return true;
        });

        setIncomingRequests(
          filteredActivities
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map(activity => ({
              id: activity.activity_id,
              submissionDate: new Date(activity.created_at).toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
              activityName: activity.activity_name,
              organization: activity.organization?.org_name || "N/A",
              activityDate: activity.schedule?.[0]?.start_date
                ? new Date(activity.schedule[0].start_date).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })
                : "TBD",
              status: activity.final_status || "Pending",
            }))
        );

        setRequestsCounts((prevCounts) => ({
          ...prevCounts,
          forAppeal: forAppealCount,
          pending: pendingCount,
        }));
      } catch (error) {
        console.error("Error fetching incoming requests:", error);
        setRequestsError(error.message);
      } finally {
        setIncomingLoading(false);
      }
    };

    fetchIncomingRequests();
  }, []);

  // Fetch User Role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { data: account } = await supabase
            .from("account")
            .select("role_id")
            .eq("email", user.email)
            .single();

          if (account) {
            setUserRole(account.role_id);
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };
    fetchUserRole();
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
          .eq("final_status", "Approved");

        if (error) throw error;

        const approvedCount = data.filter(
          (activity) => activity.final_status?.toLowerCase() === "approved"
        ).length;

        let transformedEvents = [];
        data.forEach((activity) => {
          if (Array.isArray(activity.schedule)) {
            activity.schedule.forEach((sched) => {
              if (sched.is_recurring === "true" && sched.recurring_days) {
                const recurringDays = JSON.parse(sched.recurring_days);
                const dayMap = {
                  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
                };
                const start = new Date(sched.start_date);
                const end = new Date(sched.end_date);
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                  const dayName = Object.keys(dayMap).find(key => dayMap[key] === d.getDay());
                  if (recurringDays[dayName]) {
                    const startTime = sched.start_time
                      ? new Date(`1970-01-01T${sched.start_time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "00:00";
                    const endTime = sched.end_time
                      ? new Date(`1970-01-01T${sched.end_time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "00:00";
                    const categoryLabel = categoryMap[activity.activity_type] || "Others";
                    transformedEvents.push({
                      ...activity,
                      id: activity.activity_id + "_" + d.toISOString().slice(0, 10),
                      name: activity.activity_name,
                      time: `${startTime} to ${endTime}`,
                      location: activity.venue,
                      category: categoryLabel,
                      organization: activity.organization?.org_name,
                      date: d.toISOString().slice(0, 10),
                      is_recurring: "true",
                      recurring_days: sched.recurring_days,
                      schedule: [sched],
                    });
                  }
                }
              } else if (sched.start_date) {
                const startTime = sched.start_time
                  ? new Date(`1970-01-01T${sched.start_time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "00:00";
                const endTime = sched.end_time
                  ? new Date(`1970-01-01T${sched.end_time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "00:00";
                const categoryLabel = categoryMap[activity.activity_type] || "Others";
                transformedEvents.push({
                  ...activity,
                  id: activity.activity_id + "_" + sched.activity_schedule_id,
                  name: activity.activity_name,
                  time: `${startTime} to ${endTime}`,
                  location: activity.venue,
                  category: categoryLabel,
                  organization: activity.organization?.org_name,
                  date: sched.start_date,
                  is_recurring: "false",
                  schedule: [sched],
                });
              }
            });
          }
        });
        setEvents(transformedEvents);

        setRequestsCounts((prevCounts) => ({
          ...prevCounts,
          approved: approvedCount,
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

  useEffect(() => {
    const fetchPendingOrgRequests = async () => {
      try {
        setPendingStatsLoading(true);
        const { data, error } = await supabase
          .from("org_recognition")
          .select("*", { count: "exact" })
          .or(
            'and(sro_approved.is.null,odsa_approved.is.null),' +
            'and(sro_approved.eq.true,odsa_approved.is.null),' +
            'and(sro_approved.eq.true,odsa_approved.eq.false)'
          );

        if (error) throw error;
        setRequestsCounts((prevCounts) => ({
          ...prevCounts,
          pendingApplications: data.length,
        }));
      } catch (error) {
        console.error("Error fetching pending organization requests:", error);
      } finally {
        setPendingStatsLoading(false);
      }
    };

    fetchPendingOrgRequests();
  }, []);

  useEffect(() => {
    const fetchApprovedOrgRequests = async () => {
      try {
        setApprovedStatsLoading(true);
        const { data: approvedApplicationsData, error: approvedApplicationsError } = await supabase
          .from("org_recognition")
          .select("*", { count: "exact" })
          .eq("sro_approved", true)
          .eq("odsa_approved", true);

        if (approvedApplicationsError) throw approvedApplicationsError;
        setRequestsCounts((prevCounts) => ({
          ...prevCounts,
          approvedApplications: approvedApplicationsData.length,
        }));
      } catch (error) {
        console.error("Error fetching approved organization requests:", error);
      } finally {
        setApprovedStatsLoading(false);
      }
    };

    fetchApprovedOrgRequests();
  }, []);

  useEffect(() => {
    const fetchAnnualReports = async () => {
      try {
        setReportsStatsLoading(true);
        const currentYear = new Date().getFullYear();
        const { data, error } = await supabase
          .from("org_annual_report")
          .select("*", { count: "exact" })
          .ilike("academic_year", `%${currentYear}`);

        if (error) throw error;
        setRequestsCounts((prevCounts) => ({
          ...prevCounts,
          annualReports: data.length,
        }));
      } catch (error) {
        console.error("Error fetching annual reports:", error);
      } finally {
        setReportsStatsLoading(false);
      }
    };

    fetchAnnualReports();
  }, []);

  const handleViewDetails = async (request) => {
    setModalLoading(true);
    setIsModalOpen(true);
    setSelectedActivity(null);

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
      setSelectedActivity(request);
    } else {
      setSelectedActivity(data);
    }
    setModalLoading(false);
  };

  // Handle event click from WeeklyCalendar
  const handleEventClick = async (event) => {
    setModalLoading(true);
    setIsModalOpen(true);
    setSelectedActivity(null);

    const activityId = String(event.id).split("_")[0];
    const { data, error } = await supabase
      .from("activity")
      .select(`
        *,
        account:account(*),
        schedule:activity_schedule(*),
        organization:organization(*)
      `)
      .eq("activity_id", activityId)
      .single();

    if (error) {
      console.error("Failed to fetch activity details:", error);
      setSelectedActivity(event);
    } else {
      setSelectedActivity(data);
    }
    setModalLoading(false);
  };

  // Handle more activities click - navigate to admin calendar with selected date
  const handleMoreActivitiesClick = (date) => {
    navigate('/admin/activities-calendar', { state: { selectedDate: new Date(date).toISOString() } });
  };

  // Consolidate loading states
  const isPageLoading = loading || incomingLoading || pendingStatsLoading || approvedStatsLoading || reportsStatsLoading;

  if (isPageLoading) {
    return <LoadingSpinner text="Loading dashboard..." variant="section" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex flex-col md:flex-row flex-wrap w-full max-w-[1600px] mx-auto p-4 sm:p-6 gap-6 min-h-[80vh]">
        <main className="flex-1 min-w-0 flex flex-col gap-6 w-full">
          {/* Summary of Submissions */}
          <section>
            {/* Greeting Section */}
            <Card className="shadow-sm px-6 py-4 mb-6 bg-white border border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-sro-primary">
                    Admin Dashboard
                  </h2>
                  <p className="text-sm text-gray-500">
                    Here's an overview of the organization activities and requests.
                  </p>
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-lg font-semibold text-sro-primary">
                    {new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </Card>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {statsSummary.map((stat, index) => (
                <Link
                  to={stat.path || "#"}
                  key={index}
                  className={`group block p-4 bg-white border border-gray-200 rounded-xl shadow-sm relative hover:shadow-md transition-all duration-200 h-full min-h-[140px] flex flex-col justify-between ${!stat.path ? 'cursor-default pointer-events-none' : ''}`}
                >
                  <div className={`p-2 rounded-lg w-fit bg-sro-bg-off-white self-end`}>
                    <stat.icon className={`w-6 h-6 text-sro-primary`} />
                  </div>
                  <div>
                    <h3 className="text-3xl sm:text-4xl font-bold mb-1 text-sro-primary truncate w-full group-hover:opacity-80 transition-opacity">{stat.count}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium leading-tight">{stat.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Two Column Responsive Section */}
          <section className="flex flex-col lg:flex-row gap-6 min-w-0">
            {/* Left: Incoming Activity Requests */}
            <div className="flex-1 min-w-0">
              <Card className="shadow-sm flex flex-col h-auto lg:h-full">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="text-xl font-bold text-sro-primary flex items-center gap-2">
                    Incoming Activity Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 min-w-0 flex flex-col relative overflow-hidden">
                  <div className="w-full flex-1 p-2 flex flex-col h-full overflow-hidden">
                    {requestsError ? (
                      <div className="text-center py-4 text-red-500">
                        Error loading requests: {requestsError}
                      </div>
                    ) : (
                      <DataTable
                        columns={[
                          { key: "submissionDate", header: "Date", sortable: true, width: "w-[12%]", cellClassName: "truncate max-w-[80px]" },
                          { key: "activityName", header: "Activity Name", sortable: true, width: "w-[28%]", cellClassName: "truncate max-w-[150px]" },
                          { key: "organization", header: "Organization", sortable: true, width: "w-[25%]", cellClassName: "truncate max-w-[120px] font-medium text-sro-primary" },
                          { key: "activityDate", header: "Activity Date", sortable: true, width: "w-[15%]", cellClassName: "truncate max-w-[90px]" },
                          { key: "status", header: "Status", isStatus: true, width: "w-[20%]" }
                        ]}
                        data={incomingRequests}
                        onRowClick={handleViewDetails}
                        emptyMessage="No incoming requests found."
                        defaultPageSize={15}
                        hidePageSize={true}
                        hideViewToggle={true}
                        preventHorizontalScroll={true}
                        compactStatus={true}
                        defaultSort={{ key: "submissionDate", direction: "desc" }}
                        className="h-full flex flex-col text-sm"
                      />
                    )}
                  </div>
                  <div className="flex justify-center mt-auto border-t pt-4 pb-4">
                    <Link to="/admin/student-activities">
                      <Button className="bg-sro-secondary hover:bg-sro-secondary/90 text-white text-sm flex items-center gap-1">
                        See More <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Activities Calendar - Unified Component */}
            <div className="flex-1 min-w-0">
              <WeeklyCalendar
                events={events}
                loading={false}
                onEventClick={handleEventClick}
                calendarLink="/admin/activities-calendar"
                onMoreActivitiesClick={handleMoreActivitiesClick}
              />
            </div>
          </section>
        </main>
      </div>

      {/* Activity Details Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {modalLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <LoadingSpinner text="Loading details..." variant="section" />
          </div>
        ) : (
          selectedActivity && (
            <ActivityDialogContent
              activity={selectedActivity}
              setActivity={setSelectedActivity}
              isModalOpen={isModalOpen}
              readOnly={false}
              userRole={userRole}
            />
          )
        )}
      </Dialog>
    </div >
  );
};

export default AdminPanel;