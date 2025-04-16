import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { FileText, UploadCloud, Loader2, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const AnnualReport = () => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  const [orgOptions, setOrgOptions] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [annualReportEmail, setAnnualReportEmail] = useState("");

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const filteredOrgs = orgOptions.filter((org) =>
    org.org_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch("/api/organization/list");
        const data = await response.json();
        setOrgOptions(data);
      } catch (err) {
        console.error("Failed to load orgs", err);
      }
    };

    fetchOrganizations();
  }, []);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setUploadStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadStatus("Uploading files to Google Drive...");

    try {
      const uploadPromises = files.map(file => uploadToGoogleDrive(file));
      await Promise.all(uploadPromises);
      setUploadStatus("Submission Sent! Your files have been successfully uploaded.");
      setFiles([]);
    } catch (error) {
      console.error("Upload failed", error);
      setUploadStatus("Error uploading files. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const uploadToGoogleDrive = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', "Annual Reports");
    formData.append('submissionType', "Annual Report");

    const response = await fetch("/api/upload-to-drive", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to upload");
    return response.json();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-8 text-center">Annual Report Submission</h1>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
        {/* Organization Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Organization Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Organization Name</label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <div className="w-full border px-3 py-2 rounded-md flex justify-between items-center cursor-pointer">
                    <span className={cn(!selectedOrg && "text-muted-foreground")}>
                      {selectedOrg || "Type or select your org"}
                    </span>
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
              <label className="text-sm font-medium mb-1 block">Organization Email</label>
              <Input
                type="email"
                value={annualReportEmail}
                onChange={(e) => setAnnualReportEmail(e.target.value)}
                placeholder="orgname@domain.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Annual Report Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Revised OSA Form D (Report on Past Activities)
                <Button variant="link" className="ml-auto text-xs">Download</Button>
              </li>
              <li className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Financial Report (Form F)
                <Button variant="link" className="ml-auto text-xs">Download</Button>
              </li>
            </ul>

            <div className="border-2 border-dashed border-gray-300 p-4 rounded-md text-center">
              <label htmlFor="annualReportFileUpload" className="cursor-pointer flex flex-col items-center">
                <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm">Click or drag files to upload</p>
                <input
                  id="annualReportFileUpload"
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
                    <li key={idx} className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-500" />
                      {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {uploadStatus && (
              <div className={cn(
                "text-sm px-3 py-2 rounded-md",
                uploadStatus.includes("successfully") ? "bg-green-100 text-green-800" :
                uploadStatus.includes("Error") ? "bg-red-100 text-red-800" :
                "bg-blue-100 text-blue-800"
              )}>
                {uploadStatus}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={files.length === 0 || isUploading}
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  Uploading...
                </span>
              ) : "Submit Form"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default AnnualReport;
