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

  // Field error states for visual feedback
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
      const { data, error } = await supabase.auth.getSession();
      const user = data?.session?.user;
      if (!user) return;
      const { data: accountData, error: fetchErr } = await supabase
        .from("account")
        .select("account_id")
        .eq("email", user.email)
        .single();
      if (accountData?.account_id) setUserId(accountData.account_id);
    };
    fetchUserAccount();
  }, []);

  // === VALIDATION HELPERS ===

  // Only valid up.edu.ph or gmail.com, nothing after .com or .ph
  const isValidEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@(gmail\.com|up\.edu\.ph)$/i.test(email.trim());

  // Field error setter
  const setFieldError = (field, hasError) =>
    setFieldErrors((prev) => ({ ...prev, [field]: hasError }));

  // === FILE UPLOAD ===
  const dragDropDisabled = files.length === 6 || isUploading;
  const handleFileChange = (e) => {
    if (dragDropDisabled) return;
    const incomingFiles = Array.from(e.target.files);
    const pdfFiles = incomingFiles.filter((file) => file.type === "application/pdf");
    if (pdfFiles.length === 0) {
      toast.error("Only PDF files are allowed.");
      setFieldError("files", true);
      return;
    }
    if (files.length + pdfFiles.length > 6) {
      toast.error("You can only upload exactly 6 PDF files.");
      setFieldError("files", true);
      return;
    }
    setFiles([...files, ...pdfFiles]);
    setFieldError("files", false);
  };
  const handleRemoveFile = (idx) => {
    if (isUploading) return;
    setFiles(files.filter((_, i) => i !== idx));
  };

  // === VALIDATION LOGIC (LIKE ActivityForm) ===
  const validateFields = () => {
    let valid = true;
    // Required field checks, add more for each input as needed
    if (!orgName.trim()) { setFieldError("orgName", true); valid = false; } else setFieldError("orgName", false);
    if (!orgType.trim()) { setFieldError("orgType", true); valid = false; } else setFieldError("orgType", false);
    if (!academicYear.trim()) { setFieldError("academicYear", true); valid = false; } else setFieldError("academicYear", false);

    if (!orgEmail.trim() || !isValidEmail(orgEmail)) { setFieldError("orgEmail", true); valid = false; } else setFieldError("orgEmail", false);
    if (!chairperson.trim()) { setFieldError("chairperson", true); valid = false; } else setFieldError("chairperson", false);
    if (!chairpersonEmail.trim() || !isValidEmail(chairpersonEmail)) { setFieldError("chairpersonEmail", true); valid = false; } else setFieldError("chairpersonEmail", false);
    if (!adviser.trim()) { setFieldError("adviser", true); valid = false; } else setFieldError("adviser", false);
    if (!adviserEmail.trim() || !isValidEmail(adviserEmail)) { setFieldError("adviserEmail", true); valid = false; } else setFieldError("adviserEmail", false);
    if (!coAdviser.trim()) { setFieldError("coAdviser", true); valid = false; } else setFieldError("coAdviser", false);
    if (!coAdviserEmail.trim() || !isValidEmail(coAdviserEmail)) { setFieldError("coAdviserEmail", true); valid = false; } else setFieldError("coAdviserEmail", false);
    if (files.length !== 6) { setFieldError("files", true); valid = false; } else setFieldError("files", false);

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
      <form className="grid grid-cols-1 lg:grid-cols-2 gap-10" onSubmit={e => e.preventDefault()}>
        <div className="space-y-5">
          {/* Organization Name */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={orgName}
              onChange={(e) => {
                setOrgName(e.target.value);
                if (e.target.value.trim()) setFieldError("orgName", false);
              }}
              className={fieldErrors.orgName && "border-[#7B1113] bg-red-50"}
              placeholder="Samahan ng Organisasyon UPB (SO - UPB)"
              disabled={isUploading}
            />
            {fieldErrors.orgName && <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Required.</p>}
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
                  onChange={(e) => setOrgTypeSearch(e.target.value)}
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
                          setFieldError("orgType", false);
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
            {fieldErrors.orgType && <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Required.</p>}
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
                  onChange={(e) => setYearSearch(e.target.value)}
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
                          setFieldError("academicYear", false);
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
            {fieldErrors.academicYear && <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Required.</p>}
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
                if (isValidEmail(e.target.value)) setFieldError("orgEmail", false);
              }}
              onBlur={e => setFieldError("orgEmail", !isValidEmail(e.target.value))}
              placeholder="orgemail@gmail.com"
              className={fieldErrors.orgEmail && "border-[#7B1113] bg-red-50"}
              disabled={isUploading}
            />
            {fieldErrors.orgEmail && (
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
                if (e.target.value.trim()) setFieldError("chairperson", false);
              }}
              className={fieldErrors.chairperson && "border-[#7B1113] bg-red-50"}
              placeholder="DEL PILAR, Marcelo H."
              disabled={isUploading}
            />
            {fieldErrors.chairperson && <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Required.</p>}
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
                if (isValidEmail(e.target.value)) setFieldError("chairpersonEmail", false);
              }}
              onBlur={e => setFieldError("chairpersonEmail", !isValidEmail(e.target.value))}
              placeholder="delpilarmh@up.edu.ph"
              className={fieldErrors.chairpersonEmail && "border-[#7B1113] bg-red-50"}
              disabled={isUploading}
            />
            {fieldErrors.chairpersonEmail && (
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
                if (e.target.value.trim()) setFieldError("adviser", false);
              }}
              className={fieldErrors.adviser && "border-[#7B1113] bg-red-50"}
              placeholder="DEL PILAR, Marcelo H."
              disabled={isUploading}
            />
            {fieldErrors.adviser && <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Required.</p>}
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
                if (isValidEmail(e.target.value)) setFieldError("adviserEmail", false);
              }}
              onBlur={e => setFieldError("adviserEmail", !isValidEmail(e.target.value))}
              placeholder="delpilarmh@up.edu.ph"
              className={fieldErrors.adviserEmail && "border-[#7B1113] bg-red-50"}
              disabled={isUploading}
            />
            {fieldErrors.adviserEmail && (
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
                if (e.target.value.trim()) setFieldError("coAdviser", false);
              }}
              className={fieldErrors.coAdviser && "border-[#7B1113] bg-red-50"}
              placeholder="DEL PILAR, Marcelo H."
              disabled={isUploading}
            />
            {fieldErrors.coAdviser && <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">Required.</p>}
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
                if (isValidEmail(e.target.value)) setFieldError("coAdviserEmail", false);
              }}
              onBlur={e => setFieldError("coAdviserEmail", !isValidEmail(e.target.value))}
              placeholder="delpilarmh@up.edu.ph"
              className={fieldErrors.coAdviserEmail && "border-[#7B1113] bg-red-50"}
              disabled={isUploading}
            />
            {fieldErrors.coAdviserEmail && (
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
            {fieldErrors.files && (
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
