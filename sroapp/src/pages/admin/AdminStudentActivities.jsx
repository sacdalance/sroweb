import { useEffect, useState, useMemo } from "react";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";
import supabase from "@/lib/supabase";
import { API_BASE_URL } from "@/lib/api-config";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";
import { toast, Toaster } from "sonner";
import { approveActivity, rejectActivity } from "@/api/approveRejectRequestAPI";
import LoadingSpinner from "@/components/ui/loading-spinner";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import CustomCalendar from "@/components/ui/custom-calendar";
import { isSameDay, format } from "date-fns";

const activityTypeOptions = [
  { id: "charitable", label: "Charitable" },
  { id: "serviceWithinUPB", label: "Service within UPB" },
  { id: "serviceOutsideUPB", label: "Service outside UPB" },
  { id: "contestWithinUPB", label: "Contest within UPB" },
  { id: "contestOutsideUPB", label: "Contest outside UPB" },
  { id: "educational", label: "Educational" },
  { id: "incomeGenerating", label: "Income-Generating Project" },
  { id: "massOrientation", label: "Mass Orientation/General Assembly" },
  { id: "booth", label: "Booth" },
  { id: "rehearsals", label: "Rehearsals/Preparation" },
  { id: "specialEvents", label: "Special Events" },
  { id: "others", label: "Others" },
];

const getDerivedStatus = (activity) => {
  if (activity.final_status === "Approved") return "Approved";
  if (activity.final_status === "Rejected") return "Rejected";
  if (activity.final_status === "For Appeal") return "For Appeal";
  if (activity.final_status === "For Cancellation") return "For Cancellation";
  if (activity.sro_approval_status === "Approved" && !activity.odsa_approval_status) return "Pending ODSA";
  if (!activity.sro_approval_status) return "Pending SRO";
  return "Unknown";
};

const AdminPendingRequests = ({ userRole: initialUserRole }) => {
  const [loading, setLoading] = useState(true);
  const [superadminView, setSuperadminView] = useState('sro');
  const [tab, setTab] = useState("requests");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [userRole, setUserRole] = useState(initialUserRole || null);
  const [activities, setActivities] = useState([]);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);
  const [showRequests, setShowRequests] = useState(false);
  const [showRecurring, setShowRecurring] = useState(true);

  // Helper to extract unique options for filters
  const getUniqueOrgOptions = (data) => {
    return [...new Set(data.map(a => a.organization?.org_name || "Unknown"))].sort();
  };

  // Helper to format dates safely
  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getActivityTypeLabel = (id) => {
    return activityTypeOptions.find((opt) => opt.id === id)?.label || id;
  };

  const columns = [
    {
      key: "created_at",
      header: "Submission Date",
      sortable: true,
      width: "w-[15%]",
      sortAccessor: (row) => new Date(row.created_at).getTime(),
      render: (row) => <span className="text-gray-600 font-medium">{formatDate(row.created_at)}</span>
    },
    {
      key: "activity_name",
      header: "Activity Title",
      sortable: true,
      width: "w-[30%]",
      render: (row) => (
        <span className="font-medium text-sro-primary block truncate max-w-[200px] xl:max-w-[300px] mx-auto" title={row.activity_name}>
          {row.activity_name}
        </span>
      )
    },
    {
      key: "organization",
      header: "Organization",
      sortable: true,
      filterable: true,
      width: "w-[25%]",
      filterOptions: getUniqueOrgOptions(activities),
      filterAccessor: (row) => row.organization?.org_name || "Unknown",
      sortAccessor: (row) => row.organization?.org_name || "Unknown",
      render: (row) => <span className="font-medium text-gray-700 block truncate mx-auto" title={row.organization?.org_name || "Unknown"}>{row.organization?.org_name || "Unknown"}</span>
    },
    {
      key: "schedule",
      header: "Activity Date",
      sortable: true,
      width: "w-[15%]",
      sortAccessor: (row) => row.schedule?.[0]?.start_date || "",
      render: (row) => <span className="text-gray-600 font-medium">{formatDate(row.schedule?.[0]?.start_date)}</span>
    },
    {
      key: "activity_type",
      header: "Activity Type",
      sortable: true,
      filterable: true,
      width: "w-[15%]",
      filterOptions: activityTypeOptions.map(o => o.label),
      filterAccessor: (row) => getActivityTypeLabel(row.activity_type),
      render: (row) => (
        <span className="block truncate mx-auto" title={getActivityTypeLabel(row.activity_type)}>
          {getActivityTypeLabel(row.activity_type)}
        </span>
      )
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      filterable: true,
      width: "w-[15%]",
      isStatus: true,
      filterOptions: ["Pending SRO", "Pending ODSA", "Approved", "Rejected", "For Appeal", "For Cancellation"],
      filterAccessor: (row) => row.status,
      render: (row) => (
        <div className="flex justify-center">
          <StatusPill status={row.status} />
        </div>
      )
    }
  ];

  useEffect(() => {
    if (userRole) return;

    const fetchRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: { user } } = await supabase.auth.getUser();
      const { data: account, error } = await supabase
        .from("account")
        .select("role_id")
        .eq("email", user.email)
        .single();

      if (error) {
        console.error("Error fetching role:", error);
      } else {
        setUserRole(account?.role_id);
      }
    };

    fetchRole();
  }, [userRole]);

  const refreshSelectedActivity = async (id) => {
    const { data, error } = await supabase
      .from("activity")
      .select(`
      *,
      account:account (*),
      schedule:activity_schedule(*),
      organization:organization(*)
    `)
      .eq("activity_id", id)
      .single();

    if (error) {
      console.error("Failed to refresh activity:", error);
    } else {
      setSelectedActivity(data);
    }
  };

  // Fetch ALL activities
  const fetchAllActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("activity")
        .select(`
            *,
            organization:organization(*),
            schedule:activity_schedule(*),
            account:account(email)
          `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // --- Auto-Reject Elapsed Activities ---
      const today = new Date().toISOString().split('T')[0];
      const autoRejectReason = 'Activity date has elapsed without approval. Please submit a new request if you wish to reschedule.';
      const expiredActivities = data.filter(activity => {
        const isNotFinal = activity.final_status !== 'Approved' && activity.final_status !== 'Rejected';
        const startDate = activity.schedule?.[0]?.start_date;
        return isNotFinal && startDate && startDate < today;
      });

      if (expiredActivities.length > 0) {
        const expiredIds = expiredActivities.map(a => a.activity_id);

        const { error: updateError } = await supabase
          .from('activity')
          .update({
            final_status: 'Rejected',
            sro_approval_status: 'Rejected',
            odsa_approval_status: 'Rejected',
            sro_remarks: autoRejectReason
          })
          .in('activity_id', expiredIds);

        if (!updateError) {
          toast.info(`Auto-rejected ${expiredActivities.length} activity(ies) due to elapsed dates.`);

          expiredActivities.forEach(a => {
            a.final_status = 'Rejected';
            a.sro_approval_status = 'Rejected';
            a.sro_remarks = autoRejectReason;
          });

          // Send email notifications (fire-and-forget)
          expiredActivities.forEach(activity => {
            const orgName = activity.organization?.org_name || 'Organization';
            const activityName = activity.activity_name;
            const venue = activity.venue;
            const schedule = activity.schedule?.[0];
            let displayDate = 'Date TBD';
            if (schedule?.start_date) {
              displayDate = new Date(schedule.start_date).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              });
            }

            const recipientEmail = activity.account?.email;
            if (recipientEmail) {
              fetch(`${API_BASE_URL}/api/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: recipientEmail,
                  subject: `Activity Auto-Rejected - ${activityName}`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                      <p>Dear <strong>${orgName}</strong>,</p>
                      <p>We regret to inform you that your request to hold "<strong>${activityName}</strong>", at "<strong>${venue}</strong>", on "<strong>${displayDate}</strong>" has been <strong>automatically rejected</strong>.</p>
                      <p><strong>Reason:</strong> ${autoRejectReason}</p>
                      <p>Take note of your Activity Form Id: <strong>#${activity.activity_id}</strong>.</p>
                      <p><strong>REMINDER: This is an automated e-mail. Kindly do not reply to this e-mail.</strong></p>
                      <p>Thank you,<br>
                      <small><i>Yours in honour, excellence and service,</i></small><br><br>
                      <strong>Office of Student Affairs | Student Relations Office<br>
                      E-mail: sro.upbaguio@up.edu.ph</strong></p>
                    </div>
                  `
                })
              }).catch(e => console.error('Failed to send auto-reject email:', e));
            }
          });
        } else {
          console.error('Auto-reject update failed', updateError);
        }
      }

      // Process and Filter
      let processed = data.map(a => ({
        ...a,
        status: getDerivedStatus(a)
      }));

      // Apply ODSA Role Filters
      if (userRole === 3 || (userRole === 4 && superadminView === 'odsa')) {
        processed = processed.filter(a =>
          ["Pending ODSA", "Approved", "Rejected"].includes(a.status)
        );
      }

      setActivities(processed);

    } catch (error) {
      console.error("Failed to fetch activities:", error);
      toast.error("Failed to load activities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole) {
      fetchAllActivities();
    }
  }, [userRole, superadminView]);

  const handleViewDetails = async (activity) => {
    const { data, error } = await supabase
      .from("activity")
      .select(`
      *,
      account:account (*),
      schedule:activity_schedule(*),
      organization:organization(*)
    `)
      .eq("activity_id", activity.activity_id)
      .single();

    if (error) {
      console.error("Failed to fetch latest activity:", error);
      toast.error("Something went wrong loading this activity.");
      return;
    }

    setSelectedActivity(data);
    setIsModalOpen(true);
  };

  const handleApprove = async (comment, activityId) => {
    if (!activityId || !userRole) {
      console.error("Missing activityId or userRole.");
      throw new Error("Activity or role not ready.");
    }

    await approveActivity(activityId, comment, userRole);
    await refreshSelectedActivity(activityId);
  };

  const handleReject = async (comment, activityId) => {
    if (!activityId || !userRole) {
      console.error("Missing activityId or userRole.");
      throw new Error("Activity or role not ready.");
    }

    await rejectActivity(activityId, comment, userRole);
    await refreshSelectedActivity(activityId);
  };

  // --- Calendar Helpers ---
  const getEventColor = (category, event) => {
    const status = event?.status;
    // Check explicit isRecurring flag - use orange like ActivitiesCalendar
    if (event?.isRecurring) return 'bg-orange-200 text-orange-800 border border-orange-400';
    if (status === 'Approved') return 'bg-sro-secondary text-white';
    if (status === 'Pending SRO' || status === 'Pending ODSA') return 'bg-gray-100 text-gray-700 border border-gray-300';
    if (status === 'For Appeal') return 'bg-amber-100 text-amber-700 border border-amber-300';
    if (status === 'Rejected') return 'bg-red-100 text-sro-primary border border-sro-primary';
    return 'bg-blue-100 text-blue-700';
  };

  const handleCalendarDateSelect = (dateOrEvent) => {
    const date = dateOrEvent instanceof Date ? dateOrEvent : (dateOrEvent.date ? new Date(dateOrEvent.date) : null);
    if (date) {
      if (selectedDateFilter && isSameDay(date, selectedDateFilter)) {
        setSelectedDateFilter(null);
      } else {
        setSelectedDateFilter(date);
      }
    }
  };

  // Transform activities for calendar view
  const calendarEvents = useMemo(() => {
    return activities.filter(activity => {
      // Check if has any recurring schedule
      const hasRecurring = activity.schedule?.some(s => s.is_recurring);

      // Filter out recurring if showRecurring is off
      if (!showRecurring && hasRecurring) return false;

      // Always show approved activities
      if (activity.status === 'Approved') return true;
      // Show requests if toggle is on
      if (showRequests) return ['Pending SRO', 'Pending ODSA', 'For Appeal'].includes(activity.status);
      return false;
    }).flatMap(activity => {
      // Transform each activity schedule into calendar events
      if (!activity.schedule || activity.schedule.length === 0) return [];

      const events = [];

      activity.schedule.forEach(sched => {
        // Check if this schedule is recurring
        if (sched.is_recurring && sched.recurring_days) {
          // Parse recurring_days if it's a string
          const recurringDays = typeof sched.recurring_days === 'string'
            ? JSON.parse(sched.recurring_days)
            : sched.recurring_days;

          const start = new Date(sched.start_date);
          const end = new Date(sched.end_date);

          // Loop through each day from start to end
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
            if (recurringDays[dayName]) {
              events.push({
                ...activity,
                date: new Date(d).toISOString().split('T')[0],
                title: activity.activity_name,
                category: activity.activity_type,
                isRecurring: true,
                recurringStartDate: sched.start_date,
                recurringEndDate: sched.end_date,
              });
            }
          }
        } else {
          // Non-recurring: single event
          events.push({
            ...activity,
            date: sched.start_date,
            title: activity.activity_name,
            category: activity.activity_type,
            isRecurring: false,
          });
        }
      });

      return events;
    });
  }, [activities, showRequests, showRecurring]);

  const filteredCalendarList = useMemo(() => {
    if (!selectedDateFilter) return [];
    return calendarEvents.filter(event => isSameDay(new Date(event.date), selectedDateFilter));
  }, [calendarEvents, selectedDateFilter]);

  if (!userRole) {
    return <LoadingSpinner text="Checking User Role..." variant="fullscreen" />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-[1600px]">
      <Toaster />
      <h1 className="page-header text-sro-primary mb-6">Student Activities</h1>

      {userRole === 4 && (
        <div className="flex justify-end mb-4">
          <div className="bg-white border rounded-lg p-1 inline-flex shadow-sm">
            <button
              onClick={() => setSuperadminView('sro')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${superadminView === 'sro' ? 'bg-sro-primary text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              SRO View
            </button>
            <button
              onClick={() => setSuperadminView('odsa')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${superadminView === 'odsa' ? 'bg-sro-primary text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              ODSA View
            </button>
          </div>
        </div>
      )}

      <Tabs
        defaultValue="requests"
        className="w-full mb-8"
        onValueChange={setTab}
      >
        <TabsList className="mb-6 bg-gray-100 p-1 rounded-lg inline-flex flex-wrap h-auto justify-center md:justify-start w-full md:w-auto">
          <TabsTrigger
            value="requests"
            className="px-4 py-2 text-sm font-medium flex-1 md:flex-none data-[state=active]:bg-white data-[state=active]:text-sro-primary data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Activity Requests
          </TabsTrigger>
          <TabsTrigger
            value="activities"
            className="px-4 py-2 text-sm font-medium flex-1 md:flex-none data-[state=active]:bg-white data-[state=active]:text-sro-primary data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card className="rounded-lg overflow-hidden shadow-sm border-0">
            <CardContent className="p-4">
              {loading ? (
                <LoadingSpinner text="Loading activity requests..." variant="section" />
              ) : (
                <DataTable
                  columns={columns}
                  data={activities}
                  onRowClick={handleViewDetails}
                  emptyMessage="No activity requests found."
                  viewMode="table"
                  hideViewToggle={true}
                  className="border-none shadow-none"
                  defaultSort={{ key: "created_at", direction: "desc" }}
                  preventHorizontalScroll={false}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          {/* Calendar Tab Content - Matching AdminAppointmentSettings layout */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 px-1">
            <div className="flex gap-2 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-sro-secondary" /> <span className="text-[10px] sm:text-xs">Approved</span></div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-orange-400" /> <span className="text-[10px] sm:text-xs">Recurring</span></div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gray-300" /> <span className="text-[10px] sm:text-xs">Pending</span></div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-300" /> <span className="text-[10px] sm:text-xs">For Appeal</span></div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-md shadow-sm border text-xs sm:text-sm">
                <input type="checkbox" checked={showRecurring} onChange={(e) => setShowRecurring(e.target.checked)} className="rounded text-sro-primary focus:ring-sro-primary w-3.5 h-3.5" />
                <span className="font-medium">Recurring</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-md shadow-sm border text-xs sm:text-sm">
                <input type="checkbox" checked={showRequests} onChange={(e) => setShowRequests(e.target.checked)} className="rounded text-sro-primary focus:ring-sro-primary w-3.5 h-3.5" />
                <span className="font-medium">Requests</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-lg shadow border p-4">
              <CustomCalendar
                mode="activities"
                currentMonth={currentDate}
                onMonthChange={setCurrentDate}
                onDateSelect={handleCalendarDateSelect}
                selectedDate={selectedDateFilter}
                events={calendarEvents}
                getEventColor={getEventColor}
              />
            </div>
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader><CardTitle className="text-lg">{selectedDateFilter ? `Activities on ${format(selectedDateFilter, 'MMM d, yyyy')}` : 'Select a date'}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {selectedDateFilter ? (
                    <div className="space-y-3">
                      {filteredCalendarList.length > 0 ? filteredCalendarList.map(activity => (
                        <div key={`${activity.activity_id}-${activity.date}`} onClick={() => handleViewDetails(activity)} className="p-3 bg-gray-50 border rounded-md cursor-pointer hover:bg-white hover:shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2">
                            <span className="font-semibold text-sro-primary text-sm line-clamp-2" title={activity.activity_name}>{activity.activity_name}</span>
                            <StatusPill status={activity.status} compact />
                          </div>
                          <div className="text-xs text-gray-600 flex flex-col gap-1">
                            <div className="truncate"><span className="font-medium">Organization:</span> {activity.organization?.org_name || 'Unknown'}</div>
                            <div className="truncate"><span className="font-medium">Venue:</span> {activity.venue || 'TBD'}</div>
                            <div className="truncate"><span className="font-medium">Type:</span> {getActivityTypeLabel(activity.activity_type)}</div>
                            {activity.isRecurring && <div className="text-orange-700 font-medium">Recurring: {format(new Date(activity.recurringStartDate), 'MMM d')} - {format(new Date(activity.recurringEndDate), 'MMM d, yyyy')}</div>}
                          </div>
                        </div>
                      )) : <div className="text-center py-8 text-gray-400 text-sm">No activities scheduled for this date.</div>}
                    </div>
                  ) : <div className="text-center py-12 text-gray-400 text-sm">Click on a date in the calendar to view scheduled activities.</div>}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Activity Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {selectedActivity && (
          <ActivityDialogContent
            activity={selectedActivity}
            setActivity={setSelectedActivity}
            isModalOpen={isModalOpen}
            userRole={userRole}
            handleApprove={handleApprove}
            handleReject={handleReject}
            readOnly={false}
          />
        )}
      </Dialog>
    </div >
  );
};

export default AdminPendingRequests;