import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const AdminPendingRequests = () => {
  const [activeTab, setActiveTab] = useState("appeals");

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

  const handleViewDetails = (id) => {
    console.log(`Viewing details for: ${id}`);
    // Logic to view details in modal or navigate to details page
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
            <CardHeader className="bg-[#7B1113]/10 py-4">
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
                            onClick={() => handleViewDetails(appeal.id)}
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
            <CardHeader className="bg-[#7B1113]/10 py-4">
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
                            onClick={() => handleViewDetails(request.id)}
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
    </div>
  );
};

export default AdminPendingRequests; 