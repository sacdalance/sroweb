import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { toast, Toaster } from "sonner";
import { cn, sanitizeInput } from "@/lib/utils";
import { fetchOrganizations, submitAnnualReport } from "@/api/annualReportAPI";
import supabase from "@/lib/supabase";
import FileDropzone from "@/components/ui/file-dropzone";
import { annualReportSchema } from "@/lib/zodSchemas";
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
    const payload = { org: selectedOrg, academicYear, files };
    const result = annualReportSchema.safeParse(payload);

    if (!result.success) {
      const newErrors = {};
      result.error.issues.forEach((issue) => {
        newErrors[issue.path[0]] = issue.message;
      });
      setFieldErrors(newErrors);
      return false;
    }
    return true;
  };

  // === FILE UPLOAD HANDLER (for FileDropzone) ===
  const handleFilesChange = (newFiles) => {
    setFiles(newFiles);
    if (newFiles.length === 2) {
      setFieldError("files", null);
    }
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

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Toaster />
      <h1 className="page-header text-black">Annual Report</h1>
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
                    fieldErrors.org && "border-sro-primary bg-red-50"
                  )}
                >
                  <span className={cn(!selectedOrg && "text-muted-foreground")}>
                    {selectedOrg || "Type your org name..."}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </div>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="p-0"
                style={{ width: "var(--radix-popover-trigger-width)" }}
              >
                <Input
                  placeholder="Search org..."
                  value={orgSearchTerm}
                  onChange={(e) => setOrgSearchTerm(sanitizeInput(e.target.value))}
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
              <p className="text-xs text-sro-primary mt-1 px-1 font-medium">
                {fieldErrors.org}
              </p>
            )}
          </div>

          {/* Organization E-mail (auto-filled from org, read-only) */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Organization E-mail
            </label>
            <Input
              id="annualReportEmail"
              type="email"
              value={annualReportEmail}
              readOnly
              disabled
              placeholder="Select an organization to autofill"
              className="w-full px-3 py-2 rounded-md text-sm bg-gray-50"
            />
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
                    fieldErrors.academicYear && "border-sro-primary bg-red-50"
                  )}
                >
                  <span className={cn(!academicYear && "text-muted-foreground")}>
                    {academicYear || "Select academic year from the list"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </div>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="p-0"
                style={{ width: "var(--radix-popover-trigger-width)" }}
              >
                <Input
                  placeholder="Search academic year..."
                  value={yearSearchTerm}
                  onChange={e => setYearSearchTerm(sanitizeInput(e.target.value))}
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
              <p className="text-xs text-sro-primary mt-1 px-1 font-medium">
                {fieldErrors.academicYear}
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
            {/* File Dropzone */}
            <FileDropzone
              files={files}
              onFilesChange={handleFilesChange}
              maxFiles={2}
              disabled={isUploading}
              error={!!fieldErrors.files}
            />
            {fieldErrors.files && (
              <p className="text-xs text-sro-primary mt-1 px-1 font-medium">
                {fieldErrors.files}
              </p>
            )}
            <div className="flex justify-center sm:justify-end">
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={
                  !selectedOrg ||
                  !annualReportEmail.trim() ||
                  !academicYear ||
                  files.length !== 2 ||
                  isUploading
                }
                className="w-full sm:w-auto py-2 rounded-md text-base bg-sro-secondary text-white hover:bg-sro-secondary/90"
              >
                {isUploading ? (
                  <LoadingSpinner text="Submitting..." variant="inline" className="text-white" />
                ) : (
                  "Submit Form"
                )}
              </Button>
            </div>
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
                className="bg-sro-secondary text-white hover:bg-sro-secondary/90 px-6"
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
