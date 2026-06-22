import { useState, useEffect, useMemo, useRef } from "react";
import supabase from "@/lib/supabase";
import { useAuth } from "@/context/UserAuthContext";
import { Dialog } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Clock, CheckCircle, XCircle, Building2, ListFilter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/ui/DataTable";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";
import { toast } from "sonner";
import { createNotification } from "@/lib/notifications";
import { API_BASE_URL, authFetch } from "@/lib/api-config";
import { approveActivity, rejectActivity } from "@/api/approveRejectRequestAPI";
import { StaggerContainer, StaggerItem } from "@/components/ui/animated-container";
import { SUPERADMIN_EMAILS } from "@/lib/permissions";
import { UnifiedDropdown } from "@/components/ui/unified-dropdown";

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

const AdviserDashboard = () => {
  const { user, email, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const autoRejectRan = useRef(false);

  // Superadmin org selection
  const isSuperadmin = SUPERADMIN_EMAILS.includes(email);
  const [allOrgs, setAllOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [showAllPending, setShowAllPending] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || null;

  // Fetch all orgs for superadmin picker
  useEffect(() => {
    if (!isSuperadmin || authLoading) return;
    const fetchAllOrgs = async () => {
      const { data, error } = await supabase
        .from("organization")
        .select("org_id, org_name")
        .order("org_name");
      if (!error && data) setAllOrgs(data);
    };
    fetchAllOrgs();
  }, [isSuperadmin, authLoading]);

  const fetchData = async (orgIdOverride) => {
    try {
      // Superadmin "show all pending" mode — fetch across all orgs
      if (isSuperadmin && showAllPending) {
        const { data: activityData, error: actError } = await supabase
          .from("activity")
          .select(`
            *,
            organization:organization(org_id, org_name),
            schedule:activity_schedule(start_date, end_date, start_time, end_time, is_recurring, recurring_days),
            account:account(account_name, email)
          `)
          .eq("adviser_approval_status", "Pending")
          .is("final_status", null)
          .order("created_at", { ascending: false });

        if (actError) throw actError;

        // Derive unique orgs for the header subtitle
        const orgMap = {};
        (activityData || []).forEach(a => {
          if (a.organization) orgMap[a.organization.org_id] = a.organization;
        });
        setOrgs(Object.values(orgMap));

        setActivities((activityData || []).map(a => ({ ...a, status: getDerivedStatus(a) })));
        return;
      }

      let adviserOrgs;

      if (isSuperadmin && orgIdOverride) {
        // Superadmin picked a specific org
        const { data, error } = await supabase
          .from("organization")
          .select("org_id, org_name, chairperson_name, org_status, academic_year")
          .eq("org_id", orgIdOverride);
        if (error) throw error;
        adviserOrgs = data || [];
      } else {
        // Normal adviser: match by email
        const { data, error } = await supabase
          .from("organization")
          .select("org_id, org_name, chairperson_name, org_status, academic_year")
          .eq("adviser_email", email);
        if (error) throw error;
        adviserOrgs = data || [];
      }

      setOrgs(adviserOrgs);

      if (adviserOrgs.length === 0) {
        setActivities([]);
        return;
      }

      const orgIds = adviserOrgs.map(o => o.org_id);

      // Get activities for those orgs
      const { data: activityData, error: actError } = await supabase
        .from("activity")
        .select(`
          *,
          organization:organization(org_id, org_name),
          schedule:activity_schedule(start_date, end_date, start_time, end_time, is_recurring, recurring_days),
          account:account(account_name, email)
        `)
        .in("org_id", orgIds)
        .order("created_at", { ascending: false });

      if (actError) throw actError;

      // --- Auto-Reject Elapsed Activities (once per mount) ---
      const today = new Date().toISOString().split('T')[0];
      const autoRejectReason = 'Activity date has elapsed without approval. Please submit a new request if you wish to reschedule.';
      const expiredActivities = (activityData || []).filter(activity => {
        const isNotFinal = activity.final_status !== 'Approved' && activity.final_status !== 'Rejected';
        const startDate = activity.schedule?.[0]?.start_date;
        return isNotFinal && startDate && startDate < today;
      });

      if (expiredActivities.length > 0 && !autoRejectRan.current) {
        autoRejectRan.current = true;
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

          // Send email + in-app notifications (fire-and-forget)
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

      const processed = (activityData || []).map(a => ({
        ...a,
        status: getDerivedStatus(a),
      }));

      setActivities(processed);
    } catch (err) {
      console.error("Adviser dashboard error:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !email) return;
    if (isSuperadmin && (selectedOrgId || showAllPending)) {
      setDataLoading(true);
    } else {
      setLoading(true);
    }
    fetchData(selectedOrgId || undefined);
  }, [email, authLoading, selectedOrgId, showAllPending]);

  // Stats
  const stats = useMemo(() => ({
    pending: activities.filter(a => a.status === "Pending Adviser").length,
    endorsed: activities.filter(a => a.adviser_approval_status === "Approved").length,
    rejected: activities.filter(a => a.status === "Rejected" && a.adviser_approval_status === "Rejected").length,
  }), [activities]);

  const handleViewDetails = async (activity) => {
    const { data, error } = await supabase
      .from("activity")
      .select(`*, account:account(*), schedule:activity_schedule(*), organization:organization(*)`)
      .eq("activity_id", activity.activity_id)
      .single();

    if (!error && data) {
      setSelectedActivity(data);
      setIsModalOpen(true);
    }
  };

  const handleApprove = async (comment, activityId) => {
    await approveActivity(activityId, comment, 5);
    setIsModalOpen(false);
    setSelectedActivity(null);
    fetchData(selectedOrgId || undefined);
  };

  const handleReject = async (comment, activityId) => {
    await rejectActivity(activityId, comment, 5);
    setIsModalOpen(false);
    setSelectedActivity(null);
    fetchData(selectedOrgId || undefined);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const columns = [
    {
      key: "organization",
      header: "Organization",
      width: "w-[20%]",
      sortable: true,
      filterable: true,
      filterOptions: [...new Set(activities.map(a => a.organization?.org_name || "Unknown"))].sort(),
      filterLabel: "Organizations",
      filterAccessor: (row) => row.organization?.org_name || "Unknown",
      render: (row) => (
        <span className="truncate block text-gray-700" title={row.organization?.org_name}>
          {row.organization?.org_name || "Unknown"}
        </span>
      ),
    },
    {
      key: "activity_name",
      header: "Activity",
      width: "w-[25%]",
      sortable: true,
      render: (row) => (
        <span className="truncate block text-gray-700 font-medium" title={row.activity_name}>
          {row.activity_name}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Submitted",
      width: "w-[15%]",
      sortable: true,
      sortAccessor: (row) => new Date(row.created_at).getTime(),
      render: (row) => <span className="text-gray-600">{formatDate(row.created_at)}</span>,
    },
    {
      key: "schedule",
      header: "Activity Date",
      width: "w-[15%]",
      sortable: true,
      sortAccessor: (row) => row.schedule?.[0]?.start_date || "",
      render: (row) => <span className="text-gray-600">{formatDate(row.schedule?.[0]?.start_date)}</span>,
    },
    {
      key: "status",
      header: "Status",
      width: "w-[15%]",
      sortable: true,
      filterable: true,
      filterOptions: ["Pending Adviser", "Pending SRO", "Pending ODSA", "Approved", "Rejected"],
      filterLabel: "Statuses",
      isStatus: true,
      accessor: (row) => row.status,
    },
  ];

  const statCards = [
    { label: "Pending Endorsement", count: stats.pending, icon: Clock, bgColor: "bg-sro-accent-50", iconColor: "text-sro-accent-500", countColor: "text-sro-accent-700" },
    { label: "Endorsed", count: stats.endorsed, icon: CheckCircle, bgColor: "bg-sro-secondary-50", iconColor: "text-sro-secondary", countColor: "text-sro-secondary-700" },
    { label: "Rejected", count: stats.rejected, icon: XCircle, bgColor: "bg-sro-primary-50", iconColor: "text-sro-primary", countColor: "text-sro-primary-700" },
  ];

  if (loading) {
    return (
      <div className="max-w-[1350px] mx-auto space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-[1350px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            {firstName ? (
              <span className="animate-[fadeIn_0.4s_ease-in-out]">{greeting}, {firstName}!</span>
            ) : (
              <>{greeting}!</>
            )}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Building2 className="w-4 h-4 text-sro-primary" />
            <p className="text-sm text-gray-500">
              {showAllPending
                ? <>All organizations — <span className="font-medium text-sro-primary">{activities.length} pending adviser request{activities.length !== 1 ? "s" : ""}</span></>
                : orgs.length > 0
                  ? <>Adviser for: {orgs.map(o => o.org_name).join(", ")}</>
                  : <span className="italic">No organizations assigned</span>
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start w-fit text-sm font-medium text-sro-primary bg-white px-3 py-1.5 rounded-full border shadow-sm">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Superadmin org picker + all-pending toggle */}
      {isSuperadmin && allOrgs.length > 0 && (
        <Card className="shadow-sm">
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className={`max-w-xs flex-1 min-w-[200px] ${showAllPending ? "opacity-50 pointer-events-none" : ""}`}>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Superadmin: Select organization to advise
              </label>
              <UnifiedDropdown
                options={allOrgs.map(o => ({ value: String(o.org_id), label: o.org_name }))}
                value={selectedOrgId ? String(selectedOrgId) : ""}
                onChange={(val) => {
                  setSelectedOrgId(Number(val));
                  setShowAllPending(false);
                }}
                placeholder="Choose an organization..."
                searchable
              />
            </div>
            <Button
              variant={showAllPending ? "sro-primary" : "outline"}
              className="text-xs"
              onClick={() => {
                setShowAllPending(prev => !prev);
                if (!showAllPending) setSelectedOrgId(null);
              }}
            >
              <ListFilter className="w-3.5 h-3.5" />
              All pending adviser requests
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      {dataLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {statCards.map((stat) => (
            <StaggerItem
              key={stat.label}
              className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className={`p-2.5 rounded-lg shrink-0 ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-2xl font-bold ${stat.countColor} animate-[fadeIn_0.4s_ease-in-out]`}>
                  {stat.count}
                </p>
                <p className="text-xs text-gray-500 font-medium leading-tight">{stat.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Activity Requests Table */}
      {dataLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          data={activities.map(a => ({ ...a, id: a.activity_id }))}
          onRowClick={handleViewDetails}
          emptyMessage="No activity requests found for your organizations."
          defaultSort={{ key: "created_at", direction: "desc" }}
          defaultFilters={{ status: "Pending Adviser" }}
        />
      )}

      {/* Activity Detail Dialog */}
      {selectedActivity && (
        <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) { setIsModalOpen(false); setSelectedActivity(null); } }}>
          <ActivityDialogContent
            activity={selectedActivity}
            isModalOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setSelectedActivity(null); }}
            userRole={5}
            handleApprove={handleApprove}
            handleReject={handleReject}
            onActivityUpdate={fetchData}
          />
        </Dialog>
      )}
    </div>
  );
};

export default AdviserDashboard;
