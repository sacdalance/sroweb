// initial skeleton for modular reuse
import React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Separator } from "../components/ui/separator";
import { X } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { FileText, Loader2, UploadCloud, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { createActivity } from '../api/activityRequestAPI';
import { editActivity } from '../api/activityEditAPI';
import { submitAdminActivity } from '../api/adminActivityAPI';
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

  const ActivityForm = ({
    mode = "create", // or "edit" or "admin"
    defaultValues = {},
    showAppealReason = false,
    autoApprove = false,
    onSubmit
  }) => {
    const [currentSection, setCurrentSection] = useState("general-info");
    const [fieldErrors, setFieldErrors] = useState({});
    const [showRemindersDialog, setShowRemindersDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [orgs, setOrgs] = useState([]);
    const fileInputRef = useRef(null);
    const today = new Date();
    const minStartDate = addBusinessDays(today, 5).toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextDay = tomorrow.toISOString().split("T")[0];
    const buttonClasses = (type = "primary") =>
  type === "primary"
    ? mode === "admin"
      ? "bg-[#7B1113] text-white hover:bg-[#5e0d0f]"
      : "bg-[#014421] text-white hover:bg-[#003218]"
    : mode === "admin"
    ? "text-[#7B1113] hover:text-[#7B1113] hover:bg-[#7B1113]/10"
    : "text-[#014421] hover:text-[#014421] hover:bg-[#014421]/10";
    const sectionOrder = ["general-info", "date-info", "specifications", "submission"];
    const [formData, setFormData] = useState({
      selectedValue: defaultValues?.selectedValue || "",
      selectedOrgName: defaultValues?.selectedOrgName || "",
      searchTerm: "",
      open: false,
      studentPosition: defaultValues?.studentPosition || "",
      studentContact: defaultValues?.studentContact || "",
      activityName: defaultValues?.activityName || "",
      activityDescription: defaultValues?.activityDescription || "",
      selectedActivityType: defaultValues?.selectedActivityType || "",
      otherActivityType: defaultValues?.otherActivityType || "",
      selectedSDGs: defaultValues?.selectedSDGs || {},
      chargingFees1: defaultValues?.chargingFees1 || "",
      partnering: defaultValues?.partnering || "",
      selectedPublicAffairs: defaultValues?.selectedPublicAffairs || {},
      universityPartners: defaultValues?.universityPartners || {},
      partnerDescription: defaultValues?.partnerDescription || "",
      recurring: defaultValues?.recurring || "",
      startDate: defaultValues?.startDate || "",
      endDate: defaultValues?.endDate || "",
      startTime: defaultValues?.startTime || "",
      endTime: defaultValues?.endTime || "",
      recurringDays: defaultValues?.recurringDays || {
        Monday: false,
        Tuesday: false,
        Wednesday: false,
        Thursday: false,
        Friday: false,
        Saturday: false,
      },
      isOffCampus: defaultValues?.isOffCampus || "",
      venue: defaultValues?.venue || "",
      venueApprover: defaultValues?.venueApprover || "",
      venueApproverContact: defaultValues?.venueApproverContact || "",
      organizationAdviser: defaultValues?.organizationAdviser || "",
      organizationAdviserContact: defaultValues?.organizationAdviserContact || "",
      greenCampusMonitor: defaultValues?.greenCampusMonitor || "",
      greenCampusMonitorContact: defaultValues?.greenCampusMonitorContact || "",
      selectedFile: defaultValues?.selectedFile || null,
      isDragActive: false,
      appealReason: defaultValues?.appealReason || ""
    });


      const activityTypeOptions = [
        { id: "charitable", label: "Charitable" },
        { id: "serviceWithinUPB", label: "Service (within UPB)" },
        { id: "serviceOutsideUPB", label: "Service (outside UPB)" },
        { id: "contestWithinUPB", label: "Contest (within UPB)" },
        { id: "contestOutsideUPB", label: "Contest (outside UPB)" },
        { id: "educational", label: "Educational (forum, seminar, exhibits, etc.)" },
        { id: "incomeGenerating", label: "Income-Generating Project" },
        { id: "massOrientation", label: "Mass Orientation/General Assembly" },
        { id: "booth", label: "Booth (membership, registration, ticket payment, etc.)" },
        { id: "rehearsals", label: "Rehearsals/Preparation" },
        { id: "specialEvents", label: "Special Events (anniversary, concert, etc.)" },
        { id: "others", label: "Others" }
    ];

    const sdgOptions = [
        { id: "noPoverty", label: "No Poverty" },
        { id: "zeroHunger", label: "Zero Hunger" },
        { id: "goodHealth", label: "Good Health and Well-Being" },
        { id: "qualityEducation", label: "Quality Education" },
        { id: "genderEquality", label: "Gender Equality" },
        { id: "cleanWater", label: "Clean Water and Sanitation" },
        { id: "affordableEnergy", label: "Affordable and Clean Energy" },
        { id: "decentWork", label: "Decent Work and Economic Work" },
        { id: "industryInnovation", label: "Industry Innovation and Infrastructure" },
        { id: "reducedInequalities", label: "Reduced Inequalities" },
        { id: "sustainableCities", label: "Sustainable Cities and Communities" },
        { id: "responsibleConsumption", label: "Responsible Consumption and Production" },
        { id: "climateAction", label: "Climate Action" },
        { id: "lifeBelowWater", label: "Life Below Water" },
        { id: "lifeOnLand", label: "Life on Land" },
        { id: "peaceJustice", label: "Peace, Justice and Strong Institutions" },
        { id: "partnerships", label: "Partnerships for the Goals" }
    ];

    function addBusinessDays(date, days) {
      const result = new Date(date);
      let added = 0;
      while (added < days) {
        result.setDate(result.getDate() + 1);
        const day = result.getDay();
        if (day !== 0 && day !== 6) {
          added++;
        }
      }
      return result;
    }

    const universityPartners = {
        colleges: [
            "College of Science",
            "College of Arts and Communication",
            "College of Social Sciences",
        ],
        departments: [
            "Department of Biology",
            "Department of Mathematics and Computer Science",
            "Department of Physical Sciences",
            "Human Kinetics Program",
            "Department of Communication",
            "Department of Language, Literature, and the Arts",
            "Department of Anthropology, Sociology, and Psychology",
            "Department of History and Philosophy ",
            "Department of Economics and Political Science",
        ],
        studentAffairs: [
            "Office of Student Affairs (OSA)",
            "Student Relations Office (SRO)",
            "Office of Counselling and Guidance (OCG)",
            "Office of Scholarships and Financial Assistance (OSFA)",
            "UPB Residence Hall (BREHA)",
            "Health Service Office (HSO)",
            "Office of the Auxillary Services (OAS)",      
        ],
        academicAffairs: [
            "Commitee on Culture and Arts (CCA)",
            "Program for Indigenous Cultures (PIC)",
            "Ugnayan ng Pahinungod Baguio",
            "National Service Training Program (NSTP)",
            "University Library",
            "Learning Resource Center (LRC)",
            "Science Research Center (SRC)",
            "Museo Kordilyera",
            "Kasarian Gender Studies Program",
            "Office of Anti-Sexual Harassment",
        ],
        publicAffairs: [
            "Office of Public Affairs (OPA)",
            "Alumni Relations Office (ARO)",
            "Others"
        ]
    };

  const filteredOrgs = formData.searchTerm
    ? orgs.filter((org) =>
        org.org_name.toLowerCase().includes(formData.searchTerm.toLowerCase())
      )
    : orgs;
    const navigate = useNavigate();


    useEffect(() => {
      if (!formData.universityPartners || Object.keys(formData.universityPartners).length === 0) {
        setFormData((prev) => ({
          ...prev,
          universityPartners,
        }));
      }
    }, []);

    useEffect(() => {
      const fetchOrgs = async () => {
        const { data, error } = await supabase.from("organization").select("*");
        if (!error && data) {
          setOrgs(data);
        }
      };
      fetchOrgs();
    }, []);

  useEffect(() => {
    const seen = sessionStorage.getItem("sroRemindersSeen");
    if (!seen) {
      setShowRemindersDialog(true);
      sessionStorage.setItem("sroRemindersSeen", "true");
    }
  }, []);

  const getRequiredDocuments = () => {
    const required = [
      "Concept Paper",
      "Form 1A (Scanned Copy of Activity Request Form)",
    ];

    if (formData.isOffCampus === "yes") {
      required.push(
        "Form 2A (Notice of Off-Campus Activity)",
        "Form 2B (Waiver for Off-Campus Student Activities), Notarized"
      );
    }

    const isWeekend = (dateStr) => {
      const date = new Date(dateStr);
      const day = date.getDay();
      return day === 0 || day === 6;
    };

    const isLate = (time) => {
      if (!time) return false;
      const [hours] = time.split(":").map(Number);
      return hours >= 21;
    };

    if (
      isWeekend(formData.startDate) ||
      isWeekend(formData.endDate) ||
      isLate(formData.startTime) ||
      isLate(formData.endTime)
    ) {
      required.push(
        "Form 3 (Permission to Stay on Campus After 9:00 PM and On Weekends)"
      );
    }

    return required;
  };

  const setFieldError = (field, hasError) => {
    setFieldErrors((prev) => ({ ...prev, [field]: hasError }));
  };

  const handleMenuNavigation = async (targetSection) => {
    const currentIndex = sectionOrder.indexOf(currentSection);
    const targetIndex = sectionOrder.indexOf(targetSection);

    if (targetIndex <= currentIndex) {
      // Allow back navigation freely
      setCurrentSection(targetSection);
      return;
    }

    // Validate current section before proceeding forward
    const { valid } = validateCurrentSection();
    if (valid) {
      setCurrentSection(targetSection);
    } else {
      toast.error("Please complete the current section before continuing.");
    }
  };

  const validateCurrentSection = () => {
  const {
    selectedValue,
    studentPosition,
    studentContact,
    activityName,
    activityDescription,
    selectedActivityType,
    selectedSDGs,
    chargingFees1,
    partnering,
    selectedPublicAffairs,
    partnerDescription,
    recurring,
    startDate,
    endDate,
    startTime,
    endTime,
    recurringDays,
    isOffCampus,
    venue,
    venueApprover,
    venueApproverContact,
    greenCampusMonitor,
    greenCampusMonitorContact,
    selectedFile,
    appealReason
  } = formData;

  const errorScroll = (fieldId) => {
    const el = document.getElementById(fieldId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus?.();
    }
  };

  const fail = (field, message) => {
    setFieldError(field, true);
    errorScroll(field);
    return { valid: false, field, message };
  };

  // ----------- General Info Validation -----------
  if (currentSection === "general-info") {
    if (!selectedValue) return fail("orgSelect", "Please select your organization.");
    if (studentPosition.trim().length < 3 || studentPosition.length > 50)
      return fail("studentPosition", "Student Position must be between 3 to 50 characters.");
    if (!/^\d{11}$/.test(studentContact))
      return fail("studentContact", "Student Contact must be an 11-digit number.");
    if (activityName.trim().length < 3 || activityName.length > 100)
      return fail("activityName", "Activity Name must be 3–100 characters.");
    if (activityDescription.trim().length < 20)
      return fail("activityDescription", "Description must be at least 20 characters.");
    if (!selectedActivityType)
      return fail("activityType", "Please select an activity type.");
    if (Object.values(selectedSDGs).filter(Boolean).length === 0)
      return fail("sdgGoals", "Select at least one SDG goal.");
    if (!chargingFees1)
      return fail("chargingFees", "Please indicate if you're charging fees.");
    if (!partnering)
      return fail("partnering", "Please indicate if you're partnering with a unit.");
  }

  // ----------- Date Info Validation -----------
  if (currentSection === "date-info") {
    if (!recurring) return fail("recurring", "Please indicate if activity is recurring.");
    if (!startDate) return fail("startDate", "Start date is required.");

const chosenDate = new Date(startDate);
const today = new Date();
today.setHours(0, 0, 0, 0);
chosenDate.setHours(0, 0, 0, 0);

if (chosenDate < today) {
  return fail("startDate", "Start date cannot be in the past.");
}
    if (!startTime) return fail("startTime", "Start time is required.");
    if (!endTime) return fail("endTime", "End time is required.");
    if (recurring === "recurring") {
      if (!endDate) return fail("endDate", "End date is required.");
      if (new Date(endDate) < new Date(startDate))
        return fail("endDate", "End date cannot be before start date.");
      const hasDay = Object.values(recurringDays).some(Boolean);
      if (!hasDay) return fail("recurringDays", "Select at least one recurring day.");
    }
  }

  // ----------- Specifications Validation -----------
  if (currentSection === "specifications") {
    if (!isOffCampus) return fail("offcampus", "Please indicate if off-campus.");
    if (!venue || venue.length > 100)
      return fail("venue", "Venue is required and must be under 100 characters.");
    if (isOffCampus !== "yes") {
      if (venueApprover.trim().length < 3 || venueApprover.length > 50)
        return fail("venueApprover", "Approver name must be 3–50 characters.");
      if (!/^09\d{9}$|^[^@]+@(up\.edu\.ph|gmail\.com)$/.test(venueApproverContact))
        return fail("venueApproverContact", "Provide valid phone or UP/Gmail email.");
    }
    if (partnering === "yes") {
    const hasPartner = Object.values(selectedPublicAffairs || {}).some((val) =>
      Array.isArray(val) ? val.some((v) => v.trim() !== "") : val === true
    );

    if (currentSection === "specifications" && !hasPartner) {
      setFieldError("partnerUnits", true);
      return fail("partnerUnits", "Select at least one partner.");
    } else {
      setFieldError("partnerUnits", false);
    }

    if (
      partnering === "yes" &&
      currentSection === "specifications" &&
      partnerDescription.trim().length < 3
    ) {
      return fail("partnerDescription", "Provide partner role description (min 3 chars).");
    }
  }
    if (greenCampusMonitor.trim().length < 3 || greenCampusMonitor.length > 50)
      return fail("greenCampusMonitor", "Monitor name must be 3–50 characters.");
    if (!/^09\d{9}$|^[^@]+@(up\.edu\.ph|gmail\.com)$/.test(greenCampusMonitorContact))
      return fail("greenCampusMonitorContact", "Provide valid phone or UP/Gmail email.");
  }

  // ----------- Submission Validation -----------
  if (currentSection === "submission") {
    if (!selectedFile)
      return fail("selectedFile", "Please upload your Activity Request PDF.");
    if (mode === "edit" && showAppealReason && appealReason.trim().length < 5)
      return fail("appealReason", "Please explain your reason for appeal (min 5 characters).");
  }

  return { valid: true };
  };


  const handleNext = () => {
    const result = validateCurrentSection();
    if (!result.valid) {
      toast.error(result.message || "Validation failed");
      setFieldError(result.field, true);
      return;
    }
    if (currentSection === "general-info") setCurrentSection("date-info");
    else if (currentSection === "date-info") setCurrentSection("specifications");
    else if (currentSection === "specifications") setCurrentSection("submission");
  };

const handleSubmit = async (e) => {
  e?.preventDefault();
  

  const result = validateCurrentSection();
  if (!result.valid) {
    toast.error(result.message || "Validation failed");
    return;
  }

  setIsSubmitting(true);

  try {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) throw new Error("User not authenticated");

    // Fetch matching account_id
    const { data: accountData, error: accountError } = await supabase
      .from("account")
      .select("account_id")
      .eq("email", user.email)
      .single();

    if (accountError || !accountData?.account_id) throw new Error("Account not found");

    const account_id = accountData.account_id;
    const { activityData, scheduleData } = buildActivityPayload(formData);
    activityData.account_id = account_id;
    if (mode === "edit") {
      if (!defaultValues?.activity_id) throw new Error("Missing activity_id for edit");
      const payload = {
        ...activityData,
        ...scheduleData,
        activity_id: defaultValues.activity_id,
        appeal_reason: formData.appealReason,
        final_status: "For Appeal",
        sro_approval_status: null,
        odsa_approval_status: null,
        sro_remarks: null,
        odsa_remarks: null,
      };
      await editActivity(payload, {}); // schedule is already merged in payload
    } else if (mode === "admin") {
      await submitAdminActivity(activityData, scheduleData, formData.selectedFile);
    } else {
      await createActivity(activityData, formData.selectedFile, scheduleData);
    }

    setShowSuccessDialog(true);
    setTimeout(() => navigate("/dashboard"), 1500);
  } catch (err) {
    console.error(err);
    toast.error("Submission failed: " + err.message);
  } finally {
    setIsSubmitting(false);
  }
};


const buildActivityPayload = (form) => {
  // Extract SDGs as a comma-separated string
  const selectedSDGs = Object.entries(form.selectedSDGs)
    .filter(([_, value]) => value === true)
    .map(([key]) => key)
    .join(", ");

  // Extract partner names from selectedPublicAffairs
  const selectedPartners = Object.entries(form.selectedPublicAffairs)
    .flatMap(([unit, val]) => {
      if (Array.isArray(val)) return val.filter(v => v.trim() !== "");
      return val === true ? [unit] : [];
    })
    .join(", ");

  const activityData = {
    org_id: form.selectedValue,
    student_position: form.studentPosition,
    student_contact: form.studentContact,
    activity_name: form.activityName.trim(),
    activity_description: form.activityDescription.trim(),
    activity_type: form.selectedActivityType,
    is_off_campus: form.isOffCampus === "yes",
    is_recurring: form.recurring === "recurring",
    venue: form.venue,
    venue_approver: form.venueApprover,
    venue_approver_contact: form.venueApproverContact,
    green_monitor_name: form.greenCampusMonitor,
    green_monitor_contact: form.greenCampusMonitorContact,
    charge_fee: form.chargingFees1 === "yes",
    university_partner: form.partnering === "yes",
    partner_name: selectedPartners,
    partner_role: form.partnerDescription,
    sdg_goals: selectedSDGs,
    status: "For Review",
    submitted_at: new Date().toISOString(),
  };

  const scheduleData = {
    start_date: form.startDate,
    end_date: form.recurring === "recurring" ? form.endDate : form.startDate,
    start_time: form.startTime,
    end_time: form.endTime,
    recurring_days: form.recurring === "recurring" ? JSON.stringify(form.recurringDays) : null,
  };

  return { activityData, scheduleData };
};


  return (
    <div className="min-h-screen flex flex-col items-start justify-start py-8">
    <div className="w-full max-w-2xl mx-auto px-6">
      <h1 className="text-2xl font-bold mb-6 text-left">
        {mode === "edit"
          ? "Edit Submission"
          : mode === "admin"
          ? "Admin: Add Activity"
          : "Request Form"}
      </h1>
    <form onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} className="space-y-8">
      <Toaster />

      {/* Menu Bar */}
      <div className="flex items-center space-x-4 mb-4">
          <Button
              type="button"
              variant={currentSection === "general-info" ? "default" : "ghost"}
              className={currentSection === "general-info" ? buttonClasses() : buttonClasses("outline")}
              onClick={() => handleMenuNavigation("general-info")}
          >
              General Information
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
              type="button"
              variant={currentSection === "date-info" ? "default" : "ghost"}
              className={`${currentSection === "date-info" ? buttonClasses() : buttonClasses("outline")}"}`}
              onClick={() => handleMenuNavigation("date-info")}
          >
              Date Information
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
              type="button"
              variant={currentSection === "specifications" ? "default" : "ghost"}
              className={`${currentSection === "specifications" ? buttonClasses() : buttonClasses("outline")}"}`}
              onClick={() => handleMenuNavigation("specifications")}
          >
              Specifications
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
              type="button"
              variant={currentSection === "submission" ? "default" : "ghost"}
              className={`${currentSection === "submission" ? buttonClasses() : buttonClasses("outline")}}`}
              onClick={() => handleMenuNavigation("submission")}
          >
              Submission
          </Button>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
          <Progress 
              value={currentSection === "general-info" ? 25 : 
                  currentSection === "date-info" ? 50 : 
                  currentSection === "specifications" ? 75 : 100} 
              className="h-2 bg-[#014421]/20 [&>div]:bg-[#014421]"
          />
      </div>

      {/* Sections */}
      {/* General Information Section */}
      {currentSection === "general-info" && (
                            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    {/* Organization Name */}
                                    <div>
                                    <h3 className="text-sm font-medium mb-2">
                                        Organization Name <span className="text-red-500">*</span>
                                    </h3>

                                    <Popover open={formData.open} onOpenChange={(val) => setFormData((prev) => ({ ...prev, open: val }))}>
                                    <PopoverTrigger asChild>
                                        <div 
                                            id="orgSelect"
                                            role="combobox"
                                            aria-expanded={formData.open}
                                            className="w-full flex items-center justify-between border border-input bg-transparent rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring hover:border-gray-400"
                                        >
                                            <span className={cn(!formData.selectedOrgName && "text-muted-foreground")}>
                                              {formData.selectedOrgName || "Type your org name..."}
                                            </span>
                                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </div>
                                    </PopoverTrigger>

                                        <PopoverContent align="start" className="w-full max-w-md p-0">
                                        <Input
                                            placeholder="Search organization..."
                                            value={formData.searchTerm}
                                            onChange={(e) =>
                                              setFormData((prev) => ({ ...prev, searchTerm: e.target.value }))
                                            }
                                            className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                                        />
                                        <div className="max-h-48 overflow-y-auto">
                                            {filteredOrgs.length > 0 ? (
                                            filteredOrgs.map((org) => (
                                                <button
                                                key={org.org_id}
                                                onClick={() => {
                                                  setFormData((prev) => ({
                                                    ...prev,
                                                    selectedValue: String(org.org_id),
                                                    selectedOrgName: org.org_name,
                                                    searchTerm: "",
                                                    open: false,
                                                    organizationAdviser: org.adviser_name || "",
                                                    organizationAdviserContact: org.adviser_email || ""
                                                  }));
                                                  setFieldError("orgSelect", false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-4 py-2 hover:bg-gray-100",
                                                    formData.selectedValue === String(org.org_id) && "bg-gray-100 font-medium"
                                                )}
                                                >
                                                {org.org_name}
                                                {formData.selectedValue === String(org.org_id) && (
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
                                    {fieldErrors.orgSelect && (
                                    <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                                        Organization is required.
                                    </p>
                                    )}
                                    </div>

                                    {/* Student Information */}
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">
                                                Student Position <span className="text-red-500">*</span>
                                            </h3>
                                            <Input
                                                id="studentPosition"
                                                onBlur={(e) => {
                                                const value = e.target.value.trim();
                                                setFieldError("studentPosition", value.length < 3 || value.length > 50);
                                                }}
                                                className={cn(
                                                "peer",
                                                fieldErrors.studentPosition && "border-[#7B1113] bg-red-50"
                                                )}
                                                placeholder="(Chairperson, Secretary, etc.)"
                                                value={formData.studentPosition}
                                                onChange={(e) => {
                                                  const value = e.target.value;
                                                  setFormData((prev) => ({ ...prev, studentPosition: value }));
                                                  if (value.trim().length >= 3 && value.length <= 50) {
                                                    setFieldError("studentPosition", false);
                                                  }
                                                }}
                                            />
                                            {fieldErrors.studentPosition && (
                                                <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                                                Student Position must be between 3 to 50 characters.
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Student Contact Number <span className="text-red-500">*</span></h3>
                                            <Input
                                                id="studentContact"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="(09XXXXXXXXX)"
                                                onBlur={() => setFieldError("studentContact", !/^\d+$/.test(formData.studentContact))}
                                                value={formData.studentContact}
                                                onChange={(e) => {
                                                  const value = e.target.value.replace(/\D/g, "");
                                                  setFormData((prev) => ({ ...prev, studentContact: value }));
                                                  if (/^\d+$/.test(value)) setFieldError("studentContact", false);
                                                }}
                                                className={fieldErrors.studentContact ? "border-[#7B1113] bg-red-50" : ""}
                                                />
                                                {fieldErrors.studentContact && (
                                                <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                                                    Must be a valid 11-digit number (09XXXXXXXXX).
                                                </p>
                                                )}
                                        </div>
                                    </div>

                                    {/* Activity Information */}
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Activity Name <span className="text-red-500">*</span></h3>
                                            <Input
                                                id="activityName" onBlur={() => setFieldError("activityName", formData.activityName.trim().length < 3 || formData.activityName.length > 100)} className={fieldErrors.activityName ? "border-[#7B1113] bg-red-50" : ""}
                                                placeholder="(Mass Orientation, Welcome Party, etc.)"
                                                value={formData.activityName}
                                                onChange={(e) => {
                                                  const value = e.target.value;
                                                  setFormData((prev) => ({ ...prev, activityName: value }));
                                                  if (value.trim().length >= 3 && value.length <= 100)
                                                    setFieldError("activityName", false);
                                                }}
                                            />
                                            {fieldErrors.activityName && (
                                            <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                                                Must be 3 to 100 characters.
                                            </p>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Activity Description <span className="text-red-500">*</span></h3>
                                            <Textarea
                                                id="activityDescription"
                                                onBlur={() => setFieldError("activityDescription", formData.activityDescription.trim().length < 20)}
                                                className={`${fieldErrors.activityDescription ? "border-[#7B1113] bg-red-50" : ""} min-h-[100px]`}
                                                placeholder="Enter activity description"
                                                value={formData.activityDescription}
                                                onChange={(e) => {
                                                  const value = e.target.value;
                                                  setFormData((prev) => ({ ...prev, activityDescription: value }));
                                                  if (value.trim().length >= 20) setFieldError("activityDescription", false);
                                                }}
                                            />
                                            {fieldErrors.activityDescription && (
                                            <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                                                Must be at least 20 characters.
                                            </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Activity Type */}
                                    <div className="space-y-2">
                                      <h3 className="text-sm font-medium mb-2">
                                        Activity Type <span className="text-red-500">*</span>
                                      </h3>
                                      <Select
                                        value={formData.selectedActivityType}
                                        onValueChange={(value) => {
                                          setFormData((prev) => ({ ...prev, selectedActivityType: value }));
                                          if (value.trim() !== "") setFieldError("activityType", false);
                                        }}
                                        onBlur={() =>
                                          setFieldError("activityType", formData.selectedActivityType.trim() === "")
                                        }
                                      >
                                        <SelectTrigger
                                          id="activityType"
                                          className={cn(
                                            "w-full",
                                            fieldErrors.activityType && "border-[#7B1113] bg-red-50"
                                          )}
                                        >
                                        <SelectValue placeholder="Select activity type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {activityTypeOptions.map((option) => (
                                            <SelectItem key={option.id} value={option.id}>
                                              {option.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      {fieldErrors.activityType && (
                                        <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                                          Please select an activity type.
                                        </p>
                                      )}
                                    </div>


                                    {/* Sustainable Development Goals */}
                                    <div>
                                    <h3 className="text-sm font-medium mb-2">Sustainable Development Goals <span className="text-red-500">*</span></h3>
                                    <div className="mb-4 border border-gray-200 rounded-md">
                                        <details id="sdgGoals" className={fieldErrors.sdgGoals ? "border-[#7B1113] bg-red-50" : ""} open>
                                        {fieldErrors.sdgGoals && (
                                        <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                                            Please select at least one SDG goal.
                                        </p>
                                        )}
                                        <summary className="cursor-pointer px-4 py-2 bg-gray-100 font-medium capitalize">
                                            SDG List
                                        </summary>
                                        <div className="px-4 py-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {sdgOptions.map((option) => (
                                            <div key={option.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                id={option.id}
                                                checked={formData.selectedSDGs[option.id] || false}
                                                onCheckedChange={(checked) => {
                                                  const updated = {
                                                    ...formData.selectedSDGs,
                                                    [option.id]: checked
                                                  };
                                                  setFormData((prev) => ({ ...prev, selectedSDGs: updated }));

                                                  const atLeastOne = Object.values(updated).some(Boolean);
                                                  if (atLeastOne) setFieldError("sdgGoals", false);
                                                }}
                                                />
                                                <label htmlFor={option.id} className="text-sm">
                                                {option.label}
                                                </label>
                                            </div>
                                            ))}
                                        </div>
                                        </details>
                                    </div>
                                    </div>

                                    {/* Charging Fees */}
                                    <div>
                                        <h3 className="text-sm font-medium mb-2">Charging Fees? <span className="text-red-500">*</span></h3>
                                        <RadioGroup
                                        id="chargingFees"
                                        onBlur={() => setFieldError("chargingFees", formData.chargingFees1.trim() === "")}
                                        value={formData.chargingFees1}
                                        onValueChange={(value) =>
                                          setFormData((prev) => ({ ...prev, chargingFees1: value }))
                                        }
                                        className={`${fieldErrors.chargingFees ? "border-[#7B1113] bg-red-50" : ""} space-y-3`}
                                        >
                                        {fieldErrors.chargingFees && (
                                        <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                                            Please indicate if you are charging fees.
                                        </p>
                                        )}
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="yes" id="fees-yes" />
                                                <label htmlFor="fees-yes" className="text-sm font-medium leading-none">
                                                    Yes
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="no" id="fees-no" />
                                                <label htmlFor="fees-no" className="text-sm font-medium leading-none">
                                                    No
                                                </label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    {/* Partnering */}
                                    <div>
                                        <h3 className="text-sm font-medium mb-2">Partnering with a university unit or organization? <span className="text-red-500">*</span></h3>
                                        <RadioGroup
                                        id="partnering"
                                        onBlur={() => setFieldError("partnering", formData.partnering.trim() === "")}
                                        value={formData.partnering}
                                        onValueChange={(val) => {
                                          setFormData((prev) => ({ ...prev, partnering: val }));
                                          if (val.trim() !== "") setFieldError("partnering", false);
                                        }}
                                        className={`${fieldErrors.partnering ? "border-[#7B1113] bg-red-50" : ""} space-y-3`}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="yes" id="partnering-yes" />
                                                <label htmlFor="partnering-yes" className="text-sm font-medium leading-none">
                                                    Yes
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="no" id="partnering-no" />
                                                <label htmlFor="partnering-no" className="text-sm font-medium leading-none">
                                                    No
                                                </label>
                                            </div>
                                        </RadioGroup>
                                        {fieldErrors.partnering && (
                                          <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                                            Please indicate if you're partnering with a unit.
                                          </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row justify-end gap-2">
                                    <Button
                                        type="button"
                                        className={`${buttonClasses()} px-6`}
                                        onClick={() => handleNext()}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
      )}
      
      {/* Date Information Section */}
      {currentSection === "date-info" && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                  {/* Recurring */}
                  <div>
                      <h3 className="text-sm font-medium mb-2">Recurring? <span className="text-red-500">*</span></h3>
                      <RadioGroup
                      id="recurring"
                      onBlur={() => setFieldError("recurring", formData.recurring.trim() === "")}
                      value={formData.recurring}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, recurring: value }))
                      }
                      className={`${fieldErrors.recurring ? "border-[#7B1113] bg-red-50" : ""} space-y-3`}                                        >
                      {fieldErrors.recurring && (
                      <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                          Please select if the activity is recurring.
                      </p>
                      )}
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="one-time" id="one-time" />
                              <label htmlFor="one-time" className="text-sm font-medium leading-none">
                                  One-time
                              </label>
                          </div>
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="recurring" id="recurring" onBlur={() => setFieldError("recurring", formData.recurring.trim() === "")} 
                              className={fieldErrors.recurring ? "border-red-300 bg-red-50" : ""} />
                              <label htmlFor="recurring" className="text-sm font-medium leading-none">
                                  Recurring
                              </label>
                          </div>
                      </RadioGroup>
                  </div>

                  {/* Date and Time Information */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                          <h3 className="text-sm font-medium mb-2">Activity Start Date <span className="text-red-500">*</span></h3>
                          <Input
                            id="startDate"
                            type="date"
                            min={nextDay}
                            value={formData.startDate}
                            onBlur={() => {
                              const chosen = new Date(formData.startDate);
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              chosen.setHours(0, 0, 0, 0);

                              setFieldError("startDate", !formData.startDate || chosen <= today);
                            }}
                            className={cn(
                              fieldErrors.startDate
                                ? "border-[#7B1113] bg-red-50"
                                : (() => {
                                    const today = new Date();
                                    const chosen = new Date(formData.startDate);
                                    today.setHours(0, 0, 0, 0);
                                    chosen.setHours(0, 0, 0, 0);

                                    const addBusinessDays = (date, days) => {
                                      const result = new Date(date);
                                      let added = 0;
                                      while (added < days) {
                                        result.setDate(result.getDate() + 1);
                                        const day = result.getDay();
                                        if (day !== 0 && day !== 6) added++;
                                      }
                                      return result;
                                    };

                                    const minAllowed = addBusinessDays(today, 5);
                                    minAllowed.setHours(0, 0, 0, 0);

                                    if (formData.startDate && chosen < minAllowed && chosen > today) {
                                      return "border-yellow-400 bg-yellow-50";
                                    }

                                    return "";
                                  })()
                            )}
                            onChange={(e) => {
                              const value = e.target.value;
                              const chosen = new Date(value);
                              const minDate = new Date(minStartDate);
                              setFormData((prev) => ({ ...prev, startDate: value }));
                              if (value && chosen >= minDate) {
                                setFieldError("startDate", false);
                              }
                            }}
                          />
                          {fieldErrors.startDate && (
                            <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                              {formData.startDate
                                ? "Start date cannot be in the past."
                                : "Start date is required."}
                            </p>
                          )}

                          {formData.startDate && (() => {
                            const addBusinessDays = (date, days) => {
                              const result = new Date(date);
                              let added = 0;
                              while (added < days) {
                                result.setDate(result.getDate() + 1);
                                const day = result.getDay();
                                if (day !== 0 && day !== 6) added++;
                              }
                              return result;
                            };

                            const minDate = addBusinessDays(new Date(), 5);
                            const selected = new Date(formData.startDate);
                            selected.setHours(0, 0, 0, 0);
                            minDate.setHours(0, 0, 0, 0);

                            if (selected < minDate && selected >= new Date()) {
                              return (
                                <p className="text-xs text-yellow-600 mt-1 px-1 font-medium">
                                  ⚠️ <strong>Warning:</strong> This activity is not 5 business days in advance.
                                  Please coordinate directly with SRO. You may still submit your request.
                                </p>
                              );
                            }
                            return null;
                          })()}
                      </div>
                      {formData.recurring === "recurring" && (
                          <div>
                              <h3 className="text-sm font-medium mb-2">Activity End Date <span className="text-red-500">*</span></h3>
                              <Input
                                  id="endDate" 
                                  onBlur={() => {
                                    const start = new Date(formData.startDate);
                                    const end = new Date(formData.endDate);
                                    const invalid = !formData.endDate || (formData.recurring === "recurring" && formData.startDate && formData.endDate && end < start);
                                    setFieldError("endDate", invalid);
                                  }}
                                  className={fieldErrors.endDate ? "border-[#7B1113] bg-red-50" : ""}
                                  type="date"
                                  min={new Date().toISOString().split("T")[0]}
                                  value={formData.endDate}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData((prev) => ({ ...prev, endDate: value }));

                                    const start = new Date(formData.startDate);
                                    const end = new Date(value);
                                    const valid = value && (formData.recurring !== "recurring" || (formData.startDate && end >= start));

                                    if (valid) setFieldError("endDate", false);
                                  }}
                              />
                              {fieldErrors.endDate && (
                              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                                  {formData.endDate === ""
                                  ? "End date is required for recurring activities."
                                  : "End date cannot be before start date."}
                              </p>
                              )}
                          </div>
                      )}
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                          <h3 className="text-sm font-medium mb-2">Activity Start Time <span className="text-red-500">*</span> </h3>
                          
                          <Input
                              id="startTime" onBlur={() => setFieldError("startTime", !formData.startTime)} className={fieldErrors.startTime ? "border-[#7B1113] bg-red-50" : ""}
                              type="time"
                              value={formData.startTime}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFormData((prev) => ({ ...prev, startTime: value }));
                                if (value !== "") setFieldError("startTime", false);
                              }}
                          />
                          {fieldErrors.startTime && (
                          <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                              Start time is required.
                          </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                          NOTE: Official curfew in the campus is at 9:00PM.
                          </p>
                      </div>
                      <div>
                          <h3 className="text-sm font-medium mb-2">Activity End Time <span className="text-red-500">*</span></h3>
                          <Input
                              id="endTime" onBlur={() => setFieldError("endTime", !formData.endTime)} className={fieldErrors.endTime ? "border-[#7B1113] bg-red-50" : ""}
                              type="time"
                              value={formData.endTime}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFormData((prev) => ({ ...prev, endTime: value }));
                                if (value !== "") setFieldError("endTime", false);
                              }}
                          />
                          {fieldErrors.endTime && (
                          <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                              End time is required.
                          </p>
                          )}
                      </div>
                  </div>

                  {/* Recurring Days */}
                  {formData.recurring === "recurring" && (
                      <div id="recurringDays" className={fieldErrors.recurringDays ? "border-[#7B1113] bg-red-50 p-2 rounded-md" : ""}>
                      {fieldErrors.recurringDays && (
                      <p className="text-xs text-[#7B1113] mt-2 px-1 font-medium">
                          Please select at least one recurring day.
                      </p>
                      )}
                          <h3 className="text-sm font-medium mb-2">Recurring Day/s Per Week <span className="text-red-500">*</span></h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {Object.keys(formData.recurringDays).map((day) => (
                                  <div key={day} className="flex items-center space-x-2">
                                      <Checkbox
                                          id={`day-${day}`}
                                          checked={formData.recurringDays[day]}
                                          onCheckedChange={(checked) => {
                                            const updated = {
                                              ...formData.recurringDays,
                                              [day]: checked
                                            };
                                            setFormData((prev) => ({ ...prev, recurringDays: updated }));

                                            const atLeastOne = Object.values(updated).some(Boolean);
                                            if (atLeastOne) setFieldError("recurringDays", false);
                                          }}
                                      />
                                      <label
                                          htmlFor={`day-${day}`}
                                          className="text-sm font-medium leading-none"
                                      >
                                          {day}
                                      </label>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button
                      type="button"
                      className={`${buttonClasses()} px-6`}
                      onClick={() => handleNext()}
                  >
                      Next
                  </Button>
              </div>
          </div>
      )}

      {/* Specifications Section */}
      {currentSection === "specifications" && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                  {/* Off-Campus */}
                  <div>
                      <h3 className="text-sm font-medium mb-2">Off-Campus? <span className="text-red-500">*</span></h3>
                      <RadioGroup
                      id="offcampus"
                      value={formData.isOffCampus}
                      onValueChange={(val) => {
                        setFormData((prev) => ({ ...prev, isOffCampus: val }));
                        if (val.trim() !== "") setFieldError("offcampus", false);
                      }}
                      className={`${fieldErrors.offcampus ? "border-[#7B1113] bg-red-50" : ""} space-y-3`}                                        >
                      {fieldErrors.offcampus && (
                      <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                          Please indicate if the activity is off-campus.
                      </p>
                      )}
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="offcampus-yes" />
                              <label htmlFor="offcampus-yes" className="text-sm font-medium leading-none">
                                  Yes
                              </label>
                          </div>
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="offcampus-no" />
                              <label htmlFor="offcampus-no" className="text-sm font-medium leading-none">
                                  No
                              </label>
                          </div>
                      </RadioGroup>
                  </div>

                  {/* Venue Information */}
                  <div className="space-y-6">
                      <div>
                          <h3 className="text-sm font-medium mb-2">Venue <span className="text-red-500">*</span></h3>
                          <Input
                              id="venue" onBlur={() => setFieldError("venue", formData.venue.trim() === "" || formData.venue.length > 100)} 
                              className={fieldErrors.venue ? "border-[#7B1113] bg-red-50" : ""}                   
                              type="text"
                              placeholder="(Teatro Amianan, CS AVR, etc.)"
                              value={formData.venue}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFormData((prev) => ({ ...prev, venue: value }));
                                if (value.trim() !== "" && value.length <= 100)
                                  setFieldError("venue", false);
                              }}
                          />
                          {fieldErrors.venue && (
                          <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                              Venue must not exceed 100 characters.
                          </p>
                          )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <h3 className="text-sm font-medium mb-2">Venue Approver <span className="text-red-500">*</span></h3>
                              <Input
                              id="venueApprover"
                              onBlur={() => setFieldError("venueApprover", formData.venueApprover.trim().length < 3 || formData.venueApprover.length > 50)}
                              className={`${fieldErrors.venueApprover ? "border-[#7B1113] bg-red-50" : ""} ${formData.isOffCampus === "yes" ? "bg-gray-100 cursor-not-allowed" : ""}`}
                              type="text"
                              placeholder="Ex. Lance Gabriel Sacdalan"
                              value={formData.isOffCampus === "yes" ? "N/A" : formData.venueApprover}
                              disabled={formData.isOffCampus === "yes"}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFormData((prev) => ({ ...prev, venueApprover: value }));
                                if (value.trim().length >= 3 && value.length <= 50)
                                  setFieldError("venueApprover", false);
                              }}
                              />
                              {fieldErrors.venueApprover && (
                              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                                  Venue approver must be 3 to 50 characters.
                              </p>
                              )}
                          </div>
                          <div>
                              <h3 className="text-sm font-medium mb-2">Venue Approver Contact Info <span className="text-red-500">*</span></h3>
                              <Input
                              id="venueApproverContact"
                              onBlur={() =>
                                  setFieldError(
                                  "venueApproverContact",
                                  !/^09\d{9}$|^[a-zA-Z0-9._%+-]{3,}@(up\.edu\.ph|gmail\.com)$/.test(formData.venueApproverContact)
                                  )
                              }
                              className={`${fieldErrors.venueApproverContact ? "border-[#7B1113] bg-red-50" : ""} ${formData.isOffCampus === "yes" ? "bg-gray-100 cursor-not-allowed" : ""}`}                                     
                              type="text"
                              placeholder="09XXXXXXXXX or XXX@up.edu.ph"
                              value={formData.isOffCampus === "yes" ? "N/A" : formData.venueApproverContact}
                              disabled={formData.isOffCampus === "yes"}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFormData((prev) => ({ ...prev, venueApproverContact: value }));
                                if (/^09\d{9}$|^[^@]+@(up\.edu\.ph|gmail\.com)$/.test(value))
                                  setFieldError("venueApproverContact", false);
                              }}
                              />
                              {fieldErrors.venueApproverContact && (
                              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                                  Must be a valid mobile number or UP/Gmail email.
                              </p>
                              )}
                          </div>
                      </div>
                  </div>

                  {/* Organization Information */}
                  <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <h3 className="text-sm font-medium mb-2">Organization Adviser <span className="text-red-500">*</span></h3>
                              <Input
                              type="text"
                              value={formData.organizationAdviser}
                              disabled
                              className="cursor-not-allowed bg-gray-100"
                              />
                          </div>
                          <div>
                              <h3 className="text-sm font-medium mb-2">Organization Adviser Contact Info <span className="text-red-500">*</span></h3>
                              <Input
                              type="text"
                              value={formData.organizationAdviserContact}
                              disabled
                              className="cursor-not-allowed bg-gray-100"
                              />
                          </div>
                      </div>
                  </div>

                  {/* University Partner Section (Only if partnering === "yes") */}
                  {formData.partnering === "yes" && (
                    <div className="space-y-6">
                      <h3 className="text-sm font-medium mb-2">
                        Partners <span className="text-red-500">*</span>
                      </h3>

                      {Object.entries(formData.universityPartners || {}).map(([category, units]) => (
                        <div key={category} className="mb-4 border border-gray-200 rounded-md">
                          <details>
                            <summary className="cursor-pointer px-4 py-2 bg-gray-100 font-medium capitalize">
                              {category.replace(/([A-Z])/g, " $1")}
                            </summary>
                            <div className="px-4 py-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {units.map((unit) => (
                                <div key={unit} className="flex flex-col space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${category}-${unit}`}
                                      checked={!!formData.selectedPublicAffairs[unit]}
                                      onCheckedChange={(checked) => {
                                        const updated = {
                                          ...formData.selectedPublicAffairs,
                                          [unit]: checked ? (unit === "Others" ? [""] : true) : false,
                                        };
                                        setFormData((prev) => ({
                                          ...prev,
                                          selectedPublicAffairs: updated,
                                        }));

                                        const hasAny = Object.values(updated).some((val) =>
                                          Array.isArray(val) ? val.some((v) => v.trim() !== "") : val === true
                                        );
                                        if (hasAny) setFieldError("partnerUnits", false);
                                      }}
                                    />
                                    <label htmlFor={`${category}-${unit}`} className="text-sm">
                                      {unit}
                                    </label>
                                  </div>

                                  {unit === "Others" &&
                                    Array.isArray(formData.selectedPublicAffairs["Others"]) && (
                                      <div className="ml-6 mt-1 space-y-2">
                                        {formData.selectedPublicAffairs["Others"].map((value, index) => (
                                          <div key={index} className="flex items-center gap-2">
                                            <Input
                                              type="text"
                                              placeholder={`Custom Partner #${index + 1}`}
                                              value={value}
                                              onChange={(e) => {
                                                const updated = [...formData.selectedPublicAffairs["Others"]];
                                                updated[index] = e.target.value;
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  selectedPublicAffairs: {
                                                    ...prev.selectedPublicAffairs,
                                                    Others: updated,
                                                  },
                                                }));
                                              }}
                                            />
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              className="text-[#7B1113]"
                                              onClick={() => {
                                                const updated = [...formData.selectedPublicAffairs["Others"]];
                                                updated.splice(index, 1);
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  selectedPublicAffairs: {
                                                    ...prev.selectedPublicAffairs,
                                                    Others: updated,
                                                  },
                                                }));
                                              }}
                                            >
                                              Remove
                                            </Button>
                                          </div>
                                        ))}
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          className="text-xs"
                                          onClick={() =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              selectedPublicAffairs: {
                                                ...prev.selectedPublicAffairs,
                                                Others: [...prev.selectedPublicAffairs["Others"], ""],
                                              },
                                            }))
                                          }
                                        >
                                          + Add Another
                                        </Button>
                                      </div>
                                    )}
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      ))}

                      <div>
                        <h3 className="text-sm font-medium mb-2">
                          Description of Partner’s Role in the Activity <span className="text-red-500">*</span>
                        </h3>
                        <Input
                          id="partnerDescription"
                          type="text"
                          placeholder="Provide their role"
                          value={formData.partnerDescription}
                          onBlur={() =>
                            setFieldError("partnerDescription", formData.partnerDescription.trim().length < 3)
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              partnerDescription: value,
                            }));
                            if (value.trim().length >= 3) {
                              setFieldError("partnerDescription", false);
                            }
                          }}
                          className={fieldErrors.partnerDescription ? "border-red-300 bg-red-50" : ""}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <h3 className="text-sm font-medium mb-2">Green Campus Monitor <span className="text-red-500">*</span></h3>
                              <Input
                                  id="greenCampusMonitor" onBlur={() => setFieldError("greenCampusMonitor", formData.greenCampusMonitor.trim().length < 3 || formData.greenCampusMonitor.length > 50)}className={fieldErrors.greenCampusMonitor ? "border-[#7B1113] bg-red-50" : ""}type="text"
                                  placeholder="Ex. Clarence Kyle Pagunsan"
                                  value={formData.greenCampusMonitor}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData((prev) => ({ ...prev, greenCampusMonitor: value }));
                                    if (value.trim().length >= 3 && value.length <= 50)
                                      setFieldError("greenCampusMonitor", false);
                                  }}
                              />
                              {fieldErrors.greenCampusMonitor && (
                              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                                  Must be 3 to 50 characters.
                              </p>
                              )}
                          </div>
                          <div>
                              <h3 className="text-sm font-medium mb-2">Green Campus Monitor Contact Info <span className="text-red-500">*</span></h3>
                              <Input
                                  id="greenCampusMonitorContact" onBlur={() => setFieldError("greenCampusMonitorContact", !/^09\d{9}$|^[a-zA-Z0-9._%+-]{3,}@(up\.edu\.ph|gmail\.com)$/.test(formData.greenCampusMonitorContact))}
                                  className={fieldErrors.greenCampusMonitorContact ? "border-[#7B1113] bg-red-50" : ""}
                                  type="text"
                                  placeholder="09XXXXXXXXX or XXX@up.edu.ph"
                                  value={formData.greenCampusMonitorContact}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData((prev) => ({ ...prev, greenCampusMonitorContact: value }));
                                    if (/^09\d{9}$|^[^@]+@(up\.edu\.ph|gmail\.com)$/.test(value))
                                      setFieldError("greenCampusMonitorContact", false);
                                  }}
                              />
                              {fieldErrors.greenCampusMonitorContact && (
                              <p className="text-xs text-[#7B1113] mt-1 px-1 font-medium">
                                  Must be a valid mobile number or UP/Gmail email.
                              </p>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button
                      type="button"
                      className={`${buttonClasses()} px-6`}
                      onClick={() => handleNext()}
                  >
                      Next
                  </Button>
              </div>
          </div>
      )}

      {/* Submission Section */}
      {currentSection === "submission" && (
  <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
    {mode === "edit" && showAppealReason && (
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">
          Appeal Reason <span className="text-red-500">*</span>
        </h3>
        <Textarea
          id="appealReason"
          placeholder="Write the reason why you are editing your submission..."
          value={formData.appealReason}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, appealReason: e.target.value }))
          }
          className="min-h-[100px]"
        />
      </div>
    )}

    <h3 className="text-sm font-medium mb-2">
      Scanned Copy of Activity Request Form (PDF){" "}
      <span className="text-red-500">*</span>
    </h3>

    <div className="border rounded-md p-4">
      <p className="text-sm text-gray-600 mb-3">
        Provide a scanned copy of your activity request form with your point
        person's, venue approver's, and adviser's signature.
      </p>
      <p className="text-sm text-gray-600 font-bold mb-3">
        NOTE: INCLUDE OTHER SCANNED FORMS IN THE PDF IF RELEVANT
        <br />
        (Notice of Off-Campus Activity, Job Request Forms, etc.)
      </p>
      <p className="text-sm text-gray-600 font-bold mb-3">
        [LAST NAME OF REQUESTING STUDENT]_[ORG]_Activity Request
        Form_(mm-dd-yyyy)
        <br />
        i.e. LARUA-TinigAmianan_Activity-Request-Form_01-01-2024
      </p>

      <div className="mb-4 p-4 bg-muted/40 border rounded-md text-sm">
          <h4 className="font-medium text-base mb-2 text-[#7B1113]">
            What to include in your single PDF file:
          </h4>
          <ul className="list-disc list-inside space-y-1">
            {getRequiredDocuments().map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setFormData((prev) => ({ ...prev, isDragActive: true }));
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setFormData((prev) => ({ ...prev, isDragActive: false }));
        }}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file?.type !== "application/pdf") {
            toast.error("Only PDF files are allowed.");
            return;
          }
          setFormData((prev) => ({ ...prev, selectedFile: file, isDragActive: false }));
        }}
        className={cn(
          "border-2 border-dashed p-4 rounded-md text-center transition-colors",
          formData.selectedFile
            ? "border-gray-300 bg-gray-50 cursor-not-allowed"
            : formData.isDragActive
            ? "border-green-600 bg-green-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-muted"
        )}
      >
        <label
          htmlFor="activityUpload"
          className={cn(
            "cursor-pointer flex flex-col items-center",
            formData.selectedFile && "cursor-not-allowed opacity-70"
          )}
        >
          <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm">
            {formData.selectedFile
              ? "You cannot upload or drag files after completion."
              : formData.isDragActive
              ? "Drop the file here"
              : "Drag and Drop or Click to Upload File (1 required)"}
          </p>
          <input
            ref={fileInputRef}
            id="activityUpload"
            type="file"
            accept=".pdf"
            disabled={!!formData.selectedFile || isSubmitting}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || file.type !== "application/pdf") {
                toast.error("Only PDF files are allowed.");
                return;
              }
              setFormData((prev) => ({ ...prev, selectedFile: file }));
            }}
            className="hidden"
          />
        </label>
      </div>

      {formData.selectedFile && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-1">Selected File</h4>
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground border px-3 py-2 rounded-md">
            <div className="flex items-center gap-2 truncate">
              <FileText className="w-4 h-4 text-red-500 shrink-0" />
              <span className="truncate max-w-[240px]">{formData.selectedFile.name}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, selectedFile: null }));
                if (fileInputRef.current) {
                  fileInputRef.current.value = null;
                }
              }}
              className="text-muted-foreground hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>

    <div className="flex justify-between">
      <Button
        type="button"
        className="bg-gray-300 text-gray-600 hover:bg-gray-400 px-5"
        onClick={() => handleMenuNavigation("specifications")}
      >
        Back
      </Button>

      <Button
        onClick={(e) => {
          e.preventDefault();
          setShowConfirmDialog(true);
        }}
        type="submit"
        className={`${buttonClasses()} px-6`}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin h-4 w-4" />
            Uploading...
          </span>
        ) : mode === "edit" ? (
          "Confirm Appeal"
        ) : mode === "admin" ? (
          "Create Activity"
        ) : (
          "Submit Request"
        )}
      </Button>
    </div>
  </div>
      )}


      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
  <AlertDialogContent >
    <AlertDialogHeader>
      <AlertDialogTitle>
        {mode === "edit"
          ? "Confirm Appeal"
          : mode === "admin"
          ? "Confirm Activity Creation"
          : "Submit Activity Request"}
      </AlertDialogTitle>
      <AlertDialogDescription>
        {mode === "edit"
          ? "Are you sure you want to edit this activity request now?"
          : mode === "admin"
          ? "Are you sure you want to create this activity?"
          : "Are you sure you want to submit this activity request?"}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
        No
      </AlertDialogCancel>
      <AlertDialogAction
        onClick={(e) => handleSubmit(e)}
        disabled={isSubmitting}
        className={`${buttonClasses()} px-6`}
      >
        {isSubmitting ? "Submitting..." : "Yes"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSuccessDialog}>
        <AlertDialogContent className="max-w-md mx-auto rounded-2xl p-8 bg-white/90 border border-[#014421]/10 shadow-2xl text-center">
          <AlertDialogHeader>
            <div className="flex flex-col items-center">
              <Check className="h-12 w-12 text-[#014421] mb-3" />
              <AlertDialogTitle className="text-[#014421] text-2xl font-bold mb-3 text-center">
                {mode === "edit"
                  ? "Edited Successfully!"
                  : mode === "admin"
                  ? "Created Successfully!"
                  : "Submitted Successfully!"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base font-medium text-gray-700 mb-2">
                You will be redirected to the dashboard...
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRemindersDialog} onOpenChange={setShowRemindersDialog}>
        <AlertDialogContent className="max-h-[90vh] overflow-hidden">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#7B1113]">
              SRO Activity Request Guidelines
            </AlertDialogTitle>
          </AlertDialogHeader>

          <ScrollArea className="h-[60vh] pr-4">
            <div className="text-sm text-muted-foreground space-y-4 leading-relaxed">
              <p className="text-black font-medium">Before you proceed with your activity request, please be reminded of the following:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Requests for use of facilities must be submitted at least five (5) working days before the activity.</li>
                <li>All university facilities follow a strict 9:00 PM curfew. Staying beyond this time requires Form 3.</li>
                <li>Borrowed equipment must be returned the next working day. Loss or damage will incur replacement charges.</li>
                <li>Use only approved areas for selling, posting, or assembly. Coordinate first with the appropriate office.</li>
                <li>For classroom use, ensure that the room is cleaned and restored to original condition after the activity.</li>
                <li>If borrowing from OSA, schedule and coordinate early. Only officers listed in the org’s annual report are allowed.</li>
                <li>Extensions of use (time/facility) require new approval. Do not assume approval from previous forms carries over.</li>
                <li>Partnered activities require all partner representatives to sign the concept paper before submission.</li>
                <li>Off-campus activities require Form 2A and a notarized Form 2B (Waiver) per participant.</li>
                <li>Venue approver is required only if your event is on-campus and in-person.</li>
                <li>Violations will be recorded and may affect org standing or recognition.</li>
              </ol>
            </div>
          </ScrollArea>

          <AlertDialogFooter className="mt-4">
            <Button onClick={() => setShowRemindersDialog(false)} className="bg-[#7B1113] text-white hover:bg-[#5e0d0f]">
              I Understand
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </form>
    </div>
  </div>
  );
};

export default ActivityForm;