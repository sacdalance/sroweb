import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
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
import { Eye, Download } from "lucide-react";

const AdminOrgApplications = () => {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [decisionType, setDecisionType] = useState(null); // true = approve, false = decline

  const navigate = useNavigate();

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

  const openConfirmationDialog = (isRecognized) => {
    setDecisionType(isRecognized);
    setConfirmOpen(true);
  };

  const confirmDecision = async () => {
    if (!selectedApplication || decisionType === null) return;

    try {
      const response = await fetch("/api/org-applications/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recognition_id: selectedApplication.recognition_id,
          is_recognized: decisionType,
        }),
      });

      if (!response.ok) throw new Error("Failed to update");

      toast.success(`Organization ${decisionType ? "recognized" : "declined"} successfully.`);
      setDialogOpen(false);
      setConfirmOpen(false);
      setDecisionType(null);
      navigate("/admin");
    } catch (err) {
      toast.error("An error occurred. Try again.");
      console.error(err);
    }
  };

  const categoriesList = [
    { id: "academic", name: "Academic & Socio-Academic Student Organizations" },
    { id: "socio-civic", name: "Socio-Civic/Cause-Oriented Organizations" },
    { id: "fraternity", name: "Fraternity/Sorority/Confraternity" },
    { id: "performing", name: "Performing Groups" },
    { id: "political", name: "Political Organizations" },
    { id: "regional", name: "Regional/Provincial and Socio-Cultural Organizations" },
    { id: "special", name: "Special Interests Organizations" },
    { id: "sports", name: "Sports and Recreation Organizations" },
    { id: "probation", name: "On Probation Organizations" },
  ];

  const getCategoryName = (id) => {
    return categoriesList.find((cat) => cat.id === id)?.name || id;
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
                <TableCell className="text-center">{getCategoryName(application.org_type)}</TableCell>
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

      {/* Application Detail Dialog */}
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
                <p>{getCategoryName(selectedApplication.org_type)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Organization Name</p>
                <p>{selectedApplication.org_name}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Organization Email</p>
                <p>{selectedApplication.org_email}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Chairperson</p>
                <p>{selectedApplication.org_chairperson}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Chairperson Email</p>
                <p>{selectedApplication.chairperson_email}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Adviser</p>
                <p>{selectedApplication.org_adviser}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Adviser Email</p>
                <p>{selectedApplication.adviser_email}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Co-Adviser</p>
                <p>{selectedApplication.org_coadviser}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Co-Adviser Email</p>
                <p>{selectedApplication.coadviser_email}</p>
              </div>

              {/* Drive Folder Link */}
              <div className="md:col-span-2 pt-4">
                <p className="font-medium text-gray-600 mb-2">Drive Folder</p>
                <Button
                  className="bg-[#014421] hover:bg-[#013319] text-white font-medium px-4 py-2"
                  asChild
                >
                  <a
                    href={selectedApplication.drive_folder_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Drive Folder
                  </a>
                </Button>
              </div>

              {/* Recognize / Decline Buttons */}
              <div className="md:col-span-2 flex gap-4 pt-4">
                <Button
                  className="bg-[#014421] hover:bg-[#013319] text-white font-medium px-4 py-2"
                  onClick={() => openConfirmationDialog(true)}
                >
                  Approve
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2"
                  onClick={() => openConfirmationDialog(false)}
                >
                  Decline
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionType ? "Approve Organization?" : "Decline Organization?"}
            </DialogTitle>
            <p className="text-sm text-gray-500">
              Are you sure you want to {decisionType ? "APPROVE" : "DECLINE"} this organization?
            </p>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className={decisionType ? "bg-[#014421] text-white" : "bg-red-600 text-white"}
              onClick={confirmDecision}
            >
              {decisionType ? "Approve" : "Decline"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrgApplications;
