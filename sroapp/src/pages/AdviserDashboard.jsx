import { useState, useEffect, useMemo } from "react";
import supabase from "@/lib/supabase";
import { useAuth } from "@/context/UserAuthContext";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Clock, CheckCircle, XCircle, Building2 } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";
import { toast } from "sonner";
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
  const [orgs, setOrgs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Superadmin org selection
  const isSuperadmin = SUPERADMIN_EMAILS.includes(email);
  const [allOrgs, setAllOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);

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
    }
  };

  useEffect(() => {
    if (authLoading || !email) return;
    if (isSuperadmin && selectedOrgId) setLoading(true);
    fetchData(selectedOrgId || undefined);
  }, [email, authLoading, selectedOrgId]);

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
    { label: "Rejected", count: stats.rejected, icon: XCircle, bgColor: "bg-red-50", iconColor: "text-red-500", countColor: "text-red-700" },
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-4 flex items-center gap-3">
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
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
            Adviser for: {orgs.length > 0
              ? orgs.map(o => o.org_name).join(", ")
              : <span className="italic">No organizations assigned</span>
            }
          </p>
        </div>

        {/* Superadmin org picker */}
        {isSuperadmin && allOrgs.length > 0 && (
          <div className="mt-3 max-w-xs">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Superadmin: Select organization to advise
            </label>
            <UnifiedDropdown
              options={allOrgs.map(o => ({ value: String(o.org_id), label: o.org_name }))}
              value={selectedOrgId ? String(selectedOrgId) : ""}
              onChange={(val) => setSelectedOrgId(Number(val))}
              placeholder="Choose an organization..."
              searchable
            />
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Activity Requests Table */}
      <DataTable
        columns={columns}
        data={activities.map(a => ({ ...a, id: a.activity_id }))}
        onRowClick={handleViewDetails}
        emptyMessage="No activity requests found for your organizations."
        defaultSort={{ key: "created_at", direction: "desc" }}
        defaultFilters={{ status: "Pending Adviser" }}
      />

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
