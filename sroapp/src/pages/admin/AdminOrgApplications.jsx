import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";
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
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

const AdminOrgApplications = () => {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchApplications = async () => {
      const { data, error } = await supabase
        .from("org_recognition")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) {
        console.error("Error fetching applications:", error.message);
      } else {
        setApplications(data);
      }
    };

    fetchApplications();
  }, []);

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setDialogOpen(true);
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#7B1113] mb-6">Organization Recognition Applications</h1>

      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="text-center">Submission Date</TableHead>
              <TableHead className="text-center">Organization</TableHead>
              <TableHead className="text-center">Organization Type</TableHead>
              <TableHead className="text-center">Chairperson</TableHead>
              <TableHead className="text-center">Adviser</TableHead>
              <TableHead className="text-center">Organizational Email</TableHead>
              <TableHead className="text-center"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.recognition_id}>
                <TableCell className="text-center">
                  {new Date(application.submitted_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-center">{application.org_name}</TableCell>
                <TableCell className="text-center">{application.organization_type}</TableCell>
                <TableCell className="text-center">{application.org_chairperson}</TableCell>
                <TableCell className="text-center">{application.org_adviser}</TableCell>
                <TableCell className="text-center">{application.org_email}</TableCell>
                <TableCell className="text-center">
                  <button
                    onClick={() => handleViewDetails(application)}
                    className="text-gray-600 hover:text-[#7B1113] hover:scale-125 transition-transform"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Organization Application Details</DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-2 text-sm">
              <div>
                <p className="font-medium text-gray-600">Submission Date</p>
                <p>{new Date(selectedApplication.submitted_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Organization Type</p>
                <p>{selectedApplication.organization_type}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Organization Name</p>
                <p>{selectedApplication.org_name}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Chairperson</p>
                <p>{selectedApplication.org_chairperson}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Adviser</p>
                <p>{selectedApplication.org_adviser}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Co-Adviser</p>
                <p>{selectedApplication.org_coadviser}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Email</p>
                <p>{selectedApplication.org_email}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Chairperson Email</p>
                <p>{selectedApplication.chairperson_email}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Adviser Email</p>
                <p>{selectedApplication.adviser_email}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Co-Adviser Email</p>
                <p>{selectedApplication.coadviser_email}</p>
              </div>

              {/* Documents */}
              <div className="md:col-span-2 pt-4">
                <p className="font-medium text-gray-600 mb-2">Documents</p>
                <div className="flex flex-wrap gap-2">
                  {(JSON.parse(selectedApplication.submission_file_url) || []).map((file, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={file} target="_blank" rel="noopener noreferrer">
                        View File {i + 1}
                      </a>
                    </Button>
                  ))}
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
