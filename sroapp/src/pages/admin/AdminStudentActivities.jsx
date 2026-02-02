import { useEffect, useState, useRef } from "react";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api-config"; // Import config
import supabase from "@/lib/supabase";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, ChevronDown } from "lucide-react";
import { toast, Toaster } from "sonner";
import { approveActivity, rejectActivity } from "@/api/approveRejectRequestAPI";
import LoadingSpinner from "@/components/ui/loading-spinner";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";

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
  const [superadminView, setSuperadminView] = useState('sro'); // 'sro' or 'odsa'
  const [tab, setTab] = useState("requests");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [userRole, setUserRole] = useState(initialUserRole || null);
  const [activities, setActivities] = useState([]);

  // Helper to extract unique options for filters
  const getUniqueOrgOptions = (data) => {
    return [...new Set(data.map(a => a.organization?.org_name || "Unknown"))].sort();
  };

  const getUniqueStatusOptions = (data) => {
    return [...new Set(data.map(a => a.status))].sort();
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
    // If userRole is already passed via props or set, skip fetching
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



  // Copied logic
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
        // Reject anything that's NOT already Approved or Rejected
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

          // Update local data to reflect changes immediately
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

            // Get submitter email from account relation if available
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
      // ----------------------------------------

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
            Activities
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
                  preventHorizontalScroll={true}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card className="rounded-lg overflow-hidden shadow-sm border-0 min-h-[400px] flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium">Activities Calendar</p>
              <p className="text-sm">Coming soon.</p>
            </div>
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
    </div>
  );
};

export default AdminPendingRequests;