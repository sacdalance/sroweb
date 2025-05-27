import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { FileText, UploadCloud, Loader2, Check, ChevronDown } from "lucide-react";
import { toast, Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { fetchOrganizations, submitAnnualReport } from "@/api/annualReportAPI";
import supabase from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

// Academic year options
const academicYearOptions = [
  "2024-2025",
  "2025-2026",
  "2026-2027",
  "2027-2028"
];

const AnnualReport = () => {
  // === STATE HOOKS ===
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [orgOptions, setOrgOptions] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [annualReportEmail, setAnnualReportEmail] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [userId, setUserId] = useState(null);

  // UI/UX state for dropdowns/search and dialog
  const [orgPopoverOpen, setOrgPopoverOpen] = useState(false);
  const [orgSearchTerm, setOrgSearchTerm] = useState("");
  const [yearPopoverOpen, setYearPopoverOpen] = useState(false);
  const [yearSearchTerm, setYearSearchTerm] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Field validation error states (for per-field feedback)
  const [fieldErrors, setFieldErrors] = useState({});

  // === VALIDATION HELPERS ===

  // Set/unset error for a given field
  const setFieldError = (field, hasError) => setFieldErrors(prev => ({ ...prev, [field]: hasError }));

  // Email validation: must be @gmail.com or @up.edu.ph, strict (no extra chars after .com/.ph)
  const isValidEmail = (email) => /^[a-zA-Z0-9._%+-]+@(gmail\.com|up\.edu\.ph)$/i.test(email.trim());

  // Filter org options based on search term (case insensitive)
  const filteredOrgs = orgOptions.filter((org) =>
    org.org_name.toLowerCase().includes(orgSearchTerm.toLowerCase())
  );

  // Filter academic year options based on search
  const filteredYears = academicYearOptions.filter((year) =>
    year.toLowerCase().includes(yearSearchTerm.toLowerCase())
  );

  // === DATA FETCHING ===

  // Fetch user ID (for submission metadata)
  useEffect(() => {
    const fetchUserAccount = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return;
      const { data, error: fetchErr } = await supabase
        .from("account")
        .select("account_id")
        .eq("email", user.email)
        .single();
      if (!fetchErr && data) setUserId(data.account_id);
    };
    fetchUserAccount();
  }, []);

  // Fetch orgs for org dropdown
  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const data = await fetchOrganizations();
        setOrgOptions(data);
      } catch {
        toast.error("Failed to load organizations.");
      }
    };
    loadOrgs();
  }, []);

  // === VALIDATION CHECKS FOR ALL FIELDS ===
  const validateFields = () => {
    let valid = true;
    if (!selectedOrg) { setFieldError("org", true); valid = false; } else setFieldError("org", false);
    if (!annualReportEmail || !isValidEmail(annualReportEmail)) { setFieldError("annualReportEmail", true); valid = false; } else setFieldError("annualReportEmail", false);
    if (!academicYear) { setFieldError("academicYear", true); valid = false; } else setFieldError("academicYear", false);
    if (files.length !== 2) { setFieldError("files", true); valid = false; } else setFieldError("files", false);
    return valid;
  };

  // === FILE UPLOAD HANDLERS ===
  const handleFileChange = (e) => {
    if (files.length >= 2 || isUploading) return;
    const incomingFiles = Array.from(e.target.files);
    const pdfFiles = incomingFiles.filter((file) => file.type === "application/pdf");
    if (pdfFiles.length !== incomingFiles.length) {
      toast.error("Only PDF files are allowed.");
      setFieldError("files", true);
      return;
    }
    if (files.length + pdfFiles.length > 2) {
      toast.error("You can only upload exactly 2 PDF files.");
      setFieldError("files", true);
      return;
    }
    setFiles([...files, ...pdfFiles]);
    setFieldError("files", false);
  };
  const handleRemoveFile = (idx) => {
    if (isUploading) return;
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    if (updated.length === 2) setFieldError("files", false);
  };

  // === FORM SUBMISSION ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields()) {
      toast.error("Please fill out all required fields correctly.");
      return;
    }
    setIsUploading(true);
    toast.loading("Submitting...");
    try {
      await submitAnnualReport({
        org_id: selectedOrgId,
        submitted_by: userId,
        academic_year: academicYear,
        files,
      });
      toast.success("Submitted successfully!");
      setFiles([]);
      setAcademicYear("");
      setSelectedOrg("");
      setSelectedOrgId("");
      setAnnualReportEmail("");
      setFieldErrors({});
    } catch (error) {
      toast.error(error.message || "Submission failed.");
    } finally {
      toast.dismiss();
      setIsUploading(false);
    }
  };

  // Required forms download links
  const formLinks = [
    {
      name: "Revised OSA Form D: Report on Past Activities, including partnerships",
      url: "https://docs.google.com/document/d/1xO70gKiSKL2p18cAsq255oSPM1S5ehxm"
    },
    {
      name: "Financial Report (Form F), AY 202X-202X",
      url: "https://docs.google.com/document/d/1VjY-6qXvvNzMpZPIz_ONX-sGBnL32y7A"
    }
  ];

  // Drag-drop disables when 2 files already or during upload
  const dragDropDisabled = files.length >= 2 || isUploading;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Toaster />
      <h1 className="text-2xl sm:text-3xl font-bold text-[#7B1113] mb-8 text-left">Annual Report</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Fields Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-6">
          {/* Organization Name (searchable dropdown) */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Organization Name <span className="text-red-600">*</span>
            </label>
            <Popover open={orgPopoverOpen} onOpenChange={setOrgPopoverOpen}>
              <PopoverTrigger asChild>
                <div
                  className={cn(
                    "w-full flex items-center justify-between border bg-transparent rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring hover:border-gray-400 transition-colors",
                    fieldErrors.org && "border-[#7B1113] bg-red-50"
                  )}
                >
                  <span className={cn(!selectedOrg && "text-muted-foreground")}>
                    {selectedOrg || "Type your org name..."}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </div>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-full max-w-md p-0">
                <Input
                  placeholder="Search organization..."
                  value={orgSearchTerm}
                  onChange={e => setOrgSearchTerm(e.target.value)}
                  className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                />
                <div className="max-h-48 overflow-y-auto">
                  {filteredOrgs.length > 0 ? (
                    filteredOrgs.map((org) => (
                      <button
                        key={org.org_id}
                        onClick={() => {
                          setSelectedOrg(org.org_name);
                          setSelectedOrgId(org.org_id);
                          setAnnualReportEmail(org.org_email || "");
                          setOrgSearchTerm("");
                          setOrgPopoverOpen(false);
                          setFieldError("org", false);
                        }}
                        type="button"
                        className={cn(
                          "w-full text-left px-4 py-2 hover:bg-gray-100",
                          selectedOrg === org.org_name && "bg-gray-100 font-medium"
                        )}
                        disabled={isUploading}
                      >
                        {org.org_name}
                        {selectedOrg === org.org_name && (
                          <Check className="ml-2 inline h-4 w-4 text-green-600" />
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-2 text-sm text-muted-foreground">No results found</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {fieldErrors.org && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                Please select your organization.
              </p>
            )}
          </div>

          {/* Organization E-mail (filled and disabled if org picked) */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Organization E-mail <span className="text-red-600">*</span>
            </label>
            <Input
              id="annualReportEmail"
              type="email"
              value={annualReportEmail}
              onChange={e => {
                setAnnualReportEmail(e.target.value);
                if (isValidEmail(e.target.value)) setFieldError("annualReportEmail", false);
              }}
              onBlur={e => setFieldError("annualReportEmail", !isValidEmail(e.target.value))}
              placeholder="orgemail@gmail.com"
              disabled={!!selectedOrg || isUploading} // disables after org is picked
              className={cn(
                "w-full px-3 py-2 rounded-md text-sm",
                fieldErrors.annualReportEmail && "border-[#7B1113] bg-red-50"
              )}
              autoComplete="email"
            />
            {fieldErrors.annualReportEmail && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                Must be a valid UP or Gmail address.
              </p>
            )}
          </div>

          {/* Academic Year (searchable dropdown, same UX as org) */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Academic Year <span className="text-red-600">*</span>
            </label>
            <Popover open={yearPopoverOpen} onOpenChange={setYearPopoverOpen}>
              <PopoverTrigger asChild>
                <div
                  className={cn(
                    "w-full flex items-center justify-between border bg-transparent rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring hover:border-gray-400 transition-colors",
                    fieldErrors.academicYear && "border-[#7B1113] bg-red-50"
                  )}
                >
                  <span className={cn(!academicYear && "text-muted-foreground")}>
                    {academicYear || "Select academic year from the list"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </div>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-full max-w-md p-0">
                <Input
                  placeholder="Search academic year..."
                  value={yearSearchTerm}
                  onChange={e => setYearSearchTerm(e.target.value)}
                  className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                />
                <div className="max-h-48 overflow-y-auto">
                  {filteredYears.length > 0 ? (
                    filteredYears.map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          setAcademicYear(year);
                          setYearPopoverOpen(false);
                          setYearSearchTerm("");
                          setFieldError("academicYear", false);
                        }}
                        type="button"
                        className={cn(
                          "w-full text-left px-4 py-2 hover:bg-gray-100",
                          academicYear === year && "bg-gray-100 font-medium"
                        )}
                        disabled={isUploading}
                      >
                        {year}
                        {academicYear === year && (
                          <Check className="ml-2 inline h-4 w-4 text-green-600" />
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-2 text-sm text-muted-foreground">No results found</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {fieldErrors.academicYear && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                Please select an academic year.
              </p>
            )}
          </div>
        </div>

        {/* Forms & Files Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Required Forms <span className="text-red-600">*</span>
            </CardTitle>
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
            {/* Drag & Drop */}
            <div
              onDragOver={e => {
                if (dragDropDisabled) return;
                e.preventDefault();
                setIsDragActive(true);
              }}
              onDragLeave={e => {
                if (dragDropDisabled) return;
                e.preventDefault();
                setIsDragActive(false);
              }}
              onDrop={e => {
                if (dragDropDisabled) return;
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
                dragDropDisabled
                  ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                  : isDragActive
                  ? "border-green-600 bg-green-50"
                  : "border-gray-300 hover:border-gray-400 hover:bg-muted"
              )}
              style={{ pointerEvents: dragDropDisabled ? "none" : "auto" }}
            >
              <label htmlFor="annualReportFileUpload" className={cn(
                "cursor-pointer flex flex-col items-center",
                dragDropDisabled && "cursor-not-allowed opacity-70"
              )}>
                <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm">
                  {dragDropDisabled
                    ? "You cannot upload or drag files after completion."
                    : isDragActive
                    ? "Drop the file here"
                    : "Drag and Drop or Upload PDF File (exactly 2 required)"
                  }
                </p>
                <input
                  id="annualReportFileUpload"
                  name="files"
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={dragDropDisabled}
                />
              </label>
            </div>
            {fieldErrors.files && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                Please upload exactly 2 PDF files.
              </p>
            )}
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
                        className={cn(
                          "text-gray-500 hover:text-red-600",
                          isUploading && "cursor-not-allowed opacity-50"
                        )}
                        disabled={isUploading}
                      >
                        &times;
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              type="button"
              className="w-full py-2 rounded-md text-base bg-[#014421] text-white hover:bg-[#003218]"
              disabled={
                !selectedOrg ||
                !annualReportEmail.trim() ||
                !academicYear ||
                files.length !== 2 ||
                isUploading
              }
              onClick={() => setShowConfirmDialog(true)}
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
        {/* Confirmation Dialog, matching ActivityForm */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Submit Annual Report
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to submit this annual report? You cannot edit after submission.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={async (e) => {
                  setShowConfirmDialog(false);
                  await handleSubmit(e);
                }}
                disabled={isUploading}
                className="bg-[#014421] text-white hover:bg-[#003218] px-6"
              >
                {isUploading ? "Submitting..." : "Submit"}
              </AlertDialogAction>
              <AlertDialogCancel
                onClick={() => setShowConfirmDialog(false)}
                disabled={isUploading}
              >
                Cancel
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </div>
  );
};

export default AnnualReport;
