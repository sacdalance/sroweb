import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Eye, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AdminOrgApplications = () => {
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data for organization applications
  const applications = Array.from({ length: 15 }, (_, i) => ({
    id: `app-${i + 1}`,
    submissionDate: "Submission Date",
    organization: "Organization",
    organizationType: "Organization Type",
    chairperson: "Chairperson",
    adviser: "Adviser",
    organizationalEmail: "organization@example.com",
    // Additional details for the modal
    description: "Organization description goes here. This is a sample description of the organization's purpose and activities.",
    members: 50,
    email: "organization@example.com",
    phone: "09123456789",
    address: "123 Organization Street, Baguio City",
    constitution: "Sample Constitution.pdf",
    bylaws: "Sample Bylaws.pdf"
  }));

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#7B1113] mb-6">Organization Recognition Applications</h1>
      
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="border-b-0">
              <TableHead className="w-[150px] text-sm font-semibold text-black text-center py-5">Submission Date</TableHead>
              <TableHead className="w-[200px] text-sm font-semibold text-black text-center py-5">Organization</TableHead>
              <TableHead className="w-[150px] text-sm font-semibold text-black text-center py-5">Organization Type</TableHead>
              <TableHead className="w-[200px] text-sm font-semibold text-black text-center py-5">Chairperson</TableHead>
              <TableHead className="w-[200px] text-sm font-semibold text-black text-center py-5">Adviser</TableHead>
              <TableHead className="w-[200px] text-sm font-semibold text-black text-center py-5">Organizational Email</TableHead>
              <TableHead className="w-[100px] text-sm font-semibold text-black text-center py-5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id} className="border-b border-gray-100">
                <TableCell className="py-5 text-sm text-gray-700 text-center">{application.submissionDate}</TableCell>
                <TableCell className="py-5 text-sm text-gray-700 text-center">{application.organization}</TableCell>
                <TableCell className="py-5 text-sm text-gray-700 text-center">{application.organizationType}</TableCell>
                <TableCell className="py-5 text-sm text-gray-700 text-center">{application.chairperson}</TableCell>
                <TableCell className="py-5 text-sm text-gray-700 text-center">{application.adviser}</TableCell>
                <TableCell className="py-5 text-sm text-gray-700 text-center">{application.organizationalEmail}</TableCell>
                <TableCell className="py-5">
                  <div className="flex items-center justify-center">
                    <button
                            onClick={() => handleViewDetails(application)}
                            className="text-gray-600 hover:text-[#7B1113] transition-transform transform hover:scale-125"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Organization Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Submission Date</p>
                  <p className="text-sm">{selectedApplication.submissionDate}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Organization Type</p>
                  <p className="text-sm">{selectedApplication.organizationType}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Organization Name</p>
                <p className="text-sm">{selectedApplication.organization}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-sm">{selectedApplication.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Chairperson</p>
                  <p className="text-sm">{selectedApplication.chairperson}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Adviser</p>
                  <p className="text-sm">{selectedApplication.adviser}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm">{selectedApplication.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-sm">{selectedApplication.phone}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-sm">{selectedApplication.address}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Number of Members</p>
                <p className="text-sm">{selectedApplication.members}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Documents</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    {selectedApplication.constitution}
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    {selectedApplication.bylaws}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrgApplications; 