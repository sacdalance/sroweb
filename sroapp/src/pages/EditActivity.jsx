import { useState, useEffect } from "react";
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
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Progress } from "../components/ui/progress";
import { createActivity } from '../api/activityRequestAPI';     
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
import supabase from "@/lib/supabase"; 
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { FileText, Loader2, UploadCloud, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { editActivity } from "../api/activityEditAPI";
const EditActivity = () => {
    const [selectedValue, setSelectedValue] = useState("");
    const [studentPosition, setStudentPosition] = useState("");
    const [studentContact, setStudentContact] = useState("");
    const [activityName, setActivityName] = useState("");
    const [activityDescription, setActivityDescription] = useState("");
    const [selectedActivityType, setSelectedActivityType] = useState("");
    const [otherActivityType, setOtherActivityType] = useState("");
    const [chargingFees1, setChargingFees1] = useState("");
    const [partnering, setPartnering] = useState("");
    const [selectedSDGs, setSelectedSDGs] = useState({});
    const [partnerDescription, setPartnerDescription] = useState("");
    const [recurring, setRecurring] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [selectedPublicAffairs, setSelectedPublicAffairs] = useState({});
    const [endTime, setEndTime] = useState("");
    const [isOffCampus, setIsOffCampus] = useState("");
    const [venue, setVenue] = useState("");
    const [venueApprover, setVenueApprover] = useState("");
    const [venueApproverContact, setVenueApproverContact] = useState("");
    const location = useLocation();
    const navigate = useNavigate();
    const { activity, appealReason: initialAppealReason } = location.state || {};
    const [appealReason, setAppealReason] = useState(initialAppealReason || activity?.appeal_reason || "");
    useEffect(() => {
        if (isOffCampus === "yes") {
            setVenueApprover("N/A");
            setVenueApproverContact("N/A");
            } else if (isOffCampus === "no") {
            setVenueApprover("");
            setVenueApproverContact("");
            }
        }, [isOffCampus]);        
    const [organizationAdviser, setOrganizationAdviser] = useState("");
    const [organizationAdviserContact, setOrganizationAdviserContact] = useState("");
    const [greenCampusMonitor, setGreenCampusMonitor] = useState("");
    const [greenCampusMonitorContact, setGreenCampusMonitorContact] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [recurringDays, setRecurringDays] = useState({
        Monday: false,
        Tuesday: false,
        Wednesday: false,
        Thursday: false,
        Friday: false,
        Saturday: false
    });
    const [currentSection, setCurrentSection] = useState("general-info");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const setFieldError = (field, hasError) => {
    setFieldErrors(prev => ({ ...prev, [field]: hasError }));
    };


    useEffect(() => {
        if (!activity) {
            toast.error("No activity data found. Please try editing again from My Activities.");
            navigate("/activities");
            }
        }, [activity, navigate]);

    const getRequiredDocuments = () => {
        const required = [
        "Concept Paper",
        "Form 1A (Scanned Copy of Activity Request Form)",
        ];
    
        if (isOffCampus === "yes") {
        required.push(
            "Form 2A (Notice of Off-Campus Activity)",
            "Form 2B (Waiver for Off-Campus Student Activities), Notarized"
        );
        }
    
        const isWeekend = (dateStr) => {
        const date = new Date(dateStr);
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
        };
    
        const isLate = (time) => {
        if (!time) return false;
        const [hours] = time.split(":").map(Number);
        return hours >= 21;
        };
    
        if (
        isWeekend(startDate) ||
        isWeekend(endDate) ||
        isLate(startTime) ||
        isLate(endTime)
        ) {
        required.push(
            "Form 3 (Permission to Stay on Campus After 9:00 PM and On Weekends)"
        );
        }
    
        return required;
    };      

    // Validation function for navigating in forms
    const validateCurrentSection = (section, state) => {
        const {
            selectedValue,
            studentPosition,
            studentContact,
            activityName,
            activityDescription,
            selectedActivityType,
            startDate,
            startTime,
            endTime,
            endDate,
            recurring,
            venue,
            venueApprover,
            venueApproverContact,
            greenCampusMonitor,
            greenCampusMonitorContact,
            selectedFile,
            chargingFees1,
            selectedSDGs,
            partnering,
            selectedPublicAffairs,
            partnerDescription,
            isOffCampus,
            } = state;
        
            const isValidContact = /^09\d{9}$/.test(studentContact);
            const isValidEmailOrMobile = (val) =>
            /^09\d{9}$|^[^@]+@(up\.edu\.ph|gmail\.com)$/.test(val);
        
            if (section === "general-info") {
            if (!selectedValue) return { valid: false, field: "orgSelect", message: "Please select your organization." };
            if (!studentPosition) return { valid: false, field: "studentPosition", message: "Student position is required." };
            if (!isValidContact) return { valid: false, field: "studentContact", message: "Invalid contact number!" };
            if (!activityName) return { valid: false, field: "activityName", message: "Activity name is required." };
            if (!activityDescription) return { valid: false, field: "activityDescription", message: "Activity description is required." };
            if (!selectedActivityType) return { valid: false, field: "activityType", message: "Please select an activity type." };
            if (!Object.values(selectedSDGs).some((v) => v)) {
                return { valid: false, field: "sdgGoals", message: "Please select at least one SDG goal." };
            }
            if (!chargingFees1) return { valid: false, field: "chargingFees", message: "Please answer if you're charging fees." };
            if (!partnering) return { valid: false, field: "partnering", message: "Please indicate if you're partnering with a university unit." };
            }
        
            if (section === "date-info") {
                if (!recurring) return { valid: false, field: "recurring", message: "Please select if the activity is recurring." };
                if (!startDate) return { valid: false, field: "startDate", message: "Start date is required." };
                if (!startTime) return { valid: false, field: "startTime", message: "Start time is required." };
                if (!endTime) return { valid: false, field: "endTime", message: "End time is required." };
                
                    if (recurring === "recurring") {
                    if (!endDate) return { valid: false, field: "endDate", message: "End date is required for recurring activities." };
                
                    const selectedDays = Object.values(state.recurringDays || {}).filter(Boolean);
                    if (selectedDays.length === 0) {
                        return {
                        valid: false,
                        field: "recurringDays",
                        message: "Please select at least one recurring day per week."
                        };
                    }
                    }
                }
        
            if (section === "specifications") {
            if (!isOffCampus) return { valid: false, field: "offcampus", message: "Please specify if the activity is off-campus." };
            if (!venue) return { valid: false, field: "venue", message: "Venue is required." };
            if (!venueApprover) return { valid: false, field: "venueApprover", message: "Venue approver name is required." };
            if (
                isOffCampus !== "yes" &&
                !isValidEmailOrMobile(venueApproverContact)
                ) {
                    return {
                    valid: false,
                    field: "venueApproverContact",
                    message: "Venue approver contact must be valid.",
                    };
                }
        
            if (partnering === "yes") {
                const selectedPartners = Object.values(selectedPublicAffairs).filter(Boolean);
                if (selectedPartners.length === 0) {
                return { valid: false, field: "partnering", message: "Please select at least one university partner." };
                }
                if (!partnerDescription) {
                return { valid: false, field: "partnering", message: "Please describe the partner’s role in the activity." };
                }
            }
        
            if (!greenCampusMonitor) return { valid: false, field: "greenCampusMonitor", message: "Green campus monitor name is required." };
            if (!isValidEmailOrMobile(greenCampusMonitorContact)) {
                return { valid: false, field: "greenCampusMonitorContact", message: "Green monitor contact must be a valid email or mobile number." };
            }
            }
        
            if (section === "submission") {
                if (!appealReason || appealReason.trim() === "") {
                    return { valid: false, field: "appealReason", message: "Appeal reason is required." };
                    }
                
                    // if (!selectedFile || selectedFile.type !== "application/pdf") {
                    // return { valid: false, field: "activityRequestFileUpload", message: "Please upload a valid PDF file." };
                    // }
            }
        
            return { valid: true };
        };      
        

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
        { id: "others", label: "Others (please specify, e.g., interview process, final rites)" }
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

    const handleSDGChange = (id) => {
    setSelectedSDGs(prev => {
        const updated = {
        ...prev,
        [id]: !prev[id]
        };
        if (Object.values(updated).some((v) => v)) {
        setFieldError("sdgGoals", false);
        }
        return updated;
    });
    };

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

        // Handles file upload validation
        const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file && file.type !== 'application/pdf') {
            alert("Only PDF files are allowed.");
            return;
        }
        setSelectedFile(file);
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
        
            // Prevent submission if you're not in the submission step
            if (currentSection !== "submission") return;

            // Prevent submission without a file
            // if (!selectedFile) {
            //     toast.dismiss();
            //     toast.error("Please upload a PDF file before submitting.");
            //     return;
            // }

            // Only allow PDF files
            // if (selectedFile.type !== "application/pdf") {
            //     toast.dismiss();
            //     toast.error("Only PDF files are allowed.");
            //     return;
            // }

            if (isSubmitting) return;
            setIsSubmitting(true);

            // Send data to database and file to cloud
            try {
                const {
                data: { user },
                error: userError
              } = await supabase.auth.getUser(); // supabase
        
                if (userError || !user) {
                toast.dismiss();
                toast.error("You're not logged in.");
                return;
                }
        
                const { data: accountData, error: accountError } = await supabase
                .from("account")
                .select("account_id")
                .eq("email", user.email)
                .single();
        
                if (accountError || !accountData) {
                toast.dismiss();
                toast.error("No matching account found.");
                return;             
                }
        
                const account_id = accountData.account_id;
        
                const activityData = {
                activity_id: activity.activity_id,
                org_id: parseInt(selectedValue),
                student_position: studentPosition,
                student_contact: studentContact,
                activity_name: activityName,
                activity_description: activityDescription,
                activity_type: selectedActivityType,
                sdg_goals: Object.keys(selectedSDGs).filter(key => selectedSDGs[key]).join(","),
                charge_fee: chargingFees1 === "yes",
                university_partner: partnering === "yes",
                partner_name: Object.entries(selectedPublicAffairs)
                .filter(([_, v]) => v && v !== false)
                .flatMap(([k, v]) => (Array.isArray(v) ? v : [k]))
                .join(", "),              
                partner_role: partnerDescription,
                venue,
                venue_approver: venueApprover,
                venue_approver_contact: venueApproverContact,
                is_off_campus: isOffCampus === "yes",
                green_monitor_name: greenCampusMonitor,
                green_monitor_contact: greenCampusMonitorContact,
                appeal_reason: appealReason,
                };

                const scheduleData = {
                    is_recurring: recurring,
                    start_date: startDate,
                    end_date: endDate || null,
                    start_time: startTime,
                    end_time: endTime,
                    recurring_days: recurring === "recurring" ? Object.keys(recurringDays).filter(day => recurringDays[day]).join(",") : null,
                    };
        
                    await editActivity(activityData, scheduleData);
                    toast.success("Submission updated! Your appeal is now pending.");
                    setShowSuccessDialog(true);
            
                setTimeout(() => {
                navigate("/dashboard");
                }, 5000);
            } catch (error) {
                console.error("Submission error:", error);
                toast.dismiss();  
                toast.error(error.message || "Something went wrong.");
            } finally {
                setIsSubmitting(false);
            }
            };

            const handleNextSection = (nextSection) => {
                const result = validateCurrentSection(currentSection, {
                    selectedValue,
                    studentPosition,
                    studentContact,
                    activityName,
                    activityDescription,
                    selectedActivityType,
                    startDate,
                    startTime,
                    endTime,
                    endDate,
                    recurring,
                    venue,
                    venueApprover,
                    venueApproverContact,
                    greenCampusMonitor,
                    greenCampusMonitorContact,
                    selectedFile,
                    chargingFees1,
                    selectedSDGs,
                    partnering,
                    selectedPublicAffairs,
                    partnerDescription,
                    isOffCampus,
                    recurringDays
                });
            
                if (!result.valid) {
                    toast.dismiss();
                    toast.error(
                    result.field === "studentPosition"
                        ? (studentPosition.trim().length < 3
                            ? "Student Position is too short!"
                            : "Student Position must be between 3 and 50 characters.")
                    : result.field === "venueApprover"
                        ? (venueApprover.trim().length < 3
                            ? "Venue Approver is too short!"
                            : "Venue Approver must be between 3 and 50 characters.")
                    : result.field === "greenCampusMonitor"
                        ? (greenCampusMonitor.trim().length < 3
                            ? "Green Campus Monitor is too short!"
                            : "Green Campus Monitor must be between 3 and 50 characters.")
                    : result.field === "activityName"
                        ? (activityName.trim().length < 3
                            ? "Activity Name is too short!"
                            : "Activity Name must not exceed 100 characters.")
                    : result.field === "activityDescription"
                        ? (activityDescription.trim().length < 20
                            ? "Activity Description must be at least 20 characters."
                            : "")
                    : result.field === "partnerDescription"
                        ? (partnerDescription.trim().length < 3
                            ? "Partner Role Description must be at least 3 characters."
                            : "")
                    : result.field === "studentContact"
                        ? "Student Contact must contain only numbers."
                    : result.field === "venue"
                        ? "Venue must not exceed 100 characters."
                    : result.field === "greenCampusMonitorContact"
                        ? "Green Campus Monitor contact must be a valid number or UP/Gmail address."
                    : result.field === "venueApproverContact"
                        ? "Venue Approver contact must be a valid number or UP/Gmail address."
                    : result.field === "activityType"
                        ? "Activity Type is required."
                    : result.field === "chargingFees"
                        ? "Please indicate if you're charging fees."
                    : result.field === "partnering"
                        ? "Please indicate if you're partnering with a unit."
                    : result.field === "partnerUnits"
                        ? "Please select at least one university partner."
                    : result.field === "orgSelect"
                        ? "Organization is required."
                    : result.field === "startDate"
                        ? "Start date is required."
                    : result.field === "endDate"
                        ? (endDate.trim() === ""
                            ? "End date is required for recurring activities."
                            : "End date cannot be before start date.")
                    : result.field === "startTime"
                        ? "Start time is required."
                    : result.field === "endTime"
                        ? "End time is required."
                    : result.field === "recurring"
                        ? "Please select if activity is recurring."
                    : result.field === "recurringDays"
                        ? "Please select at least one recurring day."
                    : result.field === "offcampus"
                        ? "Please indicate if the activity is off-campus."
                    : result.field === "sdgGoals"
                        ? "Please select at least one SDG goal."
                    : result.field === "appealReason"
                        ? "Appeal reason is required."
                    : "Please fill out this field correctly."
                    );
                    setFieldError(result.field, true);
            
                    const el = document.getElementById(result.field);
                    if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                        if (typeof el.focus === "function" && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) {
                            el.focus();
                        }
                    }
                    return;
                }
            
                setCurrentSection(nextSection);
            };
            
            const handleBackSection = (previousSection) => {
                setCurrentSection(previousSection);
            };            
            
            const handleMenuNavigation = (targetSection) => {
                const sections = ["general-info", "date-info", "specifications", "submission"];
                const currentIndex = sections.indexOf(currentSection);
                const targetIndex = sections.indexOf(targetSection);
            
                // Going backward is always allowed
                if (targetIndex < currentIndex) {
                setCurrentSection(targetSection);
                return;
                }
            
                // Validate all sections from current up to target - 1
                for (let i = currentIndex; i < targetIndex; i++) {
                const section = sections[i];
                const result = validateCurrentSection(section, {
                    selectedValue,
                    studentPosition,
                    studentContact,
                    activityName,
                    activityDescription,
                    selectedActivityType,
                    startDate,
                    startTime,
                    endTime,
                    endDate,
                    recurring,
                    venue,
                    venueApprover,
                    venueApproverContact,
                    greenCampusMonitor,
                    greenCampusMonitorContact,
                    selectedFile,
                    chargingFees1,
                    selectedSDGs,
                    partnering,
                    selectedPublicAffairs,
                    partnerDescription,
                    isOffCampus,
                    recurringDays
                });
            
                if (!result.valid) {
                    toast.dismiss();
                    toast.error(
                        result.field === "studentPosition"
                            ? (studentPosition.trim().length < 3
                                ? "Student Position is too short!"
                                : "Student Position must be between 3 and 50 characters.")
                        : result.field === "venueApprover"
                            ? (venueApprover.trim().length < 3
                                ? "Venue Approver is too short!"
                                : "Venue Approver must be between 3 and 50 characters.")
                        : result.field === "greenCampusMonitor"
                            ? (greenCampusMonitor.trim().length < 3
                                ? "Green Campus Monitor is too short!"
                                : "Green Campus Monitor must be between 3 and 50 characters.")
                        : result.field === "activityName"
                            ? (activityName.trim().length < 3
                                ? "Activity Name is too short!"
                                : "Activity Name must not exceed 100 characters.")
                        : result.field === "activityDescription"
                            ? (activityDescription.trim().length < 20
                                ? "Activity Description must be at least 20 characters."
                                : "")
                        : result.field === "partnerDescription"
                            ? (partnerDescription.trim().length < 3
                                ? "Partner Role Description must be at least 3 characters."
                                : "")
                        : result.field === "studentContact"
                            ? "Student Contact must contain only numbers."
                        : result.field === "venue"
                            ? "Venue must not exceed 100 characters."
                        : result.field === "greenCampusMonitorContact"
                            ? "Green Campus Monitor contact must be a valid number or UP/Gmail address."
                        : result.field === "venueApproverContact"
                            ? "Venue Approver contact must be a valid number or UP/Gmail address."
                        : result.field === "activityType"
                            ? "Activity Type is required."
                        : result.field === "chargingFees"
                            ? "Please indicate if you're charging fees."
                        : result.field === "partnering"
                            ? "Please indicate if you're partnering with a unit."
                        : result.field === "partnerUnits"
                            ? "Please select at least one university partner."
                        : result.field === "orgSelect"
                            ? "Organization is required."
                        : result.field === "startDate"
                            ? "Start date is required."
                        : result.field === "endDate"
                            ? (endDate.trim() === ""
                                ? "End date is required for recurring activities."
                                : "End date cannot be before start date.")
                        : result.field === "startTime"
                            ? "Start time is required."
                        : result.field === "endTime"
                            ? "End time is required."
                        : result.field === "recurring"
                            ? "Please select if activity is recurring."
                        : result.field === "recurringDays"
                            ? "Please select at least one recurring day."
                        : result.field === "offcampus"
                            ? "Please indicate if the activity is off-campus."
                        : result.field === "sdgGoals"
                            ? "Please select at least one SDG goal."
                        : result.field === "appealReason"
                            ? "Appeal reason is required."
                        : "Please fill out this field correctly."
                        );
                        setFieldError(result.field, true);
            
                    const el = document.getElementById(result.field);
                    if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    if (typeof el.focus === "function" && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) {
                        el.focus();
                    }
                    }
                    return; // Stop at the first invalid section
                }
                }
            
                // All validations passed, allow jump
                setCurrentSection(targetSection);
            };              

    const [orgOptions, setOrgOptions] = useState([]);
    
    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
            const response = await fetch("/api/organization/list");
            const data = await response.json();
            setOrgOptions(data);
            } catch (err) {
            console.error("Failed to load organizations:", err);
            } 
        };
        
        fetchOrganizations();
        }, []);
        const [selectedOrgName, setSelectedOrgName] = useState("");

        useEffect(() => {
            if (!activity) return;
            console.log("Incoming Activity:", activity);
        
            setSelectedValue(activity.org_id?.toString());
            setSelectedOrgName(activity.organization?.org_name || "");
            setOrganizationAdviser(activity.organization?.adviser_name || "");
            setOrganizationAdviserContact(activity.organization?.adviser_email || "");
        
            setStudentPosition(activity.student_position || "");
            setStudentContact(activity.student_contact || "");
            setActivityName(activity.activity_name || "");
            setActivityDescription(activity.activity_description || "");
            setSelectedActivityType(activity.activity_type ?? "");
            setOtherActivityType(activity.other_activity_type || "");
            setChargingFees1(activity.charge_fee ? "yes" : "no");
            setPartnering(activity.university_partner ? "yes" : "no");
            setPartnerDescription(activity.partner_role || "");
            setIsOffCampus(activity.is_off_campus ? "yes" : "no");
            setVenue(activity.venue || "");
            setVenueApprover(activity.venue_approver || "");
            setVenueApproverContact(activity.venue_approver_contact || "");
            setGreenCampusMonitor(activity.green_monitor_name || "");
            setGreenCampusMonitorContact(activity.green_monitor_contact || "");
            setAppealReason(prev => prev || activity.appeal_reason || "");
        
            setSelectedSDGs(
            Object.fromEntries((activity.sdg_goals || "").split(",").map((id) => [id, true]))
            );
        
            // Schedule
            const sched = activity.schedule?.[0];
            if (sched) {
            setRecurring(sched.is_recurring || "one-time");
            setStartDate(sched.start_date || "");
            setEndDate(sched.end_date || "");
            setStartTime(sched.start_time || "");
            setEndTime(sched.end_time || "");
            setRecurringDays(
                Object.fromEntries(
                (sched.recurring_days || "")
                    .split(",")
                    .filter(Boolean)
                    .map((day) => [day, true])
                )
            );
            }
        
            // Public Affairs partners
            if (activity.partner_name) {
            const partnerArray = activity.partner_name.split(",").map(p => p.trim());
            const publicAffairs = {};
            partnerArray.forEach(p => {
                if (p === "Others") {
                publicAffairs["Others"] = [""]; // basic default
                } else {
                publicAffairs[p] = true;
                }
            });
            setSelectedPublicAffairs(publicAffairs);
            }
        }, [activity]);
        
    return (
        <div className="min-h-screen flex flex-col items-start justify-start py-8">
            <div className="w-full max-w-2xl mx-auto px-6">
                <h1 className="text-2xl font-bold mb-6 text-left">Edit Submission</h1>
                <form onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} className="space-y-8">
                    
                    {/* Sonner, side pop up */}
                    <Toaster/>

                    {/* Menu Bar */}
                    <div className="flex items-center space-x-4 mb-4">
                        <Button
                            type="button"
                            variant={currentSection === "general-info" ? "default" : "ghost"}
                            className={`${currentSection === "general-info" ? "bg-[#014421] text-white" : "text-[#014421] hover:text-[#014421] hover:bg-[#014421]/10"}`}
                            onClick={() => handleMenuNavigation("general-info")}
                        >
                            General Information
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <Button
                            type="button"
                            variant={currentSection === "date-info" ? "default" : "ghost"}
                            className={`${currentSection === "date-info" ? "bg-[#014421] text-white" : "text-[#014421] hover:text-[#014421] hover:bg-[#014421]/10"}`}
                            onClick={() => handleMenuNavigation("date-info")}
                        >
                            Date Information
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <Button
                            type="button"
                            variant={currentSection === "specifications" ? "default" : "ghost"}
                            className={`${currentSection === "specifications" ? "bg-[#014421] text-white" : "text-[#014421] hover:text-[#014421] hover:bg-[#014421]/10"}`}
                            onClick={() => handleMenuNavigation("specifications")}
                        >
                            Specifications
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <Button
                            type="button"
                            variant={currentSection === "submission" ? "default" : "ghost"}
                            className={`${currentSection === "submission" ? "bg-[#014421] text-white" : "text-[#014421] hover:text-[#014421] hover:bg-[#014421]/10"}`}
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

                    {/* Form Sections */}
                    <div className="min-h-[500px]">
                        {/* General Information Section */}
                        {currentSection === "general-info" && (
                            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    {/* Organization Name */}
                                    <div>
                                        <h3 className="text-sm font-medium mb-2">
                                            Organization Name <span className="text-red-500">*</span>
                                        </h3>
                                        <Input
                                            type="text"
                                            value={selectedOrgName}
                                            disabled
                                            className="bg-gray-100 cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Student Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Student Position <span className="text-red-500">*</span></h3>
                                            <Input
                                            id="studentPosition"
                                            onBlur={(e) => {
                                                const value = e.target.value.trim();
                                                setFieldError("studentPosition", value.length < 3 || value.length > 50);
                                            }}
                                            className={fieldErrors.studentPosition ? "border-red-300 bg-red-50" : ""}
                                            placeholder="(Chairperson, Secretary, etc.)"
                                            value={studentPosition}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setStudentPosition(value);
                                                if (value.trim().length >= 3 && value.length <= 50) {
                                                setFieldError("studentPosition", false);
                                                }
                                            }}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Student Contact Number <span className="text-red-500">*</span></h3>
                                            <Input
                                            id="studentContact"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            placeholder="(09XXXXXXXXX)"
                                            onBlur={() => setFieldError("studentContact", !/^\d+$/.test(studentContact))}
                                            value={studentContact}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, "");
                                                setStudentContact(value);
                                                if (/^\d+$/.test(value)) setFieldError("studentContact", false);
                                            }}
                                            className={fieldErrors.studentContact ? "border-red-300 bg-red-50" : ""}
                                            />
                                        </div>
                                    </div>

                                    {/* Activity Information */}
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Activity Name <span className="text-red-500">*</span></h3>
                                            <Input
                                            id="activityName"
                                            onBlur={() =>
                                                setFieldError("activityName", activityName.trim().length < 3 || activityName.length > 100)
                                            }
                                            className={fieldErrors.activityName ? "border-red-300 bg-red-50" : ""}
                                            placeholder="(Mass Orientation, Welcome Party, etc.)"
                                            value={activityName}
                                            onChange={(e) => {
                                                setActivityName(e.target.value);
                                                if (e.target.value.trim().length >= 3 && e.target.value.length <= 100) {
                                                setFieldError("activityName", false);
                                                }
                                            }}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Activity Description <span className="text-red-500">*</span></h3>
                                            <Textarea
                                            id="activityDescription"
                                            onBlur={() =>
                                                setFieldError("activityDescription", activityDescription.trim().length < 20)
                                            }
                                            className={`${fieldErrors.activityDescription ? "border-red-300 bg-red-50" : ""} min-h-[100px]`}
                                            placeholder="Enter activity description"
                                            value={activityDescription}
                                            onChange={(e) => {
                                                setActivityDescription(e.target.value);
                                                if (e.target.value.trim().length >= 20) {
                                                setFieldError("activityDescription", false);
                                                }
                                            }}
                                            />
                                        </div>
                                    </div>

                                    {/* Activity Type */}
                                    <div>
                                    <h3 className="text-sm font-medium mb-2">Activity Type <span className="text-red-500">*</span></h3>
                                    <Select
                                        key={selectedActivityType}
                                        value={selectedActivityType}
                                        onValueChange={setSelectedActivityType}
                                    >
                                        <SelectTrigger
                                        id="activityType"
                                        onBlur={() => setFieldError("activityType", selectedActivityType.trim() === "")}
                                        className={fieldErrors.activityType ? "border-red-300 bg-red-50 w-full" : "w-full"}
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
                                    </div>
                                    {/* Sustainable Development Goals */}
                                    <div>
                                    <h3 className="text-sm font-medium mb-2">Sustainable Development Goals <span className="text-red-500">*</span></h3>
                                    <div className="mb-4 border border-gray-200 rounded-md">
                                        <details id="sdgGoals" className={fieldErrors.sdgGoals ? "border-red-300 bg-red-50" : ""} open>
                                        <summary className="cursor-pointer px-4 py-2 bg-gray-100 font-medium capitalize">
                                            SDG List
                                        </summary>
                                        <div className="px-4 py-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {sdgOptions.map((option) => (
                                            <div key={option.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                id={option.id}
                                                checked={selectedSDGs[option.id] || false}
                                                onCheckedChange={() => handleSDGChange(option.id)}
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
                                        onBlur={() => setFieldError("chargingFees", chargingFees1.trim() === "")}
                                        value={chargingFees1}
                                        onValueChange={setChargingFees1}
                                        className={`${fieldErrors.chargingFees ? "border-red-300 bg-red-50" : ""} space-y-3`}
                                        >
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
                                        onBlur={() => setFieldError("partnering", partnering.trim() === "")}
                                        value={partnering}
                                        onValueChange={(val) => {
                                            setPartnering(val);
                                            if (val.trim() !== "") setFieldError("partnering", false);
                                        }}
                                        className={`${fieldErrors.partnering ? "border-red-300 bg-red-50" : ""} space-y-3`}
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
                                    </div>
                                </div>
                                <div className="flex justify-end">  
                                    <Button
                                        type="button"
                                        className="bg-[#014421] text-white hover:bg-[#003218] px-6"
                                        onClick={() => handleNextSection("date-info")}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Date Information Section */}
                        {currentSection === "date-info" && (
                            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    {/* Recurring */}
                                    <div>
                                        <h3 className="text-sm font-medium mb-2">Recurring? <span className="text-red-500">*</span></h3>
                                        <RadioGroup
                                        id="recurring"
                                        onBlur={() => setFieldError("recurring", recurring.trim() === "")}
                                        value={recurring}
                                        onValueChange={(val) => {
                                            setRecurring(val);
                                            if (val.trim() !== "") setFieldError("recurring", false);
                                        }}
                                        className={`${fieldErrors.recurring ? "border-red-300 bg-red-50" : ""} space-y-3`}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="one-time" id="one-time" />
                                                <label htmlFor="one-time" className="text-sm font-medium leading-none">
                                                    One-time
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="recurring" id="recurring" />
                                                <label htmlFor="recurring" className="text-sm font-medium leading-none">
                                                    Recurring
                                                </label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    {/* Date and Time Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Activity Start Date <span className="text-red-500">*</span></h3>
                                            <Input
                                            id="startDate"
                                            onBlur={() => setFieldError("startDate", !startDate)}
                                            className={fieldErrors.startDate ? "border-red-300 bg-red-50" : ""}
                                            type="date"
                                            min={new Date().toISOString().split("T")[0]}
                                            value={startDate}
                                            onChange={(e) => {
                                                setStartDate(e.target.value);
                                                if (e.target.value) {
                                                setFieldError("startDate", false);
                                                }
                                            }}
                                            />
                                        </div>
                                        {recurring === "recurring" && (
                                            <div>
                                                <h3 className="text-sm font-medium mb-2">Activity End Date <span className="text-red-500">*</span></h3>
                                                <Input
                                                id="endDate"
                                                onBlur={() => {
                                                    const start = new Date(startDate);
                                                    const end = new Date(endDate);
                                                    const invalid =
                                                    !endDate || (recurring === "recurring" && startDate && end < start);

                                                    setFieldError("endDate", invalid);
                                                }}
                                                className={fieldErrors.endDate ? "border-red-300 bg-red-50" : ""}
                                                type="date"
                                                min={new Date().toISOString().split("T")[0]}
                                                value={endDate}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setEndDate(value);

                                                    const start = new Date(startDate);
                                                    const end = new Date(value);
                                                    const valid = value && (recurring !== "recurring" || (startDate && end >= start));

                                                    if (valid) setFieldError("endDate", false);
                                                }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Activity Start Time <span className="text-red-500">*</span> </h3>
                                            
                                            <Input
                                                id="startTime"
                                                type="time"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                            NOTE: Official curfew in the campus is at 9:00PM.
                                            </p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Activity End Time <span className="text-red-500">*</span></h3>
                                            <Input
                                                id="endTime"
                                                type="time"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Recurring Days */}
                                    {recurring === "recurring" && (
                                        <div id="recurringDays">
                                            <h3 className="text-sm font-medium mb-2">Recurring Day/s Per Week <span className="text-red-500">*</span></h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {Object.keys(recurringDays).map((day) => (
                                                    <div key={day} className="flex items-center space-x-2">
                                                    <Checkbox
                                                    id={`day-${day}`}
                                                    checked={recurringDays[day]}
                                                    onCheckedChange={(checked) => {
                                                        const updated = {
                                                        ...recurringDays,
                                                        [day]: checked
                                                        };
                                                        setRecurringDays(updated);

                                                        const selected = Object.values(updated).filter(Boolean);
                                                        if (selected.length > 0) setFieldError("recurringDays", false);
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
                                <div className="flex justify-between">
                                    <Button
                                        type="button"
                                        className="bg-gray-300 text-gray-600 hover:bg-gray-400 px-6"
                                        onClick={() => handleBackSection("general-info")}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="button"
                                        className="bg-[#014421] text-white hover:bg-[#003218] px-6"
                                        onClick={() => handleNextSection("specifications")}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Specifications Section */}
                        {currentSection === "specifications" && (
                            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    {/* Off-Campus */}
                                    <div>
                                        <h3 className="text-sm font-medium mb-2">Off-Campus? <span className="text-red-500">*</span></h3>
                                        <RadioGroup
                                        id="offcampus"
                                        value={isOffCampus}
                                        onValueChange={(val) => {
                                            setIsOffCampus(val);
                                            if (val.trim() !== "") setFieldError("offcampus", false);
                                        }}
                                        className={`${fieldErrors.offcampus ? "border-red-300 bg-red-50" : ""} space-y-3`}
                                        >
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
                                            id="venue"
                                            onBlur={() => setFieldError("venue", venue.trim() === "" || venue.length > 100)}
                                            className={fieldErrors.venue ? "border-red-300 bg-red-50" : ""}
                                            type="text"
                                            placeholder="(Teatro Amianan, CS AVR, etc.)"
                                            value={venue}
                                            onChange={(e) => {
                                                setVenue(e.target.value);
                                                if (e.target.value.trim() !== "" && e.target.value.length <= 100) {
                                                setFieldError("venue", false);
                                                }
                                            }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="text-sm font-medium mb-2">Venue Approver <span className="text-red-500">*</span></h3>
                                                <Input
                                                id="venueApprover"
                                                onBlur={() =>
                                                    setFieldError("venueApprover", venueApprover.trim().length < 3 || venueApprover.length > 50)
                                                }
                                                className={`${fieldErrors.venueApprover ? "border-red-300 bg-red-50" : ""} ${isOffCampus === "yes" ? "bg-gray-100 cursor-not-allowed" : ""}`}
                                                type="text"
                                                placeholder="Provide their name"
                                                value={isOffCampus === "yes" ? "N/A" : venueApprover}
                                                disabled={isOffCampus === "yes"}
                                                onChange={(e) => {
                                                    setVenueApprover(e.target.value);
                                                    if (e.target.value.trim().length >= 3 && e.target.value.length <= 50) {
                                                    setFieldError("venueApprover", false);
                                                    }
                                                }}
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium mb-2">Venue Approver Contact Info <span className="text-red-500">*</span></h3>
                                                <Input
                                                id="venueApproverContact"
                                                onBlur={() =>
                                                    setFieldError(
                                                    "venueApproverContact",
                                                    !/^09\d{9}$|^[a-zA-Z0-9._%+-]{3,}@(up\.edu\.ph|gmail\.com)$/.test(venueApproverContact)
                                                    )
                                                }
                                                className={`${fieldErrors.venueApproverContact ? "border-red-300 bg-red-50" : ""} ${isOffCampus === "yes" ? "bg-gray-100 cursor-not-allowed" : ""}`}
                                                type="text"
                                                placeholder="09XXXXXXXXX or XXX@up.edu.ph"
                                                value={isOffCampus === "yes" ? "N/A" : venueApproverContact}
                                                disabled={isOffCampus === "yes"}
                                                onChange={(e) => {
                                                    setVenueApproverContact(e.target.value);
                                                    if (
                                                    /^09\d{9}$|^[^@]+@(up\.edu\.ph|gmail\.com)$/.test(e.target.value)
                                                    ) {
                                                    setFieldError("venueApproverContact", false);
                                                    }
                                                }}
                                                />
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
                                                value={organizationAdviser}
                                                disabled
                                                className="cursor-not-allowed bg-gray-100"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium mb-2">Organization Adviser Contact Info <span className="text-red-500">*</span></h3>
                                                <Input
                                                type="text"
                                                value={organizationAdviserContact}
                                                disabled
                                                className="cursor-not-allowed bg-gray-100"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* University Partner Section (Only if partnering === "yes") */}
                                    {partnering === "yes" && (
                                        <div className="space-y-6">
                                            <h3 className="text-sm font-medium mb-2">Partners <span className="text-red-500">*</span></h3>

                                            {Object.entries(universityPartners).map(([category, units]) => (
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
                                                                    checked={!!selectedPublicAffairs[unit]}
                                                                    onCheckedChange={(checked) => {
                                                                        setSelectedPublicAffairs((prev) => ({
                                                                            ...prev,
                                                                            [unit]: checked ? (unit === "Others" ? [""] : true) : false
                                                                            }));
                                                                        }}
                                                                />
                                                                <label htmlFor={`${category}-${unit}`} className="text-sm">
                                                                    {unit}
                                                                </label>
                                                                </div>
                                                                {unit === "Others" && Array.isArray(selectedPublicAffairs["Others"]) && (
                                                                    <div className="ml-6 mt-1 space-y-2">
                                                                        {selectedPublicAffairs["Others"].map((value, index) => (
                                                                        <div key={index} className="flex items-center gap-2">
                                                                            <Input
                                                                            type="text"
                                                                            placeholder={`Custom Partner #${index + 1}`}
                                                                            value={value}
                                                                            onChange={(e) => {
                                                                                const updated = [...selectedPublicAffairs["Others"]];
                                                                                updated[index] = e.target.value;
                                                                                setSelectedPublicAffairs((prev) => ({
                                                                                ...prev,
                                                                                Others: updated,
                                                                                }));
                                                                            }}
                                                                            />
                                                                            <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            className="text-[#7B1113]"
                                                                            onClick={() => {
                                                                                const updated = [...selectedPublicAffairs["Others"]];
                                                                                updated.splice(index, 1);
                                                                                setSelectedPublicAffairs((prev) => ({
                                                                                ...prev,
                                                                                Others: updated,
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
                                                                            setSelectedPublicAffairs((prev) => ({
                                                                            ...prev,
                                                                            Others: [...prev["Others"], ""],
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
                                                <h3 className="text-sm font-medium mb-2">Description of Partner’s Role in the Activity <span className="text-red-500">*</span></h3>
                                                <Input
                                                id="partnerDescription"
                                                type="text"
                                                placeholder="Provide their role"
                                                value={partnerDescription}
                                                onBlur={() =>
                                                    setFieldError("partnerDescription", partnerDescription.trim().length < 3)
                                                }
                                                onChange={(e) => {
                                                    setPartnerDescription(e.target.value);
                                                    if (e.target.value.trim().length >= 3) {
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
                                                id="greenCampusMonitor"
                                                onBlur={() =>
                                                    setFieldError("greenCampusMonitor", greenCampusMonitor.trim().length < 3 || greenCampusMonitor.length > 50)
                                                }
                                                className={fieldErrors.greenCampusMonitor ? "border-red-300 bg-red-50" : ""}
                                                type="text"
                                                placeholder="Provide their name"
                                                value={greenCampusMonitor}
                                                onChange={(e) => {
                                                    setGreenCampusMonitor(e.target.value);
                                                    if (e.target.value.trim().length >= 3 && e.target.value.length <= 50) {
                                                    setFieldError("greenCampusMonitor", false);
                                                    }
                                                }}
                                                />

                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium mb-2">Green Campus Monitor Contact Info <span className="text-red-500">*</span></h3>
                                                <Input
                                                id="greenCampusMonitorContact"
                                                onBlur={() =>
                                                    setFieldError(
                                                    "greenCampusMonitorContact",
                                                    !/^09\d{9}$|^[a-zA-Z0-9._%+-]{3,}@(up\.edu\.ph|gmail\.com)$/.test(greenCampusMonitorContact)
                                                    )
                                                }
                                                className={fieldErrors.greenCampusMonitorContact ? "border-red-300 bg-red-50" : ""}
                                                type="text"
                                                placeholder="09XXXXXXXXX or XXX@up.edu.ph"
                                                value={greenCampusMonitorContact}
                                                onChange={(e) => {
                                                    setGreenCampusMonitorContact(e.target.value);
                                                    if (
                                                    /^09\d{9}$|^[^@]+@(up\.edu\.ph|gmail\.com)$/.test(e.target.value)
                                                    ) {
                                                    setFieldError("greenCampusMonitorContact", false);
                                                    }
                                                }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <Button
                                        type="button"
                                        className="bg-gray-300 text-gray-600 hover:bg-gray-400 px-6"
                                        onClick={() => handleBackSection("date-info")}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="button"
                                        className="bg-[#014421] text-white hover:bg-[#003218] px-6"
                                        onClick={() => handleNextSection("submission")}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Submission Section */}
                        {currentSection === "submission" && (
                            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                                <div>
                                <div className="mb-4">
                                    <h3 className="text-sm font-medium mb-2">Appeal Reason <span className="text-red-500">*</span></h3>
                                    <Textarea
                                        id="appealReason"
                                        placeholder="Write the reason why you are editing your submission..."
                                        value={appealReason}
                                        onChange={(e) => setAppealReason(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                </div>
                                    <h3 className="text-sm font-medium mb-2">Scanned Copy of Activity Request Form (PDF) <span className="text-red-500">*</span></h3>
                                    <div className="border rounded-md p-4">
                                        <p className="text-sm text-gray-600 mb-3">
                                            Provide a scanned copy of your activity request form with your point person's, venue approver's, and adviser's signature.
                                        </p>
                                        <p className="text-sm text-gray-600 font-bold mb-3">
                                            NOTE: INCLUDE OTHER SCANNED FORMS IN THE PDF IF RELEVANT
                                            <br />
                                            (Notice of Off-Campus Activity, Job Request Forms, etc.)
                                        </p>
                                        <p className="text-sm text-gray-600 font-bold mb-3">
                                            [LAST NAME OF REQUESTING STUDENT]_[ORG]_Activity Request Form_(mm-dd-yyyy)
                                            <br />
                                            i.e. LARUA-TinigAmianan_Activity-Request-Form_01-01-2024
                                        </p>
                                        
                                        <div className="mt-4">
                                        <div className="mb-4 p-4 bg-muted/40 border rounded-md text-sm">
                                            <h4 className="font-medium text-base mb-2 text-[#7B1113]">What to include in your single PDF file:</h4>
                                            <ul className="list-disc list-inside space-y-1">
                                                {getRequiredDocuments().map((item, index) => (
                                                <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="border-2 border-dashed border-gray-300 p-4 rounded-md text-center hover:border-gray-400 hover:bg-muted transition-colors">
                                            <label
                                            htmlFor="activityRequestFileUpload"
                                            className="cursor-pointer flex flex-col items-center"
                                            >
                                            <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                                            <p className="text-sm">Drag and Drop or Click to Upload File</p>
                                            <p className="text-xs text-gray-500 italic mt-2">
                                            * File upload not required for now. You may submit the form without attaching a PDF.
                                            </p>
                                            <input
                                                id="activityRequestFileUpload"
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                disabled
                                                // disabled={isSubmitting}
                                            />
                                            </label>
                                        </div>

                                            {selectedFile && (
                                                <div>
                                                <h4 className="text-sm font-medium mb-1">Selected File</h4>
                                                    <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground border px-3 py-2 rounded-md">
                                                    <div className="flex items-center gap-2 truncate">
                                                        <FileText className="w-4 h-4 text-red-500 shrink-0" />
                                                        <span className="truncate max-w-[240px]">{selectedFile.name}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedFile(null)}
                                                        className="text-muted-foreground hover:text-red-600"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                    </div>
                                            </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                <Button
                                    type="button"
                                    className="bg-gray-300 text-gray-600 hover:bg-gray-400 px-5"
                                    onClick={() => handleBackSection("specifications")}
                                    >
                                    Back
                                    </Button>

                                    <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowConfirmDialog(true);
                                    }}
                                    type="submit"
                                    className="w-relative"
                                    disabled={isSubmitting}
                                    >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                        <Loader2 className="animate-spin h-4 w-4" />
                                        Uploading...
                                        </span>
                                    ) : (
                                        "Submit Form"
                                    )}
                                    </Button>
                                </div>
                            </div>
                        )}  
                        {/* Confirmation Dialog */}
                        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Appeal</AlertDialogTitle>
                                <AlertDialogDescription>
                                Are you sure you want to edit this activity request now?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
                                No
                                </AlertDialogCancel>
                                <AlertDialogAction
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="bg-[#014421] text-white hover:bg-[#003218] px-6"
                                >
                                {isSubmitting ? "Submitting..." : "Yes"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {/* Alert Dialog for Submission */}
                        <AlertDialog open={showSuccessDialog}>
                            <AlertDialogContent className="backdrop-blur-md bg-white/90 border-none shadow-lg text-center">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-[#014421] text-2xl font-bold mb-6 text-left">
                                Edited Successfully!
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-sm font-medium mb-2">
                                You will be redirected to the dashboard...
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditActivity;