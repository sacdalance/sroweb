import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

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
    <div className="p-6">
      <Card className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 pb-3">
            <h1 className="text-xl font-bold text-[#7B1113]">Incoming Organization Recognition Applications</h1>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Submission Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Organization</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Organization Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Chairperson</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Adviser</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">{application.submissionDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{application.organization}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{application.organizationType}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{application.chairperson}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{application.adviser}</td>
                    <td className="px-6 py-4 text-sm">
                      <Button
                        onClick={() => handleViewDetails(application.id)}
                        className="px-4 py-1 rounded-md bg-[#7B1113] hover:bg-[#5b0d0f] text-white text-xs font-medium min-w-[70px]"
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