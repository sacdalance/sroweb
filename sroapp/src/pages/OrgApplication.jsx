import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { ChevronDown, Check } from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { toast, Toaster } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, sanitizeInput } from "@/lib/utils";
import { submitOrgApplication } from "@/api/orgApplicationAPI";
import supabase from "@/lib/supabase";
import FileDropzone from "@/components/ui/file-dropzone";
import { orgApplicationSchema } from "@/lib/zodSchemas";

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

const academicYearsList = ["2024-2025", "2025-2026", "2026-2027", "2027-2028"];

const formLinks = [
  {
    name: "Revised OSA Form A: Application for Student Organization Recognition",
    url: "https://docs.google.com/document/d/1CahbzvUk-N0jG-9TN2t6s3i9X8AhKPI2",
  },
  {
    name: "OSA Form B1: Officer Roster",
    url: "https://docs.google.com/document/d/1VNPa-zJxw6Yw3_phrRWHM21F2gCYa4BN",
  },
  {
    name: "OSA Form B2: Member Roster",
    url: "https://docs.google.com/document/d/1Cp6TjAkh2jFVRzXbrZewcOXpNDtoPGqO",
  },
  {
    name: "OSA Form C: Officer Data",
    url: "https://docs.google.com/document/d/1i_tR4BbdbVO9MVfWAjJxrYbYx0m_U0ws",
  },
  {
    name: "Revised OSA Form E: Proposed Activities for AY 2025-2026",
    url: "https://docs.google.com/document/d/13TijHKgKYdFkymkrp4Usj-NQ0shsxdLR",
  },
];


const OrgApplication = () => {
  const navigate = useNavigate();

  // === STATES FOR FORM FIELDS ===
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showInterviewPrompt, setShowInterviewPrompt] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Form fields
  const [orgName, setOrgName] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [chairperson, setChairperson] = useState("");
  const [chairpersonEmail, setChairpersonEmail] = useState("");
  const [adviser, setAdviser] = useState("");
  const [adviserEmail, setAdviserEmail] = useState("");
  const [coAdviser, setCoAdviser] = useState("");
  const [coAdviserEmail, setCoAdviserEmail] = useState("");
  const [orgType, setOrgType] = useState("");
  const [selectedOrgTypeName, setSelectedOrgTypeName] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [userId, setUserId] = useState(null);

  // UI state for searchable dropdowns
  const [orgTypeOpen, setOrgTypeOpen] = useState(false);
  const [orgTypeSearch, setOrgTypeSearch] = useState("");
  const [yearOpen, setYearOpen] = useState(false);
  const [yearSearch, setYearSearch] = useState("");

  // Field error states for visual feedback (error type: "", "required", "length", "invalid")
  const [fieldErrors, setFieldErrors] = useState({});

  // === FILTERED DROPDOWN LOGIC ===
  const filteredCategories = categoriesList.filter((cat) =>
    cat.name.toLowerCase().includes(orgTypeSearch.toLowerCase())
  );
  const filteredYears = academicYearsList.filter((year) =>
    year.toLowerCase().includes(yearSearch.toLowerCase())
  );

  // === AUTH: GET USER ACCOUNT ID ===
  useEffect(() => {
    const fetchUserAccount = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;
      if (!user) return;
      const { data: accountData } = await supabase
        .from("account")
        .select("account_id")
        .eq("email", user.email)
        .single();
      if (accountData?.account_id) setUserId(accountData.account_id);
    };
    fetchUserAccount();
  }, []);

  // === VALIDATION HELPERS ===
  const validateSingleField = (field, value) => {
    try {
      if (field === "orgType" || field === "academicYear") {
        // These are required strings
        orgApplicationSchema.pick({ [field]: true }).parse({ [field]: value });
      } else if (field === "files") {
        orgApplicationSchema.pick({ files: true }).parse({ files: value });
      } else {
        // Standard fields
        orgApplicationSchema.pick({ [field]: true }).parse({ [field]: value });
      }
      setFieldError(field, null);
    } catch (err) {
      setFieldError(field, err.errors[0].message);
    }
  };

  const setFieldError = (field, errorMsg) =>
    setFieldErrors((prev) => ({ ...prev, [field]: errorMsg }));

  // === FILE UPLOAD HANDLER (for FileDropzone onFilesChange) ===
  const handleFilesChange = (newFiles) => {
    setFiles(newFiles);
    if (newFiles.length === 6) {
      setFieldError("files", null);
    }
  };

  // === VALIDATION LOGIC (Zod) ===
  const validateFields = () => {
    const payload = {
      orgName,
      orgType,
      academicYear,
      orgEmail,
      chairperson,
      chairpersonEmail,
      adviser,
      adviserEmail,
      coAdviser,
      coAdviserEmail,
      files
    };

    const result = orgApplicationSchema.safeParse(payload);

    if (!result.success) {
      const newErrors = {};
      result.error.issues.forEach(issue => {
        newErrors[issue.path[0]] = issue.message;
      });
      setFieldErrors(newErrors);
      return false;
    }

    return true;
  };

  // === FORM SUBMISSION ===
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateFields()) {
      toast.error("Please fill out all required fields correctly.");
      return;
    }
    setIsUploading(true);
    toast.loading("Submitting organization application...");
    try {
      await submitOrgApplication({
        org_name: orgName,
        academic_year: academicYear,
        org_email: orgEmail,
        org_chairperson: chairperson,
        chairperson_email: chairpersonEmail,
        org_adviser: adviser,
        adviser_email: adviserEmail,
        org_coadviser: coAdviser.trim() || null,
        coadviser_email: coAdviserEmail.trim() || null,
        org_type: orgType,
        files,
        submitted_by: userId,
      });
      toast.success("Submitted successfully!");
      setShowInterviewPrompt(true);
      // Clear form after success
      setFiles([]);
      setOrgName("");
      setOrgEmail("");
      setChairperson("");
      setChairpersonEmail("");
      setAdviser("");
      setAdviserEmail("");
      setCoAdviser("");
      setCoAdviserEmail("");
      setAcademicYear("");
      setSelectedYear("");
      setOrgType("");
      setSelectedOrgTypeName("");
      setFieldErrors({});
    } catch (error) {
      toast.error(error.message || "Submission failed. Please try again.");
    } finally {
      toast.dismiss();
      setIsUploading(false);
    }
  };

  // === INTERVIEW PROMPT AFTER SUBMISSION ===
  const handleInterviewResponse = (response) => {
    setShowInterviewPrompt(false);
    if (response) {
      navigate("/appointment-booking");
    } else {
      toast("Submission complete.", {
        description: "Your files have been successfully uploaded.",
        duration: 5000,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8">
      <Toaster />
      <h1 className="page-header text-black">Recognition Application</h1>
      <form className="grid grid-cols-1 lg:grid-cols-2 gap-10" onSubmit={e => e.preventDefault()} noValidate>
        <div className="space-y-5">
          {/* Organization Name */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={orgName}
              onChange={e => {
                const value = sanitizeInput(e.target.value);
                setOrgName(value);
                setFieldError("orgName", "");
              }}
              onBlur={e => validateSingleField("orgName", e.target.value)}
              className={fieldErrors.orgName ? "border-sro-primary bg-red-50" : ""}
              placeholder="Samahan ng Organisasyon UPB (SO - UPB)"
              disabled={isUploading}
            />
            {fieldErrors.orgName && (
              <p className="text-xs text-sro-primary mt-1 px-1 font-medium">{fieldErrors.orgName}</p>
            )}
          </div>
          {/* Organization Type (searchable dropdown, with error) */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Organization Type <span className="text-red-500">*</span>
            </label>
            <Popover open={orgTypeOpen} onOpenChange={setOrgTypeOpen}>
              <PopoverTrigger asChild>
                <div
                  role="combobox"
                  aria-expanded={orgTypeOpen}
                  className={cn(
                    "w-full flex items-center justify-between border border-input bg-transparent rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring hover:border-gray-400",
                    fieldErrors.orgType && "border-sro-primary bg-red-50"
                  )}
                >
                  <span className={!selectedOrgTypeName ? "text-muted-foreground" : ""}>
                    {selectedOrgTypeName || "Select organization type from the list"}
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
                  placeholder="Search type..."
                  value={orgTypeSearch}
                  onChange={e => {
                    const value = sanitizeInput(e.target.value);
                    setOrgEmail(value);
                  }}
                  className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                />
                <div className="max-h-48 overflow-y-auto">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setOrgType(cat.id);
                          setSelectedOrgTypeName(cat.name);
                          setOrgTypeSearch("");
                          setOrgTypeOpen(false);
                          setFieldError("orgType", "");
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${orgType === cat.id ? "bg-gray-100 font-medium" : ""
                          }`}
                        type="button"
                        disabled={isUploading}
                      >
                        {cat.name}
                        {orgType === cat.id && (
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
            {fieldErrors.orgType && <p className="text-xs text-sro-primary mt-1 px-1 font-medium">{fieldErrors.orgType}</p>}
          </div>
          {/* Academic Year (searchable dropdown, with error) */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <Popover open={yearOpen} onOpenChange={setYearOpen}>
              <PopoverTrigger asChild>
                <div
                  role="combobox"
                  aria-expanded={yearOpen}
                  className={cn(
                    "w-full flex items-center justify-between border border-input bg-transparent rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring hover:border-gray-400",
                    fieldErrors.academicYear && "border-sro-primary bg-red-50"
                  )}
                >
                  <span className={!selectedYear ? "text-muted-foreground" : ""}>
                    {selectedYear || "Select academic year from the list"}
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
                  placeholder="Search year..."
                  value={chairperson}
                  onChange={e => {
                    const value = sanitizeInput(e.target.value);
                    setChairperson(value);
                  }}
                  className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                />
                <div className="max-h-48 overflow-y-auto">
                  {filteredYears.length > 0 ? (
                    filteredYears.map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          setAcademicYear(year);
                          setSelectedYear(year);
                          setYearSearch("");
                          setYearOpen(false);
                          setFieldError("academicYear", "");
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${academicYear === year ? "bg-gray-100 font-medium" : ""
                          }`}
                        type="button"
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
            {fieldErrors.academicYear && <p className="text-xs text-sro-primary mt-1 px-1 font-medium">{fieldErrors.academicYear}</p>}
          </div>
          {/* Organization E-mail */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Organization E-mail <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={orgEmail}
              onChange={e => {
                setOrgEmail(e.target.value);
                setFieldError("orgEmail", "");
              }}
              onBlur={e => validateSingleField("orgEmail", e.target.value)}
              placeholder="orgemail@gmail.com"
              className={fieldErrors.orgEmail ? "border-sro-primary bg-red-50" : ""}
              disabled={isUploading}
            />
            {fieldErrors.orgEmail && (
              <p className="text-xs text-sro-primary mt-1 px-1 font-medium">{fieldErrors.orgEmail}</p>
            )}
          </div>
          {/* Chairperson */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Organization Chairperson/President <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={chairperson}
              onChange={e => {
                setChairperson(e.target.value);
                setFieldError("chairperson", "");
              }}
              onBlur={e => validateSingleField("chairperson", e.target.value)}
              className={fieldErrors.chairperson ? "border-sro-primary bg-red-50" : ""}
              placeholder="DEL PILAR, Marcelo H."
              disabled={isUploading}
            />
            {fieldErrors.chairperson && (
              <p className="text-xs text-sro-primary mt-1 px-1 font-medium">{fieldErrors.chairperson}</p>
            )}
          </div>
          {/* Chairperson Email */}
          <div>
            <label className="text-sm font-medium block mb-1">
              E-mail of Chairperson/President <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={chairpersonEmail}
              onChange={e => {
                setChairpersonEmail(e.target.value);
                setFieldError("chairpersonEmail", "");
              }}
              onBlur={e => validateSingleField("chairpersonEmail", e.target.value)}
              placeholder="delpilarmh@up.edu.ph"
              className={fieldErrors.chairpersonEmail ? "border-sro-primary bg-red-50" : ""}
              disabled={isUploading}
            />
            {fieldErrors.chairpersonEmail && (
              <p className="text-xs text-sro-primary mt-1 px-1 font-medium">{fieldErrors.chairpersonEmail}</p>
            )}
          </div>
          {/* Adviser */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Adviser <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={adviser}
              onChange={e => {
                setAdviser(e.target.value);
                setFieldError("adviser", "");
              }}
              onBlur={e => validateSingleField("adviser", e.target.value)}
              className={fieldErrors.adviser ? "border-sro-primary bg-red-50" : ""}
              placeholder="DEL PILAR, Marcelo H."
              disabled={isUploading}
            />
            {fieldErrors.adviser && (
              <p className="text-xs text-sro-primary mt-1 px-1 font-medium">{fieldErrors.adviser}</p>
            )}
          </div>
          {/* Adviser Email */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Adviser E-mail <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={adviserEmail}
              onChange={e => {
                setAdviserEmail(e.target.value);
                setFieldError("adviserEmail", "");
              }}
              onBlur={e => validateSingleField("adviserEmail", e.target.value)}
              placeholder="delpilarmh@up.edu.ph"
              className={fieldErrors.adviserEmail ? "border-sro-primary bg-red-50" : ""}
              disabled={isUploading}
            />
            {fieldErrors.adviserEmail && (
              <p className="text-xs text-sro-primary mt-1 px-1 font-medium">{fieldErrors.adviserEmail}</p>
            )}
          </div>
          {/* Co-Adviser */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Co-Adviser
            </label>
            <Input
              type="text"
              value={coAdviser}
              onChange={e => {
                const value = sanitizeInput(e.target.value);
                setCoAdviser(value);
                setFieldError("coAdviser", "");
              }}
              onBlur={e => validateSingleField("coAdviser", e.target.value)}
              className={fieldErrors.coAdviser ? "border-sro-primary bg-red-50" : ""}
              placeholder="DEL PILAR, Marcelo H."
            />
            {fieldErrors.coAdviser && (
              <p className="text-xs text-sro-primary mt-1 px-1 font-medium">{fieldErrors.coAdviser}</p>
            )}
          </div>
          {/* Co-Adviser Email */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Co-Adviser E-mail
            </label>
            <Input
              type="email"
              value={coAdviserEmail}
              onChange={e => {
                setCoAdviserEmail(e.target.value);
                setFieldError("coAdviserEmail", "");
              }}
              onBlur={e => validateSingleField("coAdviserEmail", e.target.value)}
              placeholder="delpilarmh@up.edu.ph"
              className={fieldErrors.coAdviserEmail ? "border-sro-primary bg-red-50" : ""}
              disabled={isUploading}
            />
            {fieldErrors.coAdviserEmail && (
              <p className="text-xs text-sro-primary mt-1 px-1 font-medium">{fieldErrors.coAdviserEmail}</p>
            )}
          </div>
        </div>
        {/* Forms & Files Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Required Forms <span className="text-red-500">*</span>
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
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Constitution and Bylaws</span>
            </div>
            {/* File Dropzone */}
            <FileDropzone
              files={files}
              onFilesChange={handleFilesChange}
              maxFiles={6}
              disabled={isUploading}
              error={fieldErrors.files === "invalid"}
            />
            {fieldErrors.files === "invalid" && (
              <p className="text-xs text-sro-primary mt-1 px-1 font-medium">Please upload exactly 6 PDF files.</p>
            )}
            {/* Confirmation Dialog trigger */}
            <div className="flex justify-center sm:justify-end">
              <Button
                onClick={handleSubmit}
                disabled={isUploading}
                className="bg-sro-secondary hover:bg-sro-secondary/90 text-white w-full sm:w-auto"
              >
                {isUploading ? (
                  <LoadingSpinner text="Submitting..." variant="inline" className="text-white" />
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Submission Confirmation Dialog (UI/UX match) */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Organization Application</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to submit this application? You cannot edit after submission.
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
      {/* Interview dialog after submission */}
      <Dialog open={showInterviewPrompt} onOpenChange={setShowInterviewPrompt}>
        <DialogContent className="max-w-md mx-auto rounded-2xl p-8 bg-white shadow-lg border border-gray-100">
          <DialogHeader>
            <div className="flex flex-col items-center">
              <Check className="h-10 w-10 text-sro-secondary mb-2" /> {/* Forest Green */}
              <DialogTitle className="text-center text-2xl font-semibold text-sro-primary mb-2">Submission Successful</DialogTitle> {/* UP Maroon */}
              <DialogDescription className="text-center text-base text-gray-700 mb-4">
                Your application was submitted.<br />
                Would you like to schedule your interview now?
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-center gap-6 mt-4">
            <Button
              className="bg-sro-secondary hover:bg-sro-secondary/90 text-white font-semibold px-6 py-2 rounded-xl shadow-none"
              onClick={() => handleInterviewResponse(true)}
            >
              Schedule Now
            </Button>
            <Button
              variant="outline"
              className="border-sro-primary text-sro-primary hover:bg-status-pending font-semibold px-6 py-2 rounded-xl"
              onClick={() => handleInterviewResponse(false)}
            >
              Not Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgApplication;