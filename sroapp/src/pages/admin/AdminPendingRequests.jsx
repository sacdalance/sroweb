import { useEffect, useState, useRef } from "react";
import ActivityDialogContent from "@/components/admin/ActivityDialogContent";
import axios from "axios";
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

const AdminPendingRequests = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("appeals");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [allActivities, setAllActivities] = useState([]);
  const [pendingAppeals, setPendingAppeals] = useState([]);
  const [superadminView, setSuperadminView] = useState('sro'); // 'sro' or 'odsa'

  useEffect(() => {
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
        console.log("Fetched user role:", account?.role_id);
      }
    };

    fetchRole();
  }, []);

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

  const getActivityTypeLabel = (id) => {
    return activityTypeOptions.find((opt) => opt.id === id)?.label || id;
  };

  const [incomingRequests, setIncomingRequests] = useState([]);
  useEffect(() => {
    if (!userRole) return; // Wait until role is available

    const fetchIncoming = async () => {
      try {
        setLoading(true);
        const { data: sessionData, error } = await supabase.auth.getSession();
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

        const allActivities = res.data;
        setAllActivities(allActivities);

        let filtered;
        if (userRole === 4) {
          // Superadmin: filter based on superadminView
          if (superadminView === 'sro') {
            filtered = allActivities.filter((a) => {
              const isAppealOrCancel = a.final_status === "For Appeal" || a.final_status === "For Cancellation";
              if (isAppealOrCancel) return false;
              return (
                a.sro_approval_status === null ||
                (a.sro_approval_status === "Approved" && a.odsa_approval_status === null)
              );
            });
          } else if (superadminView === 'odsa') {
            filtered = allActivities.filter((a) => {
              const isAppealOrCancel = a.final_status === "For Appeal" || a.final_status === "For Cancellation";
              if (isAppealOrCancel) return false;
              return (
                a.sro_approval_status === "Approved" &&
                a.odsa_approval_status === null
              );
            });
          } else {
            filtered = allActivities;
          }
        } else if (userRole === 2) {
          filtered = allActivities.filter((a) => {
            const isAppealOrCancel = a.final_status === "For Appeal" || a.final_status === "For Cancellation";
            if (isAppealOrCancel) return false;
            return (
              a.sro_approval_status === null ||
              (a.sro_approval_status === "Approved" && a.odsa_approval_status === null)
            );
          });
        } else if (userRole === 3) {
          // ODSA sees only activities approved by SRO and not yet acted on by them
          filtered = allActivities.filter((a) => {
            const isAppealOrCancel = a.final_status === "For Appeal" || a.final_status === "For Cancellation";
            if (isAppealOrCancel) return false;
            return (
              a.sro_approval_status === "Approved" &&
              a.odsa_approval_status === null
            );
          });
        } else {
          filtered = allActivities;
        }

        setIncomingRequests(filtered);

      } catch (error) {
        console.error("Failed to fetch incoming submissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIncoming();
  }, [userRole, superadminView]); // trigger when userRole or superadminView changes


  useEffect(() => {
    const appeals = allActivities.filter(a => a.final_status === "For Appeal" || a.final_status === "For Cancellation");
    setPendingAppeals(appeals);
  }, [allActivities]);

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



  if (!userRole) return null;

  return (
    <div
      className="container mx-auto py-4 max-w-[1800px]"
      style={{ transform: "scale(0.9)", transformOrigin: "top center" }}
    >
      <Toaster />
      <h1 className="text-2xl sm:text-3xl font-bold text-[#7B1113] mb-8 text-center sm:text-left">Pending Activity Requests</h1>

      <Tabs defaultValue="submissions" className="w-full mb-8">
        <TabsList
          className="
            grid 
            w-full 
            max-w-[400px] 
            grid-cols-2 
            h-8 
            p-0
            mx-auto 
            bg-gray-100 
            rounded-4xl
            sm:max-w-[800px]
          "
        >
          <TabsTrigger
            value="submissions"
            className="data-[state=active]:bg-[#7B1113] data-[state=active]:text-white rounded-l-4xl text-xs sm:text-base p-1"
          >
            Incoming Submissions ({incomingRequests.length})
          </TabsTrigger>

          <TabsTrigger
            value="appeals"
            className="data-[state=active]:bg-[#7B1113] data-[state=active]:text-white rounded-r-4xl text-xs sm:text-base p-1"
          >
            Appeals and Cancellations ({pendingAppeals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appeals">
          <Card className="rounded-lg overflow-hidden shadow-md">
            <CardHeader className="py-3 px-6">
              <CardTitle className="text-xl font-bold text-[#000000]">
                Appeals and Cancellations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full h-full">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center">Submission Date</th>
                      <th className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center">Organization</th>
                      <th className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center">Activity Name</th>
                      <th className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center">Activity Type</th>
                      <th className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center">Activity Date</th>
                      <th className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center">Venue</th>
                      <th className="px-2 py-2 text-xs max-w-[120px] truncate overflow-hidden whitespace-nowrap text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingAppeals.map((request) => (
                      <tr
                        key={request.activity_id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewDetails(request)}
                      >
                        <td className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center" title={new Date(request.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}>{new Date(request.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}</td>
                        <td className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center" title={request.organization?.org_name || "N/A"}>
                          <span className="block truncate">{request.organization?.org_name || "N/A"}</span>
                        </td>
                        <td className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center" title={request.activity_name}>
                          <span className="block truncate">{request.activity_name}</span>
                        </td>
                        <td className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center" title={getActivityTypeLabel(request.activity_type)}>{getActivityTypeLabel(request.activity_type)}</td>
                        <td className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center" title={new Date(request.schedule?.[0]?.start_date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}>{new Date(request.schedule?.[0]?.start_date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}</td>
                        <td className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center" title={request.venue}>
                          <span className="block truncate">{request.venue}</span>
                        </td>
                        <td className="px-2 py-2 text-xs max-w-[120px] truncate overflow-hidden whitespace-nowrap text-center">
                          <StatusPill status={request.final_status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions">
          <Card className="rounded-lg overflow-hidden shadow-md">
            <CardHeader className="py-3 px-6">
              <div className="flex items-center gap-4">
                <CardTitle className="text-xl font-bold text-[#000000]">
                  Incoming Submissions
                </CardTitle>
                {userRole === 4 && (
                  <div className="flex gap-2 ml-2">
                    <button
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${superadminView === 'sro' ? 'bg-[#014421] text-white border-[#014421]' : 'bg-white text-[#014421] border-[#014421]'}`}
                      onClick={() => setSuperadminView('sro')}
                    >
                      SRO view
                    </button>
                    <button
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${superadminView === 'odsa' ? 'bg-[#7B1113] text-white border-[#7B1113]' : 'bg-white text-[#7B1113] border-[#7B1113]'}`}
                      onClick={() => setSuperadminView('odsa')}
                    >
                      ODSA view
                    </button>
                  </div>
                )}
              </div>
              {userRole === 3 && (
                <p className="text-sm text-gray-600 italic mb-1">
                  Showing only activities approved by the SRO.
                </p>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500 text-sm">
                    <div className="h-6 w-6 mb-3 border-2 border-[#7B1113] border-t-transparent rounded-full animate-spin"></div>
                    Loading incoming submissions...
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center">Submission Date</th>
                        <th className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center">Organization</th>
                        <th className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center">Activity Name</th>
                        <th className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center">Activity Type</th>
                        <th className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center">Activity Date</th>
                        <th className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center">Venue</th>
                        <th className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {incomingRequests.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center text-gray-500 py-10">
                            No incoming submissions.
                          </td>
                        </tr>
                      ) : (
                        incomingRequests.map((request) => {
                          let statusLabel = "";
                          let pillStatus = "";
                          if (request.final_status == null) {
                            if (request.sro_approval_status == null) {
                              statusLabel = "Pending";
                              pillStatus = "For Appeal"; // gray pill
                            } else {
                              statusLabel = "ODSA Pending";
                              pillStatus = "Pending"; // yellow pill
                            }
                          } else {
                            statusLabel = request.final_status;
                            pillStatus = request.final_status;
                          }
                          return (
                            <tr
                              key={request.activity_id}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleViewDetails(request)}
                            >
                              <td className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center" title={new Date(request.created_at).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "long",
                                day: "numeric"
                              })}>{new Date(request.created_at).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "long",
                                day: "numeric"
                              })}</td>
                              <td className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center" title={request.organization?.org_name || "N/A"}>
                                <span className="block truncate">{request.organization?.org_name || "N/A"}</span>
                              </td>
                              <td className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center" title={request.activity_name}>
                                <span className="block truncate">{request.activity_name}</span>
                              </td>
                              <td className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center" title={getActivityTypeLabel(request.activity_type)}>{getActivityTypeLabel(request.activity_type)}</td>
                              <td className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center" title={new Date(request.schedule?.[0]?.start_date).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "long",
                                day: "numeric"
                              })}>{new Date(request.schedule?.[0]?.start_date).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "long",
                                day: "numeric"
                              })}</td>
                              <td className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center" title={request.venue}>
                                <span className="block truncate">{request.venue}</span>
                              </td>
                              <td className="px-2 py-2 text-xs max-w-[150px] truncate overflow-hidden whitespace-nowrap text-center">
                                <StatusPill status={statusLabel} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>
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
    </div>
  );
};

export default AdminPendingRequests;