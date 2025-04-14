import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const AdminOrgApplications = () => {
  // Mock data for organization applications
  const applications = Array.from({ length: 15 }, (_, i) => ({
    id: `app-${i + 1}`,
    submissionDate: "Submission Date",
    organization: "Organization",
    organizationType: "Organization Type",
    chairperson: "Chairperson",
    adviser: "Adviser"
  }));

  const handleViewDetails = (id) => {
    console.log(`Viewing details for: ${id}`);
    // Logic to view details in modal or navigate to details page
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-[#8B0000] mb-8">Incoming Organization Recognition Applications</h1>

      <Card className="rounded-lg overflow-hidden shadow-md">
        <CardHeader className="bg-[#8B0000]/10 py-4">
          <CardTitle className="text-xl font-bold text-[#8B0000]">Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-500">Submission Date</th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-500">Organization</th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-500">Organization Type</th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-500">Chairperson</th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-500">Adviser</th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {applications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm text-gray-700">{application.submissionDate}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{application.organization}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{application.organizationType}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{application.chairperson}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{application.adviser}</td>
                    <td className="px-5 py-4 text-sm">
                      <Button
                        onClick={() => handleViewDetails(application.id)}
                        className="px-3 py-1 rounded-md bg-[#8B0000] hover:bg-[#6b0000] text-white text-xs"
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
    </div>
  );
};

export default AdminOrgApplications; 