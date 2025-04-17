import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { FileText, UploadCloud, Loader2, Check, ChevronDown } from "lucide-react";
import { toast, Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { fetchOrganizations } from "@/api/annualReportAPI";
import { submitAnnualReport } from "@/api/annualReportAPI";

const AnnualReport = () => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [orgOptions, setOrgOptions] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [annualReportEmail, setAnnualReportEmail] = useState("");


  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [academicYear, setAcademicYear] = useState("");

  const [userId, setUserId] = useState(null); // from session/auth
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const filteredOrgs = orgOptions.filter((org) =>
    org.org_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const data = await fetchOrganizations();
        setOrgOptions(data);
      } catch (err) {
        toast.error("Failed to load organizations.");
      }
    };
    loadOrgs();
  }, []);

  const handleFileChange = (e) => {
    const incomingFiles = Array.from(e.target.files);
    const pdfFiles = incomingFiles.filter((file) => file.type === "application/pdf");
  
    if (pdfFiles.length === 0) {
      toast.error("Only PDF files are allowed.");
      return;
    }
  
    const combinedFiles = [...files, ...pdfFiles];
  
    if (combinedFiles.length > 2) {
      toast.error("You can only upload up to 2 PDF files.");
      return;
    }
  
    setFiles(combinedFiles);
  };

  const handleRemoveFile = (indexToRemove) => {
    const newFiles = files.filter((_, idx) => idx !== indexToRemove);
    setFiles(newFiles);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length !== 2) {
      toast.error("You must upload exactly 2 files.");
      return;
    }
  

    setIsUploading(true);
    toast.loading("Submitting...");
  
    try {
      await submitAnnualReport({
        org_id: '',         // get from dropdown or fetch (change this)
        submitted_by: userId,          // from auth/session
        academic_year: '',   // from form input (change this)
        files,
      });
  
      toast.success("Submitted successfully!");
      setFiles([]);
    } catch (error) {
      toast.error(error.message || "Submission failed.");
    } finally {
      toast.dismiss();
      setIsUploading(false);
    }
  };

  const formLinks = [
    {
      name: "Revised OSA Form D: Report on Past Activities, including partnerships",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
      name: "Financial Report (Form F), AY 202X-202X",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Toaster />
      <h1 className="text-3xl font-semibold mb-8 text-center">Annual Report</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium block mb-1">Organization Name</label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <div className="w-full border px-3 py-2 rounded-md flex justify-between items-center cursor-pointer">
                  <span className={cn(!selectedOrg && "text-muted-foreground")}>{selectedOrg || "Select your Organization"}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-full max-w-md">
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-none border-none"
                />
                <div className="max-h-60 overflow-y-auto">
                  {filteredOrgs.length > 0 ? (
                    filteredOrgs.map((org) => (
                      <button
                        type="button"
                        key={org.org_id}
                        onClick={() => {
                          setSelectedOrg(org.org_name);
                          // setSelectedOrgId(org.org_id);
                          setAnnualReportEmail(org.org_email);
                          setSearchTerm(org.org_name);
                          setOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 hover:bg-muted/50",
                          selectedOrg === org.org_name && "bg-muted font-medium"
                        )}
                      >
                        {org.org_name}
                        {selectedOrg === org.org_name && (
                          <Check className="ml-2 inline h-4 w-4 text-green-600" />
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-2 text-sm text-muted-foreground">No results</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Organization E-mail</label>
            <Input
              type="email"
              value={annualReportEmail}
              onChange={(e) => setAnnualReportEmail(e.target.value)}
              placeholder="orgemail@gmail.com"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Required Forms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          {formLinks.map((form, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{form.name}</span>
              <Button asChild variant="outline" size="sm">
                <a href={form.url} target="_blank" rel="noopener noreferrer">
                  Download
                </a>
              </Button>
            </div>
          ))}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragActive(false);
              
                const dataTransferEvent = {
                  target: {
                    files: e.dataTransfer.files,
                  },
                };
              
                handleFileChange(dataTransferEvent);
              }}
              className={cn(
                "border-2 border-dashed p-4 rounded-md text-center transition-colors",
                isDragActive
                  ? "border-green-600 bg-green-50"
                  : "border-gray-300 hover:border-gray-400 hover:bg-muted"
              )}
            >
              <label htmlFor="annualReportFileUpload" className="cursor-pointer flex flex-col items-center">
                <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm">
                  {isDragActive ? "Drop the file here" : "Drag and Drop or Upload File"}
                </p>
                <input
                  id="annualReportFileUpload"
                  name="files"
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>

            {files.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Selected Files</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {files.map((file, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between bg-muted px-3 py-2 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-red-500" />
                        <span className="truncate max-w-[200px]">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        &times;
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={files.length !== 2   || isUploading}
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  Uploading...
                </span>
              ) : (
                "Submit Form"
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default AnnualReport;