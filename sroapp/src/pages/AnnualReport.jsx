import { useState, useEffect, useMemo } from "react";
import { useBlocker } from "react-router-dom"; // Imported useBlocker
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Check, ChevronDown, AlertTriangle, FileText } from "lucide-react"; // Added AlertTriangle, FileText
import LoadingSpinner from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { cn, sanitizeInput } from "@/lib/utils";
import { fetchOrganizations, submitAnnualReport } from "@/api/annualReportAPI";
import supabase from "@/lib/supabase";
import FileDropzone from "@/components/ui/file-dropzone";
import { annualReportSchema } from "@/lib/zodSchemas";
import { useStudentForms, REQUIRED_FORMS } from "@/hooks/useStudentForms";
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

const DRAFT_KEY = "annual_report_draft";

// Academic year options
const academicYearOptions = [
  "2024-2025",
  "2025-2026",
  "2026-2027",
  "2027-2028"
];

const AnnualReport = () => {
  const { getFileForForm } = useStudentForms();
  // === STATE HOOKS ===
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [orgOptions, setOrgOptions] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [annualReportEmail, setAnnualReportEmail] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [userId, setUserId] = useState(null);

  // Draft States
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [isSuccessfullySubmitted, setIsSuccessfullySubmitted] = useState(false);

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

  // Filter org options based on search term (case insensitive)
  const filteredOrgs = orgOptions.filter((org) =>
    org.org_name.toLowerCase().includes(orgSearchTerm.toLowerCase())
  );

  // Filter academic year options based on search
  const filteredYears = academicYearOptions.filter((year) =>
    year.toLowerCase().includes(yearSearchTerm.toLowerCase())
  );

  // === DRAFT SAVING & RESTORATION ===

  // 1. Check for draft on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setPendingDraft(parsed);
        setShowRestoreDialog(true);
      }
    } catch (e) {
      console.error("Failed to load draft", e);
    }
  }, []);

  // 2. Derive current form data object (memoized for stability)
  const currentFormData = useMemo(() => ({
    selectedOrg,
    selectedOrgId,
    annualReportEmail,
    academicYear
  }), [selectedOrg, selectedOrgId, annualReportEmail, academicYear]);

  // 3. Auto-save draft effect
  useEffect(() => {
    // Determine if form is empty (don't save empty drafts)
    const isEmpty = Object.values(currentFormData).every(val => !val);

    if (!isEmpty && !isSuccessfullySubmitted) {
      const handler = setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(currentFormData));
      }, 1000); // Debounce save
      return () => clearTimeout(handler);
    }
  }, [currentFormData, isSuccessfullySubmitted]);

  // 4. Restore Draft Function
  const handleRestoreDraft = () => {
    if (pendingDraft) {
      setSelectedOrg(pendingDraft.selectedOrg || "");
      setSelectedOrgId(pendingDraft.selectedOrgId || "");
      setAnnualReportEmail(pendingDraft.annualReportEmail || "");
      setAcademicYear(pendingDraft.academicYear || "");

      toast.success("Draft restored", { description: "Welcome back!" });
    }
    setShowRestoreDialog(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowRestoreDialog(false);
    toast.info("Draft discarded");
  };

  // === UNSAVED CHANGES PROTECTION ===
  const isDirty = useMemo(() => {
    // Check if any field has value and not submitted
    return Object.values(currentFormData).some(val => val !== "") && !isSuccessfullySubmitted;
  }, [currentFormData, isSuccessfullySubmitted]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      !isSuccessfullySubmitted &&
      currentLocation.pathname !== nextLocation.pathname
  );

  // Handle browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty && !isSuccessfullySubmitted) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isSuccessfullySubmitted]);


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

      // Clear draft on success
      localStorage.removeItem(DRAFT_KEY);
      setIsSuccessfullySubmitted(true);

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

  // Required forms download links (Dynamic)
  const relevantForms = REQUIRED_FORMS.filter(f => f.category === 'Annual Report');

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Annual Report</h1>
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
        {/* Fields Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4 md:space-y-6">
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
            {relevantForms.map((form) => {
              const file = getFileForForm(form);
              const link = file ? (file.webViewLink || file.alternateLink) : null;

              return (
                <div key={form.id} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{form.title}</span>
                  <Button asChild variant="outline" size="sm" disabled={!link} className={!link ? "opacity-50 cursor-not-allowed" : ""}>
                    {link ? (
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        Download
                      </a>
                    ) : (
                      <span>Missing</span>
                    )}
                  </Button>
                </div>
              );
            })}
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

        {/* Restore Draft Dialog- REUSED for Consistency */}
        <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
          <AlertDialogContent className="rounded-xl border border-sro-secondary/20 shadow-2xl">
            <AlertDialogHeader>
              <div className="flex flex-col items-center">
                <div className="bg-sro-secondary/10 p-3 rounded-full mb-3">
                  <FileText className="h-6 w-6 text-sro-secondary" />
                </div>
                <AlertDialogTitle className="text-xl font-bold text-sro-secondary text-center">
                  Restore Previous Session?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-center text-gray-600 mt-2">
                  We found an unsaved draft from your previous session. <br />
                  Would you like to continue where you left off?
                </AlertDialogDescription>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
              <Button
                variant="outline"
                onClick={handleDiscardDraft}
                className="w-full sm:w-auto"
              >
                Start from Scratch
              </Button>
              <Button
                onClick={handleRestoreDraft}
                variant="sro-secondary" className="w-full sm:w-auto"
              >
                Restore Draft
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Unsaved Changes Dialog - REUSED for Consistency */}
        {blocker && blocker.state === "blocked" && (
          <AlertDialog open={true}>
            <AlertDialogContent className="rounded-xl border border-sro-primary/20 shadow-2xl max-w-sm">
              <AlertDialogHeader>
                <div className="flex flex-col items-center">
                  <div className="bg-sro-primary/10 p-4 rounded-full mb-4">
                    <AlertTriangle className="h-10 w-10 text-sro-primary" />
                  </div>
                  <AlertDialogTitle className="text-xl font-bold text-sro-primary text-center">
                    Unsaved Changes
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-center text-gray-600 mt-2">
                    Are you sure you want to leave? Your progress will be saved to your local draft.
                  </AlertDialogDescription>
                </div>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4 sm:justify-center">
                <AlertDialogCancel
                  onClick={() => blocker.reset()}
                  className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Stay Here
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="sro-primary" className="w-full sm:w-auto"
                  onClick={() => blocker.proceed()}
                >
                  Leave Page
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

      </form>
    </div>
  );
};

export default AnnualReport;
