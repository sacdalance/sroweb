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
import { FileText, Calendar, Clock, User, X, Check, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 text-center text-sm font-medium text-[#014421] text-center">Submission Date</th>
                      <th className="px-5 py-3 text-center text-sm font-medium text-[#014421] text-center">Organization</th>
                      <th className="px-5 py-3 text-center text-sm font-medium text-[#014421] text-center">Activity Name</th>
                      <th className="px-5 py-3 text-center text-sm font-medium text-[#014421] text-center">Activity Type</th>
                      <th className="px-5 py-3 text-center text-sm font-medium text-[#014421] text-center">Activity Date</th>
                      <th className="px-5 py-3 text-center text-sm font-medium text-[#014421] text-center">Venue</th>
                      <th className="px-5 py-3 text-center text-sm font-medium text-[#014421] text-center">Adviser</th>
                      <th className="px-5 py-3 text-center text-sm font-medium text-[#014421] text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingAppeals.map((appeal) => (
                      <tr key={appeal.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 text-center text-sm text-gray-700 text-center">{appeal.submissionDate}</td>
                        <td className="px-5 py-4 text-center text-sm text-gray-700 text-center">{appeal.organization}</td>
                        <td className="px-5 py-4 text-center text-sm text-gray-700 text-center">{appeal.activityName}</td>
                        <td className="px-5 py-4 text-center text-sm text-gray-700 text-center">{appeal.activityType}</td>
                        <td className="px-5 py-4 text-center text-sm text-gray-700 text-center">{appeal.activityDate}</td>
                        <td className="px-5 py-4 text-center text-sm text-gray-700 text-center">{appeal.venue}</td>
                        <td className="px-5 py-4 text-center text-sm text-gray-700 text-center">{appeal.adviser}</td>
                        <td className="px-5 py-4 text-center text-sm">
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
                      <th className="px-5 py-3 text-center text-sm font-medium text-[#014421] text-center">Submission Date</th>
                      <th className="px-5 py-3 text-center text-sm font-medium text-[#014421] text-center">Organization</th>
                      <th className="px-5 py-3 text-center text-sm font-medium text-[#014421] text-center">Activity Name</th>
                      <th className="px-5 py-3 text-center text-sm font-medium text-[#014421] text-center">Activity Type</th>
                      <th className="px-5 py-3 text-center text-sm font-medium text-[#014421] text-center">Activity Date</th>
                      <th className="px-5 py-3 text-center text-sm font-medium text-[#014421] text-center">Venue</th>
                      <th className="px-5 py-3 text-center text-sm font-medium text-[#014421] text-center">Adviser</th>
                      <th className="px-5 py-3 text-center text-sm font-medium text-[#014421] text-center w-20">Actions</th>
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
                          <td className="px-5 py-4 text-sm text-gray-700 text-center">{new Date(request.schedule?.[0]?.start_date).toLocaleDateString()}</td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center">{request.organization?.org_name || "N/A"}</td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center">{request.activity_name}</td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center">{request.activity_type}</td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center">{request.schedule?.[0]?.start_time || "N/A"}</td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center">{request.venue}</td>
                          <td className="px-5 py-4 text-sm text-gray-700 text-center">{request.organization?.adviser_name || "N/A"}</td>
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
        <DialogContent className="max-w-[1000px] w-[90vw] sm:w-[85vw] mx-auto">
          <DialogHeader className="px-2">
            <DialogTitle className="text-xl font-bold text-[#7B1113]">Activity Details</DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-6 px-2">
              {/* Activity Title, Description and Organization */}
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">{selectedActivity.activityName}</h2>
                <p className="text-sm text-gray-600">{selectedActivity.organization}</p>
                <p className="text-sm text-gray-700 text-center mt-2">{selectedActivity.activityDescription}</p>
              </div>

              {/* General Information */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#7B1113]">General Information</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                  <div className="flex">
                    <span className="w-32 text-gray-600">Activity Type:</span>
                    <span>{selectedActivity.activityType}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Adviser Name:</span>
                    <span>{selectedActivity.adviser}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Charge Fee:</span>
                    <span>No</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Adviser Contact:</span>
                    <span>{selectedActivity.adviserContact || "09123456789"}</span>
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#7B1113]">Specifications</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                  <div className="flex">
                    <span className="w-32 text-gray-600">Venue:</span>
                    <span>{selectedActivity.venue}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Green Monitor:</span>
                    <span>Monitor</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Venue Approver:</span>
                    <span>Approver</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Monitor Contact:</span>
                    <span>Contact</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Venue Contact:</span>
                    <span>Contact</span>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#7B1113]">Schedule</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex">
                    <span className="w-32 text-gray-600">Date:</span>
                    <span>{selectedActivity.activityDate}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Time:</span>
                    <span>10:00 AM - 2:00 PM</span>
                  </div>
                </div>
              </div>

              {/* University Partners */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#7B1113]">University Partners</h3>
                <div className="text-sm">
                  <p>Department of Mathematics and Computer Science</p>
                </div>
              </div>

              {/* List of Sustainable Development Goals */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#7B1113]">List of Sustainable Development Goals</h3>
                <div className="flex gap-2">
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">No Poverty</span>
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">Good Health and Well-being</span>
                </div>
              </div>

              {/* Bottom Section with Status and View Form Button */}
              <div className="flex justify-between items-center">
                <Button 
                  className="text-sm bg-[#014421] hover:bg-[#013319] text-white"
                >
                  View Scanned Form
                </Button>
                <Badge 
                  variant={selectedActivity.status === 'Approved' ? 'success' : 'warning'}
                  className="text-sm px-4 py-1"
                >
                  {selectedActivity.status}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPendingRequests; 