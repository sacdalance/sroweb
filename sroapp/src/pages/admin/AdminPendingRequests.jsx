import { useState } from "react";
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
import { FileText, Calendar, Clock, User, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AdminPendingRequests = () => {
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

  // Mock data for incoming activity requests
  const incomingRequests = Array.from({ length: 6 }, (_, i) => ({
    id: `request-${i + 1}`,
    submissionDate: "Submission Date",
    organization: "Organization",
    activityName: "Activity Name",
    activityType: "Activity Type",
    activityDate: "Activity Date",
    venue: "Venue",
    adviser: "Adviser"
  }));

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

      <Tabs defaultValue="appeals" className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger 
            value="appeals" 
            className="data-[state=active]:bg-[#7B1113] data-[state=active]:text-white"
          >
            Appeals and Cancellations
          </TabsTrigger>
          <TabsTrigger 
            value="submissions" 
            className="data-[state=active]:bg-[#7B1113] data-[state=active]:text-white"
          >
            Incoming Submissions
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
                      <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Submission Date</th>
                      <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Organization</th>
                      <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Activity Name</th>
                      <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Activity Type</th>
                      <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Activity Date</th>
                      <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Venue</th>
                      <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Adviser</th>
                      <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingAppeals.map((appeal) => (
                      <tr key={appeal.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 text-sm text-gray-700">{appeal.submissionDate}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{appeal.organization}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{appeal.activityName}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{appeal.activityType}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{appeal.activityDate}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{appeal.venue}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{appeal.adviser}</td>
                        <td className="px-5 py-4 text-sm">
                          <Button
                            onClick={() => handleViewDetails(appeal)}
                            className="px-3 py-1 rounded-md bg-[#7B1113] hover:bg-[#5e0d0e] text-white text-xs"
                          >
                            Details
                          </Button>
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
                      <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Submission Date</th>
                      <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Organization</th>
                      <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Activity Name</th>
                      <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Activity Type</th>
                      <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Activity Date</th>
                      <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Venue</th>
                      <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Adviser</th>
                      <th className="px-5 py-3 text-left text-sm font-medium text-[#014421]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {incomingRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 text-sm text-gray-700">{request.submissionDate}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{request.organization}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{request.activityName}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{request.activityType}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{request.activityDate}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{request.venue}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{request.adviser}</td>
                        <td className="px-5 py-4 text-sm">
                          <Button
                            onClick={() => handleViewDetails(request)}
                            className="px-3 py-1 rounded-md bg-[#7B1113] hover:bg-[#5e0d0e] text-white text-xs"
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
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
                <p className="text-sm text-gray-700 mt-2">{selectedActivity.activityDescription}</p>
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