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
import { FileText, UploadCloud, Loader2, ChevronDown, Check } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { submitOrgApplication } from "@/api/orgApplicationAPI";
import supabase from "@/lib/supabase";

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
  const [isDragActive, setIsDragActive] = useState(false);

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
  const isValidEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@(gmail\.com|up\.edu\.ph)$/i.test(email.trim());
  const isValidOrg = (str) =>
    typeof str === "string" && str.trim().length >= 3 && str.trim().length <= 100;
  const isValidName = (str) =>
    typeof str === "string" && str.trim().length >= 3 && str.trim().length <= 50;

  // Field error setter for specific error types
  const setFieldError = (field, errorType) =>
    setFieldErrors((prev) => ({ ...prev, [field]: errorType }));

  // === FILE UPLOAD ===
  const dragDropDisabled = files.length === 6 || isUploading;
  const handleFileChange = (e) => {
    if (dragDropDisabled) return;
    const incomingFiles = Array.from(e.target.files);
    const pdfFiles = incomingFiles.filter((file) => file.type === "application/pdf");
    if (pdfFiles.length === 0) {
      toast.error("Only PDF files are allowed.");
      setFieldError("files", "invalid");
      return;
    }
    if (files.length + pdfFiles.length > 6) {
      toast.error("You can only upload exactly 6 PDF files.");
      setFieldError("files", "invalid");
      return;
    }
    setFiles([...files, ...pdfFiles]);
    setFieldError("files", "");
  };
  const handleRemoveFile = (idx) => {
    if (isUploading) return;
    setFiles(files.filter((_, i) => i !== idx));
  };

  // === VALIDATION LOGIC (LIKE ActivityForm) ===
  const validateFields = () => {
    let valid = true;

    // Name fields: 3–50 chars
    if (!orgName.trim()) {
      setFieldError("orgName", "required"); valid = false;
    } else if (!isValidOrg(orgName)) {
      setFieldError("orgName", "length"); valid = false;
    } else setFieldError("orgName", "");

    if (!chairperson.trim()) {
      setFieldError("chairperson", "required"); valid = false;
    } else if (!isValidName(chairperson)) {
      setFieldError("chairperson", "length"); valid = false;
    } else setFieldError("chairperson", "");

    if (!adviser.trim()) {
      setFieldError("adviser", "required"); valid = false;
    } else if (!isValidName(adviser)) {
      setFieldError("adviser", "length"); valid = false;
    } else setFieldError("adviser", "");

    if (!coAdviser.trim()) {
      setFieldError("coAdviser", "required"); valid = false;
    } else if (!isValidName(coAdviser)) {
      setFieldError("coAdviser", "length"); valid = false;
    } else setFieldError("coAdviser", "");

    // Org type and year: not blank
    if (!orgType.trim()) {
      setFieldError("orgType", "required"); valid = false;
    } else setFieldError("orgType", "");

    if (!academicYear.trim()) {
      setFieldError("academicYear", "required"); valid = false;
    } else setFieldError("academicYear", "");

    // Email fields: not blank, valid
    if (!orgEmail.trim()) {
      setFieldError("orgEmail", "required"); valid = false;
    } else if (!isValidEmail(orgEmail)) {
      setFieldError("orgEmail", "invalid"); valid = false;
    } else setFieldError("orgEmail", "");

    if (!chairpersonEmail.trim()) {
      setFieldError("chairpersonEmail", "required"); valid = false;
    } else if (!isValidEmail(chairpersonEmail)) {
      setFieldError("chairpersonEmail", "invalid"); valid = false;
    } else setFieldError("chairpersonEmail", "");

    if (!adviserEmail.trim()) {
      setFieldError("adviserEmail", "required"); valid = false;
    } else if (!isValidEmail(adviserEmail)) {
      setFieldError("adviserEmail", "invalid"); valid = false;
    } else setFieldError("adviserEmail", "");

    if (!coAdviserEmail.trim()) {
      setFieldError("coAdviserEmail", "required"); valid = false;
    } else if (!isValidEmail(coAdviserEmail)) {
      setFieldError("coAdviserEmail", "invalid"); valid = false;
    } else setFieldError("coAdviserEmail", "");

    // Files: exactly 6
    if (files.length !== 6) {
      setFieldError("files", "invalid"); valid = false;
    } else setFieldError("files", "");

    return valid;
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
        org_coadviser: coAdviser,
        coadviser_email: coAdviserEmail,
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
      <h1 className="text-2xl sm:text-3xl font-bold text-[#7B1113] mb-8 text-center sm:text-left">Organization Application</h1>
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
                setOrgName(e.target.value);
                setFieldError("orgName", "");
              }}
              onBlur={e => {
                if (!e.target.value.trim()) setFieldError("orgName", "required");
                else if (!isValidOrg(e.target.value)) setFieldError("orgName", "length");
                else setFieldError("orgName", "");
              }}
              className={fieldErrors.orgName ? "border-[#7B1113] bg-red-50" : ""}
              placeholder="Samahan ng Organisasyon UPB (SO - UPB)"
              disabled={isUploading}
            />
            {fieldErrors.orgName === "required" && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Required.</p>
            )}
            {fieldErrors.orgName === "length" && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Must be 3 to 100 characters.</p>
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
                    fieldErrors.orgType && "border-[#7B1113] bg-red-50"
                  )}
                >
                  <span className={!selectedOrgTypeName ? "text-muted-foreground" : ""}>
                    {selectedOrgTypeName || "Select organization type from the list"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </div>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-full max-w-md p-0">
                <Input
                  placeholder="Search type..."
                  value={orgTypeSearch}
                  onChange={e => setOrgTypeSearch(e.target.value)}
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
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                          orgType === cat.id ? "bg-gray-100 font-medium" : ""
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
            {fieldErrors.orgType === "required" && <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Required.</p>}
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
                    fieldErrors.academicYear && "border-[#7B1113] bg-red-50"
                  )}
                >
                  <span className={!selectedYear ? "text-muted-foreground" : ""}>
                    {selectedYear || "Select academic year from the list"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </div>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-full max-w-md p-0">
                <Input
                  placeholder="Search year..."
                  value={yearSearch}
                  onChange={e => setYearSearch(e.target.value)}
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
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                          academicYear === year ? "bg-gray-100 font-medium" : ""
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
            {fieldErrors.academicYear === "required" && <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Required.</p>}
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
              onBlur={e => {
                if (!e.target.value.trim()) setFieldError("orgEmail", "required");
                else if (!isValidEmail(e.target.value)) setFieldError("orgEmail", "invalid");
                else setFieldError("orgEmail", "");
              }}
              placeholder="orgemail@gmail.com"
              className={fieldErrors.orgEmail ? "border-[#7B1113] bg-red-50" : ""}
              disabled={isUploading}
            />
            {fieldErrors.orgEmail === "required" && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Required.</p>
            )}
            {fieldErrors.orgEmail === "invalid" && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Must be a valid UP or Gmail address.</p>
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
              onBlur={e => {
                if (!e.target.value.trim()) setFieldError("chairperson", "required");
                else if (!isValidName(e.target.value)) setFieldError("chairperson", "length");
                else setFieldError("chairperson", "");
              }}
              className={fieldErrors.chairperson ? "border-[#7B1113] bg-red-50" : ""}
              placeholder="DEL PILAR, Marcelo H."
              disabled={isUploading}
            />
            {fieldErrors.chairperson === "required" && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Required.</p>
            )}
            {fieldErrors.chairperson === "length" && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Must be 3 to 50 characters.</p>
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
              onBlur={e => {
                if (!e.target.value.trim()) setFieldError("chairpersonEmail", "required");
                else if (!isValidEmail(e.target.value)) setFieldError("chairpersonEmail", "invalid");
                else setFieldError("chairpersonEmail", "");
              }}
              placeholder="delpilarmh@up.edu.ph"
              className={fieldErrors.chairpersonEmail ? "border-[#7B1113] bg-red-50" : ""}
              disabled={isUploading}
            />
            {fieldErrors.chairpersonEmail === "required" && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Required.</p>
            )}
            {fieldErrors.chairpersonEmail === "invalid" && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Must be a valid UP or Gmail address.</p>
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
              onBlur={e => {
                if (!e.target.value.trim()) setFieldError("adviser", "required");
                else if (!isValidName(e.target.value)) setFieldError("adviser", "length");
                else setFieldError("adviser", "");
              }}
              className={fieldErrors.adviser ? "border-[#7B1113] bg-red-50" : ""}
              placeholder="DEL PILAR, Marcelo H."
              disabled={isUploading}
            />
            {fieldErrors.adviser === "required" && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Required.</p>
            )}
            {fieldErrors.adviser === "length" && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Must be 3 to 50 characters.</p>
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
              onBlur={e => {
                if (!e.target.value.trim()) setFieldError("adviserEmail", "required");
                else if (!isValidEmail(e.target.value)) setFieldError("adviserEmail", "invalid");
                else setFieldError("adviserEmail", "");
              }}
              placeholder="delpilarmh@up.edu.ph"
              className={fieldErrors.adviserEmail ? "border-[#7B1113] bg-red-50" : ""}
              disabled={isUploading}
            />
            {fieldErrors.adviserEmail === "required" && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Required.</p>
            )}
            {fieldErrors.adviserEmail === "invalid" && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Must be a valid UP or Gmail address.</p>
            )}
          </div>
          {/* Co-Adviser */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Co-Adviser <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={coAdviser}
              onChange={e => {
                setCoAdviser(e.target.value);
                setFieldError("coAdviser", "");
              }}
              onBlur={e => {
                if (!e.target.value.trim()) setFieldError("coAdviser", "required");
                else if (!isValidName(e.target.value)) setFieldError("coAdviser", "length");
                else setFieldError("coAdviser", "");
              }}
              className={fieldErrors.coAdviser ? "border-[#7B1113] bg-red-50" : ""}
              placeholder="DEL PILAR, Marcelo H."
              disabled={isUploading}
            />
            {fieldErrors.coAdviser === "required" && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Required.</p>
            )}
            {fieldErrors.coAdviser === "length" && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Must be 3 to 50 characters.</p>
            )}
          </div>
          {/* Co-Adviser Email */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Co-Adviser E-mail <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={coAdviserEmail}
              onChange={e => {
                setCoAdviserEmail(e.target.value);
                setFieldError("coAdviserEmail", "");
              }}
              onBlur={e => {
                if (!e.target.value.trim()) setFieldError("coAdviserEmail", "required");
                else if (!isValidEmail(e.target.value)) setFieldError("coAdviserEmail", "invalid");
                else setFieldError("coAdviserEmail", "");
              }}
              placeholder="delpilarmh@up.edu.ph"
              className={fieldErrors.coAdviserEmail ? "border-[#7B1113] bg-red-50" : ""}
              disabled={isUploading}
            />
            {fieldErrors.coAdviserEmail === "required" && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Required.</p>
            )}
            {fieldErrors.coAdviserEmail === "invalid" && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Must be a valid UP or Gmail address.</p>
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
            {[
              "Revised OSA Form A: Application for Student Organization Recognition",
              "OSA Form B1: Officer Roster", "OSA Form B2: Member Roster",
              "OSA Form C: Officer Data",
              "Revised OSA Form E: Proposed Activities for AY 2025-2026"
            ].map((form, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{form}</span>
                <Button variant="outline" size="sm">Download</Button>
              </div>
            ))}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Constitution and Bylaws</span>
            </div>
            {/* Drag and Drop File Upload (disabled after 6 or during upload) */}
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
                handleFileChange({ target: { files: e.dataTransfer.files } });
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
              <label htmlFor="orgAppFileUpload" className={cn(
                "cursor-pointer flex flex-col items-center",
                dragDropDisabled && "cursor-not-allowed opacity-70"
              )}>
                <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm">
                  {dragDropDisabled
                    ? "You cannot upload or drag files after completion."
                    : isDragActive
                    ? "Drop the file here"
                    : "Drag and Drop or Upload Files (6 required)"
                  }
                </p>
                <input
                  id="orgAppFileUpload"
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={dragDropDisabled}
                />
              </label>
            </div>
            {fieldErrors.files === "invalid" && (
              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Please upload exactly 6 PDF files.</p>
            )}
            {files.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Selected Files ({files.length}/6)</h4>
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
            {/* Confirmation Dialog trigger */}
            <Button
              type="button"
              className="w-full py-2 rounded-md text-base bg-[#014421] text-white hover:bg-[#003218]"
              disabled={
                isUploading ||
                files.length !== 6
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
      {/* Interview dialog after submission */}
      <Dialog open={showInterviewPrompt} onOpenChange={setShowInterviewPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">Submission Sent</DialogTitle>
            <DialogDescription className="text-center">
              Schedule an interview?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center gap-4">
            <Button onClick={() => handleInterviewResponse(true)}>Yes</Button>
            <Button variant="destructive" onClick={() => handleInterviewResponse(false)}>
              No
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgApplication;
