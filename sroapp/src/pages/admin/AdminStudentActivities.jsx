import { useEffect, useState, useMemo } from "react";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";
import supabase from "@/lib/supabase";
import { API_BASE_URL, authFetch } from "@/lib/api-config";
import { useAuth } from "@/context/UserAuthContext";
import { createNotification } from "@/lib/notifications";
import ActionButtons from "@/components/ui/ActionButtons";
import CalendarWithSidePanel from "@/components/ui/CalendarWithSidePanel";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";
import { toast, Toaster } from "sonner";
import { approveActivity, rejectActivity } from "@/api/approveRejectRequestAPI";
import { generateApprovalSlips } from "@/api/adminActivityAPI";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { TableSkeleton, CalendarSkeleton } from "@/components/ui/skeletons";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import CustomCalendar from "@/components/ui/custom-calendar";
import { Badge } from "@/components/ui/badge";
import { isSameDay, format } from "date-fns";
import { Database, ClipboardList, FileText } from "lucide-react";

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
  if (!activity.adviser_approval_status || activity.adviser_approval_status === "Pending") return "Pending Adviser";
  if (activity.adviser_approval_status === "Approved" && (!activity.sro_approval_status || activity.sro_approval_status === "Pending")) return "Pending SRO";
  if (activity.sro_approval_status === "Approved" && (!activity.odsa_approval_status || activity.odsa_approval_status === "Pending")) return "Pending ODSA";
  return "Unknown";
};

const AdminPendingRequests = () => {
  const [loading, setLoading] = useState(true);
  const [superadminView, setSuperadminView] = useState('sro');
  const [tab, setTab] = useState("requests");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const { role: userRole, email: userEmail } = useAuth();
  const [activities, setActivities] = useState([]);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);
  const [showRequests, setShowRequests] = useState(false);
  const [showRecurring, setShowRecurring] = useState(true);

  // Activity Summary State
  const [generatingPDFs, setGeneratingPDFs] = useState(false);

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
      accessor: (row) => row.organization?.org_name || "Unknown",
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
      accessor: (row) => getActivityTypeLabel(row.activity_type),
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
      filterOptions: ["Pending Adviser", "Pending SRO", "Pending ODSA", "Approved", "Rejected", "For Appeal", "For Cancellation"],
      filterAccessor: (row) => row.status,
      render: (row) => (
        <div className="flex justify-center">
          <StatusPill status={row.status} />
        </div>
      )
    }
  ];

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

      let query = supabase
        .from("activity")
        .select(`
            *,
            organization:organization(*),
            schedule:activity_schedule(*),
            account:account(email)
          `)
        .order('created_at', { ascending: false });

      // Adviser (role 5): only fetch activities from orgs they advise
      if (userRole === 5 && userEmail) {
        const { data: adviserOrgs, error: orgError } = await supabase
          .from("organization")
          .select("org_id")
          .eq("adviser_email", userEmail);

        if (orgError) {
          console.error("Error fetching adviser orgs:", orgError);
        } else {
          const orgIds = adviserOrgs.map(o => o.org_id);
          if (orgIds.length > 0) {
            query = query.in("org_id", orgIds);
          } else {
            // Adviser has no orgs assigned - show nothing
            setActivities([]);
            setLoading(false);
            return;
          }
        }
      }

      const { data, error } = await query;

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
              authFetch(`${API_BASE_URL}/api/send-email`, {
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

            // In-app notification for auto-rejection
            if (activity.account_id) {
              createNotification({
                recipientId: activity.account_id,
                type: 'activity_auto_rejected',
                title: 'Activity auto-rejected',
                message: `"${activity.activity_name}" was automatically rejected because the activity date has elapsed.`,
                referenceType: 'activity',
                referenceId: activity.activity_id,
              });
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

      // Apply Adviser View Filter (superadmin sees all orgs, but same status filtering)
      if (userRole === 4 && superadminView === 'adviser') {
        processed = processed.filter(a =>
          ["Pending Adviser", "Approved", "Rejected"].includes(a.status)
        );
      }

      // Apply SRO Role Filters (only see adviser-endorsed + final activities)
      if (userRole === 2 || (userRole === 4 && superadminView === 'sro')) {
        processed = processed.filter(a =>
          a.adviser_approval_status === "Approved" ||
          ["Approved", "Rejected"].includes(a.status)
        );
      }

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

  // --- Activity Summary Helpers ---
  const handleGenerateApprovalSlips = async () => {
    try {
      setGeneratingPDFs(true);
      const result = await generateApprovalSlips();
      toast.success(`Successfully generated ${result.pdfCount} approval slip PDFs!`);
      // Refresh activities to update slip_status
      await fetchAllActivities();
    } catch (error) {
      console.error('Error generating approval slips:', error);
      toast.error(`Failed to generate approval slips: ${error.message}`);
    } finally {
      setGeneratingPDFs(false);
    }
  };

  const handleViewPDFsInDrive = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/approval-slips-folder-url`, {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to get folder URL');
      const { folderUrl } = await response.json();
      window.open(folderUrl, '_blank');
      toast.success('Opening Google Drive folder...');
    } catch (error) {
      toast.error('Failed to open Google Drive folder.');
    }
  };

  // Summary counts and filtered activities
  const summaryActivities = useMemo(() => {
    return activities.filter(a => a.final_status === 'Approved');
  }, [activities]);

  const needsSlipCount = summaryActivities.filter(a => a.slip_status !== 'printed' && a.slip_status !== 'ready_for_pickup').length;
  const printedCount = summaryActivities.filter(a => a.slip_status === 'printed').length;

  // --- Calendar Helpers ---
  const getEventColor = (category, event) => {
    const status = event?.status;
    let classes = '';

    if (status === 'Approved') classes = 'bg-sro-secondary text-white';
    else if (status === 'Pending Adviser' || status === 'Pending SRO' || status === 'Pending ODSA') classes = 'bg-gray-100 text-gray-700 border border-gray-300';
    else if (status === 'For Appeal') classes = 'bg-amber-100 text-amber-700 border border-amber-300';
    else if (status === 'Rejected') classes = 'bg-red-100 text-sro-primary border border-sro-primary';
    else classes = 'bg-blue-100 text-blue-700';

    if (event?.isRecurring) {
      // Override border with orange highlight for recurring
      classes += ' border-2 border-orange-500';
    }

    return classes;
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


      // Always show approved activities
      if (activity.status === 'Approved') return true;
      // Show requests if toggle is on
      if (showRequests) return ['Pending Adviser', 'Pending SRO', 'Pending ODSA', 'For Appeal'].includes(activity.status);
      return false;
    }).flatMap(activity => {
      // Transform each activity schedule into calendar events
      if (!activity.schedule || activity.schedule.length === 0) return [];

      const events = [];

      activity.schedule.forEach(sched => {
        // Check if this schedule is recurring
        if (sched.is_recurring && sched.recurring_days) {
          // If recurring is hidden, skip this schedule entirely
          if (!showRecurring) return;

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
    return <TableSkeleton />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-[1600px]">
      <Toaster />

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b pb-6">
        <div>
          <h1 className="page-header text-sro-primary mb-0">Student Activities</h1>

        </div>
        <div className="flex items-center gap-3">
        </div>
      </div>

      {userRole === 4 && (
        <div className="flex justify-end mb-4">
          <div className="bg-white border rounded-lg p-1 inline-flex shadow-sm">
            <button
              onClick={() => setSuperadminView('adviser')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${superadminView === 'adviser' ? 'bg-sro-primary text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              Adviser View
            </button>
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
        <TabsList className="mb-6">
          <TabsTrigger value="requests">Activity Requests</TabsTrigger>
          <TabsTrigger value="activities">Calendar</TabsTrigger>
          <TabsTrigger value="summary">Activity Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card className="rounded-lg overflow-hidden shadow-sm border-0">
            <CardContent className="p-4">
              {loading ? (
                <TableSkeleton />
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
                  defaultFilters={{ status: (userRole === 3 || (userRole === 4 && superadminView === 'odsa')) ? "Pending ODSA" : "Pending SRO" }}
                  preventHorizontalScroll={false}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          {/* Calendar Tab Content - Matching AdminAppointmentSettings layout */}

          <CalendarWithSidePanel
            currentDate={currentDate}
            onMonthChange={setCurrentDate}
            selectedDate={selectedDateFilter}
            onDateSelect={(date) => {
              if (selectedDateFilter && isSameDay(date, selectedDateFilter)) {
                setSelectedDateFilter(null);
              } else {
                handleCalendarDateSelect(date);
              }
            }}
            events={calendarEvents}
            getEventColor={getEventColor}
            sidePanelTitle={selectedDateFilter ? `Activities on ${format(selectedDateFilter, 'MMM d, yyyy')}` : 'Select a date'}
            legendItems={[
              { label: "Approved", colorClass: "text-sro-secondary", indicatorClass: "bg-sro-secondary" },
              { label: "Pending", colorClass: "text-gray-700", indicatorClass: "bg-gray-300" },
              { label: "For Reschedule", colorClass: "text-amber-700", indicatorClass: "bg-amber-300" },
              { label: "Recurring", colorClass: "text-sro-secondary", indicatorClass: "bg-sro-secondary border-2 border-orange-500" },
            ]}
            filters={[
              { label: "Recurring", checked: showRecurring, onChange: setShowRecurring },
              { label: "Requests", checked: showRequests, onChange: setShowRequests },
            ]}
            renderSidePanel={(date) => (
              <div className="space-y-3">
                {filteredCalendarList.length > 0 ? filteredCalendarList.map(activity => (
                  <div key={`${activity.activity_id}-${activity.date}`} onClick={() => handleViewDetails(activity)} className="p-3 bg-white border rounded-lg cursor-pointer hover:border-sro-primary/50 hover:shadow-sm transition-all group">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2">
                      <span className="font-semibold text-sro-primary text-sm line-clamp-2 leading-tight group-hover:underline decoration-sro-primary/30 underline-offset-2" title={activity.activity_name}>{activity.activity_name}</span>
                      <StatusPill status={activity.status} compact />
                    </div>
                    <div className="text-xs text-gray-500 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">Org:</span> <span className="truncate max-w-[150px]">{activity.organization?.org_name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">Proposed Venue:</span> <span className="truncate max-w-[150px]">{activity.venue || 'TBD'}</span>
                      </div>
                      {activity.isRecurring && (
                        <div className="text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded w-fit font-medium">
                          Recurring: {format(new Date(activity.recurringStartDate), 'MMM d')} - {format(new Date(activity.recurringEndDate), 'MMM d')}
                        </div>
                      )}
                    </div>
                  </div>
                )) : <div className="text-center py-8 text-gray-400 text-sm">No activities scheduled for this date.</div>}
              </div>
            )}
          />
        </TabsContent>

        {/* Activity Summary Tab */}
        <TabsContent value="summary">
          <Card className="rounded-lg overflow-hidden shadow-sm border-0">
            <CardContent className="p-4">
              {/* Summary DataTable */}
              {loading ? (
                <CalendarSkeleton />
              ) : (
                <DataTable
                  actionButtons={
                    <>
                      <Button
                        onClick={handleViewPDFsInDrive}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <svg className="h-4 w-4 text-sro-primary" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6.5 2C4.57 2 3 3.57 3 5.5S4.57 9 6.5 9H10l3-5.5H6.5zm7.5 5.5L11 13h9.5c1.93 0 3.5-1.57 3.5-3.5S22.43 6 20.5 6H14zM7 14l-3 5.5h7L14 14H7z" />
                        </svg>
                        Drive Folder
                      </Button>
                      <Button
                        onClick={handleGenerateApprovalSlips}
                        disabled={generatingPDFs || needsSlipCount === 0}
                        size="sm"
                        className="bg-sro-primary hover:bg-sro-primary/90 gap-2"
                      >
                        {generatingPDFs ? (
                          <LoadingSpinner variant="inline" className="text-white" />
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            Generate Slips ({needsSlipCount})
                          </>
                        )}
                      </Button>
                    </>
                  }
                  columns={[
                    {
                      key: "created_at",
                      header: "Submission Date",
                      sortable: true,
                      width: "w-[12%]",
                      render: (row) => (
                        <span className="text-gray-600 font-medium">
                          {new Date(row.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      ),
                    },
                    {
                      key: "activity_name",
                      header: "Activity Title",
                      sortable: true,
                      width: "w-[25%]",
                      render: (row) => (
                        <span className="font-medium text-sro-primary block truncate mx-auto" title={row.activity_name}>
                          {row.activity_name}
                        </span>
                      ),
                    },
                    {
                      key: "organization",
                      header: "Organization",
                      sortable: true,
                      filterable: true,
                      width: "w-[20%]",
                      filterOptions: getUniqueOrgOptions(summaryActivities),
                      filterAccessor: (row) => row.organization?.org_name || "Unknown",
                      sortAccessor: (row) => row.organization?.org_name || "Unknown",
                      accessor: (row) => row.organization?.org_name || "Unknown",
                      render: (row) => (
                        <span className="font-medium text-gray-700 block truncate mx-auto" title={row.organization?.org_name || "Unknown"}>
                          {row.organization?.org_name || "Unknown"}
                        </span>
                      ),
                    },
                    {
                      key: "schedule",
                      header: "Activity Date",
                      sortable: true,
                      width: "w-[12%]",
                      sortAccessor: (row) => row.schedule?.[0]?.start_date || "",
                      render: (row) => (
                        <span className="text-gray-600 font-medium">
                          {formatDate(row.schedule?.[0]?.start_date)}
                        </span>
                      ),
                    },
                    {
                      key: "activity_type",
                      header: "Activity Type",
                      sortable: true,
                      filterable: true,
                      width: "w-[15%]",
                      filterOptions: activityTypeOptions.map(o => o.label),
                      filterAccessor: (row) => getActivityTypeLabel(row.activity_type),
                      accessor: (row) => getActivityTypeLabel(row.activity_type),
                      render: (row) => (
                        <span className="block truncate mx-auto" title={getActivityTypeLabel(row.activity_type)}>
                          {getActivityTypeLabel(row.activity_type)}
                        </span>
                      ),
                    },
                    {
                      key: "slip_status",
                      header: "Slip Status",
                      sortable: true,
                      filterable: true,
                      width: "w-[12%]",
                      isStatus: true,
                      filterOptions: ["Needs Slip", "Printed", "For Pickup"],
                      accessor: (row) => row.slip_status === 'printed' ? 'Printed' : row.slip_status === 'ready_for_pickup' ? 'For Pickup' : 'Needs Slip',
                      filterAccessor: (row) => row.slip_status === 'printed' ? 'Printed' : row.slip_status === 'ready_for_pickup' ? 'For Pickup' : 'Needs Slip',
                    },
                  ]}
                  data={summaryActivities}
                  onRowClick={handleViewDetails}
                  emptyMessage="No approved activities found."
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