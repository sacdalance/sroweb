import { useEffect, useState } from "react";
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
import { FileText, Calendar, Clock, User, X, Check, Eye, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

const formatLabel = (id, options) =>
  options.find((o) => o.id === id)?.label || id;

const formatSDGLabels = (sdg) => {
  try {
    const parsed = typeof sdg === "string" ? JSON.parse(sdg) : sdg;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const ActivityDialogContent = ({ activity }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const description = activity.activity_description || "";
  const isLong = description.length > 300;
  const toggleDescription = () => setShowFullDescription(!showFullDescription);

  const formatDateRange = (schedule) => {
    if (!Array.isArray(schedule) || schedule.length === 0) return "TBD";
    const { start_date, end_date } = schedule[0];
    const start = new Date(start_date).toLocaleDateString();
    const endFormatted = end_date ? new Date(end_date).toLocaleDateString() : "";
    return start === endFormatted || !endFormatted ? start : `${start} - ${endFormatted}`;
  };

  const formatTime = (t) => {
    if (!t) return "N/A";
    const [h, m] = t.split(":");
    return new Date(0, 0, 0, h, m).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-3xl p-0 overflow-hidden">
      <ScrollArea className="max-h-[80vh] px-6 py-4">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#7B1113] font-bold">{activity.activity_name}</DialogTitle>
          <p className="text-sm font-semibold text-gray-700 mb-2">{activity.organization?.org_name || "Organization Name"}</p>
        </DialogHeader>

        <div className="flex flex-col gap-y-6 text-sm">
          {/* Description */}
          <div className="text-gray-800">
            {!isLong ? (
              <p className="whitespace-pre-wrap">{description}</p>
            ) : showFullDescription ? (
              <>
                <p className="whitespace-pre-wrap">{description}</p>
                <button
                  onClick={toggleDescription}
                  className="text-[#7B1113] text-sm font-medium hover:underline mt-1"
                >
                  Show less
                </button>
              </>
            ) : (
              <>
                <p className="whitespace-pre-wrap">{description.slice(0, 300)}...</p>
                <button
                  onClick={toggleDescription}
                  className="text-[#7B1113] text-sm font-medium hover:underline mt-1"
                >
                  Show more
                </button>
              </>
            )}
          </div>

          {/* General Info */}
          <div className="space-y-1">
            <h3 className="text-[#7B1113] font-semibold mb-1">General Information</h3>
            <div className="pl-4">
              <p><strong>Activity Type:</strong> {formatLabel(activity.activity_type, activityTypeOptions)}</p>
              <p><strong>Charge Fee:</strong> {activity.charge_fee === "true" ? "Yes" : "No"}</p>
              <p><strong>Adviser Name:</strong> {activity.organization?.adviser_name || "N/A"}</p>
              <p><strong>Adviser Contact:</strong> {activity.organization?.adviser_email || "N/A"}</p>
            </div>
          </div>

          {/* Specifications */}
          <div className="space-y-1">
            <h3 className="text-[#7B1113] font-semibold mb-1">Specifications</h3>
            <div className="pl-4">
              <p><strong>Venue:</strong> {activity.venue}</p>
              <p><strong>Venue Approver:</strong> {activity.venue_approver}</p>
              <p><strong>Venue Contact:</strong> {activity.venue_approver_contact}</p>
              <p><strong>Green Monitor:</strong> {activity.green_monitor_name}</p>
              <p><strong>Monitor Contact:</strong> {activity.green_monitor_contact}</p>
              <p><strong>Off-Campus:</strong> {activity.is_off_campus === "true" ? "Yes" : "No"}</p>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-1">
            <h3 className="text-[#7B1113] font-semibold mb-1">Schedule</h3>
            <div className="pl-4">
              <p><strong>Date:</strong> {formatDateRange(activity.schedule)}</p>
              <p><strong>Time:</strong> {`${formatTime(activity.schedule?.[0]?.start_time)} - ${formatTime(activity.schedule?.[0]?.end_time)}`}</p>
              {activity.schedule?.[0]?.is_recurring !== "one-time" && (
                <p><strong>Recurring Days:</strong> {activity.schedule?.[0]?.recurring_days || "N/A"}</p>
              )}
            </div>
          </div>

          {/* University Partners */}
          {activity.university_partner === "true" && (
            <Collapsible className="border border-gray-300 rounded-md">
              <CollapsibleTrigger className="group w-full px-4 py-2 text-sm font-semibold text-[#7B1113] flex justify-between items-center bg-white rounded-t-md">
                <span>University Partners</span>
                <ChevronDown className="h-4 w-4 text-[#7B1113] transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-6 py-3 text-sm bg-white border-t border-gray-300">
                <p>{activity.partner_name || "None listed"}</p>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* SDG Goals */}
          <Collapsible className="border border-gray-300 rounded-md">
            <CollapsibleTrigger className="group w-full px-4 py-2 text-sm font-semibold text-[#7B1113] flex justify-between items-center bg-white rounded-t-md">
              <span>Sustainable Development Goals</span>
              <ChevronDown className="h-4 w-4 text-[#7B1113] transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-6 py-3 text-sm bg-white border-t border-gray-300">
              {formatSDGLabels(activity.sdg_goals).join(", ") || "None listed"}
            </CollapsibleContent>
          </Collapsible>

          {/* Status + Button */}
          <div className="space-y-2">
            <p><strong>Status:</strong> {activity.final_status || "Pending"}</p>
            {activity.drive_folder_link && (
              <a
                href={activity.drive_folder_link}
                className="inline-block bg-[#014421] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#012f18] transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Scanned Form
              </a>
            )}
          </div>
        </div>
      </ScrollArea>
    </DialogContent>
  );
};

const AdminPendingRequests = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("appeals");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Mock data for pending appeals and cancellations
  const pendingAppeals = Array.from({ length: 5 }, (_, i) => ({
    id: `appeal-${i + 1}`,
    submissionDate: "Submission Date",
    organization: "Organization",
    activityName: "Activity Name",
    activityType: "Activity Type",
    activityDate: "Activity Date",
    venue: "Venue",
    adviser: "Adviser"
  }));

  const getActivityTypeLabel = (id) => {
    return activityTypeOptions.find((opt) => opt.id === id)?.label || id;
  };

  const [incomingRequests, setIncomingRequests] = useState([]);
  useEffect(() => {
    const fetchIncoming = async () => {
      try {
        setLoading(true);
        const { data: sessionData, error } = await supabase.auth.getSession();
        const access_token = sessionData?.session?.access_token;
        
        if (!access_token) {
          console.error("No access token found");
          return;
        }
  
        if (!access_token) {
          console.error("No access token found");
          return;
        }
  
        const res = await axios.get("/api/activities/incoming", {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });
  
        console.log("Fetched incoming:", res.data);
        setIncomingRequests(res.data);
      } catch (error) {
        console.error("Failed to fetch incoming submissions:", error);
      } finally {
        setLoading(false); // stop loading
      }
    };
  
    fetchIncoming();
  }, []);  

  const handleViewDetails = (activity) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const handleApprove = async () => {
    try {
      // Here you would implement your API call to approve the activity
      // For example:
      // await approveActivity(selectedActivity.id);
      
      // Close the modal after successful approval
      setIsModalOpen(false);
      // You might want to update your list of activities here
    } catch (error) {
      console.error("Error approving activity:", error);
      // Handle error (show toast, etc.)
    }
  };

  const handleReject = async () => {
    try {
      // Here you would implement your API call to reject the activity
      // For example:
      // await rejectActivity(selectedActivity.id);
      
      // Close the modal after successful rejection
      setIsModalOpen(false);
      // You might want to update your list of activities here
    } catch (error) {
      console.error("Error rejecting activity:", error);
      // Handle error (show toast, etc.)
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-[#7B1113] mb-8">Pending Activity Requests</h1>

      <Tabs defaultValue="submissions" className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger 
            value="submissions" 
            className="data-[state=active]:bg-[#7B1113] data-[state=active]:text-white"
          >
            Incoming Submissions
          </TabsTrigger>
          <TabsTrigger 
            value="appeals" 
            className="data-[state=active]:bg-[#7B1113] data-[state=active]:text-white"
          >
            Appeals and Cancellations
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="appeals">
          <Card className="rounded-lg overflow-hidden shadow-md">
            <CardHeader className="py-3 px-6">
              <CardTitle className="text-xl font-bold text-[#7B1113]">
                Appeals and Cancellations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center ">Activity ID</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center">Submission Date</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center">Organization</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center">Activity Name</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center">Activity Type</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center">Activity Date</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center">Venue</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center">Adviser</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingAppeals.map((request) => (
                      <tr key={request.activity_id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm text-gray-700 text-center">{request.activity_id}</td>
                      <td className="px-5 py-4 text-sm text-gray-700 text-center">
                        {new Date(request.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 text-center break-words">
                        {request.organization?.org_name || "N/A"}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 text-center">{request.activity_name}</td>
                      <td className="px-5 py-4 text-sm text-gray-700 text-center">
                        {getActivityTypeLabel(request.activity_type)}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 text-center">
                        {new Date(request.schedule?.[0]?.start_date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 text-center">{request.venue}</td>
                      <td className="px-5 py-4 text-sm text-gray-700 text-center whitespace-nowrap">
                        {request.organization?.adviser_name || "N/A"}
                      </td>
                      <td className="px-5 py-4 text-sm text-center">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleViewDetails(request)}
                            className="text-gray-600 hover:text-[#7B1113] transition-transform transform hover:scale-125"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </div>
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
              <CardTitle className="text-xl font-bold text-[#7B1113]">
                Incoming Submissions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center whitespace-nowrap">Activity ID</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center whitespace-nowrap">Submission Date</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center whitespace-nowrap">Organization</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center whitespace-nowrap">Activity Name</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center whitespace-nowrap">Activity Type</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center whitespace-nowrap">Activity Date</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center whitespace-nowrap">Venue</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center whitespace-nowrap">Adviser</th>
                      <th className="px-5 py-3 text-sm font-medium text-[#014421] text-center whitespace-nowrap"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center text-gray-500 py-4">Loading incoming submissions...</td>
                    </tr>
                  ) : incomingRequests.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center text-gray-500 py-4">No incoming submissions.</td>
                    </tr>
                  ) : (
                      incomingRequests.map((request) => (
                        <tr key={request.activity_id} className="hover:bg-gray-50">
                          <td className="px-5 py-4 text-sm text-gray-700 text-center">{request.activity_id}</td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center">
                            {new Date(request.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center break-words">
                            {request.organization?.org_name || "N/A"}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center">{request.activity_name}</td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center">
                            {getActivityTypeLabel(request.activity_type)}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center">
                            {new Date(request.schedule?.[0]?.start_date).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center">{request.venue}</td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center whitespace-nowrap">
                            {request.organization?.adviser_name || "N/A"}
                          </td>
                          <td className="px-5 py-4 text-sm text-center">
                            <div className="flex justify-center">
                              <button
                                onClick={() => handleViewDetails(request)}
                                className="text-gray-600 hover:text-[#7B1113] transition-transform transform hover:scale-125"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Activity Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {selectedActivity && <ActivityDialogContent activity={selectedActivity} />}
      </Dialog>
    </div>
  );
};

export default AdminPendingRequests; 