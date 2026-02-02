import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import supabase from "@/lib/supabase";
import { API_BASE_URL } from "@/lib/api-config";
import axios from "axios";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";
import LoadingSpinner from "@/components/ui/loading-spinner.jsx";
import { FileText, Calendar, CheckCircle, Clock, FileCheck, BookOpen, Database, ClipboardList } from "lucide-react";
import StatusPill from "@/components/ui/StatusPill";
import { isSameDay, format } from "date-fns";

// Dashboard Components
import ActivityTrendsChart from "@/components/dashboard/ActivityTrendsChart";
import ActionCenter from "@/components/dashboard/ActionCenter";
import CalendarWithSidePanel from "@/components/ui/CalendarWithSidePanel";
import AppointmentDetailsDialog from "@/components/admin/AppointmentDetailsDialog";

const AdminPanel = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data States
  const [rawActivities, setRawActivities] = useState([]); // Approved + Incoming
  const [appointments, setAppointments] = useState([]);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);

  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  // Dynamic Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  // Stats
  const [requestsCounts, setRequestsCounts] = useState({
    approved: 0,
    forAppeal: 0,
    pending: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    annualReports: 0,
  });

  // Stats data for the summary section - STRICT SRO PRIMARY
  const statsSummary = [
    { title: "Pending Requests", count: requestsCounts.forAppeal + requestsCounts.pending || 0, path: "/admin/student-activities", icon: Clock },
    { title: "Approved Requests", count: requestsCounts.approved || 0, path: "/admin/student-activities", icon: CheckCircle },
    { title: "Pending Applications", count: requestsCounts.pendingApplications || 0, path: "/admin/org-applications", icon: BookOpen },
    { title: "Approved Applications", count: requestsCounts.approvedApplications || 0, path: "/admin/organizations", icon: FileCheck },
    { title: "Total Submissions", count: (requestsCounts.forAppeal + requestsCounts.pending + requestsCounts.approved) || 0, path: "/admin/all-submissions", icon: FileText },
    { title: "Annual Reports", count: requestsCounts.annualReports || 0, path: "/admin/annual-reports", icon: Calendar },
  ];

  const getActivityTypeLabel = (id) => {
    // Simplified map for dashboard
    const map = {
      charitable: "Charitable",
      serviceWithinUPB: "Service (UPB)",
      serviceOutsideUPB: "Service (Outside)",
      educational: "Educational",
      incomeGenerating: "IGP",
      others: "Others"
    };
    return map[id] || id;
  };

  // 1. Fetch User Role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { data: account } = await supabase.from("account").select("role_id").eq("email", user.email).single();
          if (account) setUserRole(account.role_id);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };
    fetchUserRole();
  }, []);

  // 2. Main Data Fetch (Combined)
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const { data: sessionData } = await supabase.auth.getSession();
        const access_token = sessionData?.session?.access_token;

        // A. Fetch Approved Activities (For Calendar & Chart)
        const { data: approvedData, error: approvedError } = await supabase
          .from("activity")
          .select(`*, organization:organization(*), schedule:activity_schedule(*)`)
          .eq("final_status", "Approved");

        if (approvedError) throw approvedError;

        // B. Fetch Incoming Requests (For Stats & Chart)
        let incomingData = [];
        if (access_token) {
          const res = await axios.get(`${API_BASE_URL}/api/activities/incoming`, {
            headers: { Authorization: `Bearer ${access_token}` },
          });
          incomingData = res.data || [];
        }

        // C. Fetch Appointments
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from("appointments")
          .select(`*, account:account(account_name, email)`)
          .in('status', ['scheduled', 'confirmed']); // Only active appointments for generic view

        if (appointmentsError) throw appointmentsError;
        setAppointments(appointmentsData || []);

        // D. Combine for "Raw Activities" (Chart Data)
        setRawActivities([...(approvedData || []), ...incomingData]);

        // E. Calculate Request Stats
        let forAppealCount = 0;
        let pendingCount = 0;
        incomingData.forEach(a => {
          if (a.final_status === "For Appeal") forAppealCount++;
          if (a.final_status === "Pending" || a.final_status === null) pendingCount++;
        });

        // F. Fetch Org Application Stats
        const { data: pendingApps } = await supabase.from("org_recognition").select("recognition_id", { count: "exact" })
          .or('and(sro_approved.is.null,odsa_approved.is.null),and(sro_approved.eq.true,odsa_approved.is.null),and(sro_approved.eq.true,odsa_approved.eq.false)');

        const { data: approvedApps } = await supabase.from("org_recognition").select("recognition_id", { count: "exact" })
          .eq("sro_approved", true).eq("odsa_approved", true);

        // G. Fetch Reports Stats
        const currentYear = new Date().getFullYear();
        const { data: reports } = await supabase.from("org_annual_report").select("report_id", { count: "exact" })
          .ilike("academic_year", `%${currentYear}`);

        // Update Counts State
        setRequestsCounts({
          approved: approvedData?.length || 0,
          forAppeal: forAppealCount,
          pending: pendingCount,
          pendingApplications: pendingApps?.length || 0,
          approvedApplications: approvedApps?.length || 0,
          annualReports: reports?.length || 0,
        });

      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // --- Calendar Logic ---
  const getEventColor = (category, event) => {
    if (event?.type === 'appointment') {
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    }
    // Consistent coloring with AdminStudentActivities
    if (event?.isRecurring) return 'bg-sro-secondary text-white border-2 border-orange-500';
    return 'bg-sro-secondary text-white';
  };

  const calendarEvents = useMemo(() => {
    let events = [];

    // 1. Activities (Approved)
    const approvedOnly = rawActivities.filter(a => a.final_status === "Approved");
    const activityEvents = approvedOnly.flatMap(activity => {
      if (!activity.schedule || activity.schedule.length === 0) return [];
      const evs = [];
      activity.schedule.forEach(sched => {
        const startTime = sched.start_time ? sched.start_time.slice(0, 5) : "TBD";
        const endTime = sched.end_time ? sched.end_time.slice(0, 5) : "TBD";
        const timeStr = `${startTime} - ${endTime}`;

        if (sched.is_recurring && sched.recurring_days) {
          const recurringDays = typeof sched.recurring_days === 'string' ? JSON.parse(sched.recurring_days) : sched.recurring_days;
          const start = new Date(sched.start_date);
          const end = new Date(sched.end_date);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
            if (recurringDays[dayName]) {
              evs.push({
                ...activity,
                type: 'activity',
                date: new Date(d).toISOString().split('T')[0],
                title: activity.activity_name,
                category: activity.activity_type,
                isRecurring: true,
                timeRange: timeStr,
                venue: activity.venue || 'TBD',
                orgName: activity.organization?.org_name || 'Organization'
              });
            }
          }
        } else {
          evs.push({
            ...activity,
            type: 'activity',
            date: sched.start_date,
            title: activity.activity_name,
            category: activity.activity_type,
            isRecurring: false,
            timeRange: timeStr,
            venue: activity.venue || 'TBD',
            orgName: activity.organization?.org_name || 'Organization'
          });
        }
      });
      return evs;
    });
    events = [...events, ...activityEvents];

    // 2. Appointments - Only show CONFIRMED (not scheduled/pending requests)
    const appointmentEvents = appointments
      .filter(app => app.status === 'confirmed')
      .map(app => {
        const appDate = new Date(app.appointment_date);
        const timeStr = app.appointment_time ? app.appointment_time.slice(0, 5) : 'TBD';
        const endTimeStr = app.appointment_time ? new Date(new Date(`2000-01-01T${app.appointment_time}`).getTime() + 30 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'TBD';

        return {
          ...app,
          type: 'appointment',
          date: app.appointment_date,
          title: `Appointment: ${app.account?.account_name || 'Student'}`,
          category: 'appointment',
          isRecurring: false,
          timeRange: `${timeStr} - ${endTimeStr}`,
          venue: app.meeting_mode === 'face-to-face' ? 'SRO Office' : 'Online',
          orgName: app.account?.account_name || 'Student', // Reuse field for display consistency
          description: app.reason || 'Consultation'
        };
      });
    events = [...events, ...appointmentEvents];

    return events;
  }, [rawActivities, appointments]);

  const filteredCalendarList = useMemo(() => {
    if (!selectedDateFilter) return [];
    return calendarEvents.filter(event => isSameDay(new Date(event.date), selectedDateFilter));
  }, [calendarEvents, selectedDateFilter]);


  const handleItemClick = async (item) => {
    if (item.type === 'activity') {
      // Activity Logic
      setModalLoading(true);
      setIsModalOpen(true);
      const activityId = item.activity_id;
      const { data } = await supabase.from("activity")
        .select(`*, account:account(*), schedule:activity_schedule(*), organization:organization(*)`)
        .eq("activity_id", activityId).single();
      setSelectedActivity(data || item);
      setModalLoading(false);
    } else {
      // Appointment Logic - Open Dialog
      setSelectedAppointment(item);
      setIsAppointmentModalOpen(true);
    }
  };

  const dashboardLegend = [
    { label: "Activity", colorClass: "text-sro-secondary", indicatorClass: "bg-sro-secondary" },
    { label: "Appointment", colorClass: "text-blue-500", indicatorClass: "bg-blue-500" },
    { label: "Recurring", colorClass: "text-sro-secondary", indicatorClass: "bg-sro-secondary border-2 border-orange-500" },
  ];

  if (loading && !rawActivities.length && !appointments.length) {
    return <LoadingSpinner text="Loading dashboard..." variant="fullscreen" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex flex-col w-full max-w-[1600px] mx-auto p-4 sm:p-6 gap-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold text-sro-primary tracking-tight">{greeting}, Admin!</h1>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium bg-white px-3 py-1.5 rounded-full border shadow-sm text-sro-primary">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* 1. Stats Grid (Strict SRO Primary) */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {statsSummary.map((stat, index) => (
            <Link
              to={stat.path || "#"}
              key={index}
              className={`group flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-sro-primary/30 transition-all duration-200 h-[100px] ${!stat.path ? 'cursor-default pointer-events-none' : ''}`}
            >
              <div className={`p-3 rounded-full bg-sro-primary/10 text-sro-primary group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-sro-primary transition-colors">{stat.count}</h3>
                <p className="text-xs font-medium text-gray-500 line-clamp-2">{stat.title}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* 2. Charts & Action Center */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-auto xl:h-[320px]">
          <div className="xl:col-span-2 h-full">
            <ActivityTrendsChart activities={rawActivities} />
          </div>
          <div className="xl:col-span-1 h-full">
            <ActionCenter counts={requestsCounts} />
          </div>
        </div>

        {/* 3. Custom Calendar Section */}
        <CalendarWithSidePanel
          currentDate={currentDate}
          onMonthChange={setCurrentDate}
          selectedDate={selectedDateFilter}
          onDateSelect={(date) => {
            if (selectedDateFilter && isSameDay(date, selectedDateFilter)) {
              setSelectedDateFilter(null);
            } else {
              setSelectedDateFilter(date);
            }
          }}
          events={calendarEvents}
          getEventColor={getEventColor}
          legendItems={dashboardLegend}
          sidePanelData={filteredCalendarList}
          renderSidePanelItem={(item) => (
            <div
              key={`${item.id || item.activity_id}-${item.date}`}
              onClick={() => handleItemClick(item)}
              className="group p-3 bg-white border border-gray-100 rounded-lg cursor-pointer hover:border-sro-primary/50 hover:shadow-sm transition-all"
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-semibold text-sro-primary text-sm line-clamp-2 leading-tight group-hover:underline decoration-sro-primary/30 underline-offset-2">
                  {/* FIXED: Dynamic title for appt based on dashboard view context if needed, but 'title' field is already computed in memo */}
                  {item.title}
                </h4>
              </div>
              <div className="flex flex-col gap-1 text-xs text-gray-500 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full bg-gray-300`} />
                  <span className="truncate max-w-[200px]">{item.orgName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full bg-gray-300`} />
                  <span className="truncate max-w-[200px]">{item.venue}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>{item.timeRange}</span>
                </div>
                {item.isRecurring && (
                  <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded w-fit">
                    Recurring
                  </span>
                )}
                {item.type === 'appointment' && (
                  <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit">
                    Appointment
                  </span>
                )}
              </div>
            </div>
          )}
        />

      </div>

      {/* Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {modalLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <LoadingSpinner text="Loading detail..." variant="inline" />
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

      {/* Appointment Details Dialog */}
      <AppointmentDetailsDialog
        appointment={selectedAppointment}
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
      />
    </div>
  );
};

export default AdminPanel;