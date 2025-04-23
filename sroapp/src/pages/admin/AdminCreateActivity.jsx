import { useState, useEffect } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { Progress } from "../../components/ui/progress";
import { createActivity } from '../../api/activityRequestAPI';
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
} from "../../components/ui/alert-dialog";
import { Popover, PopoverTrigger, PopoverContent } from "../../components/ui/popover";
import { FileText, Loader2, UploadCloud, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const AdminCreateActivity = () => {
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
    const [showRemindersDialog, setShowRemindersDialog] = useState(false);

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

    useEffect(() => {
        const seen = sessionStorage.getItem("sroRemindersSeen");
        
        // Only show the modal if it hasn't been seen this session
        if (!seen) {
            setShowRemindersDialog(true);
            sessionStorage.setItem("sroRemindersSeen", "true");
        }
        }, []);
    const navigate = useNavigate();

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
            if (!studentPosition) return { valid: false, field: "studentPosition", message: "Name and Student Position is required." };
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
            if (!selectedFile || selectedFile.type !== "application/pdf") {
                return { valid: false, field: "activityRequestFileUpload", message: "Please upload a valid PDF file." };
            }
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
        setSelectedSDGs(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
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
            if (!selectedFile) {
                toast.dismiss();
                toast.error("Please upload a PDF file before submitting.");
                return;
            }

            // Only allow PDF files
            if (selectedFile.type !== "application/pdf") {
                toast.dismiss();
                toast.error("Only PDF files are allowed.");
                return;
            }

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
                account_id,
                org_id: parseInt(selectedValue), //change this    
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
                };

                const scheduleData = {
                    is_recurring: recurring,
                    start_date: startDate,
                    end_date: endDate || null,
                    start_time: startTime,
                    end_time: endTime,
                    recurring_days: recurring === "recurring" ? Object.keys(recurringDays).filter(day => recurringDays[day]).join(",") : null,
                    };
        
                await createActivity(activityData, selectedFile, scheduleData);
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
                    toast.error(result.message);
            
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
                    toast.error(result.message);
            
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
        const [searchTerm, setSearchTerm] = useState("");
        const [selectedOrgName, setSelectedOrgName] = useState("");
        const [open, setOpen] = useState(false);
    
        const filteredOrgs = orgOptions.filter((org) =>
        org.org_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    return (
        <div className="min-h-screen flex flex-col items-start justify-start py-8">
            <div className="w-full max-w-2xl mx-auto px-6">
                <h1 className="text-2xl font-bold mb-6 text-left">Admin: Create Activity</h1>
                <form onSubmit={handleSubmit} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} className="space-y-8">
                    
                    {/* Sonner, side pop up */}
                    <Toaster/>

                    {/* Menu Bar */}
                    <div className="flex items-center space-x-4 mb-4">
                        <Button
                            variant={currentSection === "general-info" ? "default" : "ghost"}
                            className={`${currentSection === "general-info" ? "bg-[#7B1113] text-white" : "text-[#7B1113] hover:text-[#7B1113] hover:bg-[#7B1113]/10"}`}
                            onClick={() => handleMenuNavigation("general-info")}
                        >
                            General Information
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <Button
                            variant={currentSection === "date-info" ? "default" : "ghost"}
                            className={`${currentSection === "date-info" ? "bg-[#7B1113] text-white" : "text-[#7B1113] hover:text-[#7B1113] hover:bg-[#7B1113]/10"}`}
                            onClick={() => handleMenuNavigation("date-info")}
                        >
                            Date Information
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <Button
                            variant={currentSection === "specifications" ? "default" : "ghost"}
                            className={`${currentSection === "specifications" ? "bg-[#7B1113] text-white" : "text-[#7B1113] hover:text-[#7B1113] hover:bg-[#7B1113]/10"}`}
                            onClick={() => handleMenuNavigation("specifications")}
                        >
                            Specifications
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <Button
                            variant={currentSection === "submission" ? "default" : "ghost"}
                            className={`${currentSection === "submission" ? "bg-[#7B1113] text-white" : "text-[#7B1113] hover:text-[#7B1113] hover:bg-[#7B1113]/10"}`}
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
                            className="h-2 bg-[#7B1113]/20 [&>div]:bg-[#7B1113]"
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

                                    <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <div 
                                            id="orgSelect"
                                            role="combobox"
                                            aria-expanded={open}
                                            className="w-full flex items-center justify-between border border-input bg-transparent rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring hover:border-gray-400"
                                        >
                                            <span className={cn(!selectedOrgName && "text-muted-foreground")}>
                                            {selectedOrgName || "Type the student's org name or select from the list"}
                                            </span>
                                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </div>
                                    </PopoverTrigger>

                                        <PopoverContent align="start" className="w-full max-w-md p-0">
                                        <Input
                                            placeholder="Search organization..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                                        />
                                        <div className="max-h-48 overflow-y-auto">
                                            {filteredOrgs.length > 0 ? (
                                            filteredOrgs.map((org) => (
                                                <button
                                                key={org.org_id}
                                                onClick={() => {
                                                    setSelectedValue(String(org.org_id));
                                                    setSelectedOrgName(org.org_name);
                                                    setSearchTerm(org.org_name);
                                                    setOrganizationAdviser(org.adviser_name || "");
                                                    setOrganizationAdviserContact(org.adviser_email || "");
                                                    setOpen(false);
                                                    }}
                                                className={cn(
                                                    "w-full text-left px-4 py-2 hover:bg-gray-100",
                                                    selectedValue === String(org.org_id) && "bg-gray-100 font-medium"
                                                )}
                                                >
                                                {org.org_name}
                                                {selectedValue === String(org.org_id) && (
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
                                    </div>

                                    {/* Student Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Name and Student Position <span className="text-red-500">*</span></h3>
                                            <Input
                                                id="studentPosition"
                                                placeholder="Lance Gabriel Sacdalan - Chairperson"
                                                value={studentPosition}
                                                onChange={(e) => setStudentPosition(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Student Contact Number <span className="text-red-500">*</span></h3>
                                            <Input
                                                id="studentContact"
                                                placeholder="(09XXXXXXXXX)"
                                                value={studentContact}
                                                onChange={(e) => setStudentContact(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Activity Information */}
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Activity Name <span className="text-red-500">*</span></h3>
                                            <Input
                                                id="activityName"
                                                placeholder="(Mass Orientation, Welcome Party, etc.)"
                                                value={activityName}
                                                onChange={(e) => setActivityName(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Activity Description <span className="text-red-500">*</span></h3>
                                            <Textarea
                                                id="activityDescription"
                                                placeholder="Enter activity description"
                                                value={activityDescription}
                                                onChange={(e) => setActivityDescription(e.target.value)}
                                                className="min-h-[100px]"
                                            />
                                        </div>
                                    </div>

                                    {/* Activity Type */}
                                    <div>
                                        <h3 className="text-sm font-medium mb-2">Activity Type <span className="text-red-500">*</span></h3>
                                        <Select value={selectedActivityType} onValueChange={setSelectedActivityType}>
                                            <SelectTrigger id="activityType" className="w-full">
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
                                        {selectedActivityType === "others" && (
                                            <Input
                                                type="text"
                                                placeholder="Please specify"
                                                value={otherActivityType}
                                                onChange={(e) => setOtherActivityType(e.target.value)}
                                                className="mt-2"
                                            />
                                        )}
                                    </div>

                                    {/* Sustainable Development Goals */}
                                    <div>
                                    <h3 className="text-sm font-medium mb-2">Sustainable Development Goals <span className="text-red-500">*</span></h3>
                                    <div className="mb-4 border border-gray-200 rounded-md">
                                        <details id="sdgGoals" open>
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
                                            value={chargingFees1}
                                            onValueChange={setChargingFees1}
                                            className="space-y-3"
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
                                            value={partnering}
                                            onValueChange={setPartnering}
                                            className="space-y-3"
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
                                        className="bg-[#7B1113] text-white hover:bg-[#5e0d0f] px-6"
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
                                            value={recurring}
                                            onValueChange={setRecurring}
                                            className="space-y-3"
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
                                                type="date"
                                                min={new Date().toISOString().split("T")[0]}
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </div>
                                        {recurring === "recurring" && (
                                            <div>
                                                <h3 className="text-sm font-medium mb-2">Activity End Date <span className="text-red-500">*</span></h3>
                                                <Input
                                                    id="endDate"
                                                    type="date"
                                                    min={new Date().toISOString().split("T")[0]}
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
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
                                                                setRecurringDays(prev => ({
                                                                    ...prev,
                                                                    [day]: checked
                                                                }));
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
                                        className="bg-[#7B1113] text-white hover:bg-[#5e0d0f] px-6"
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
                                            onValueChange={setIsOffCampus}
                                            className="space-y-3"
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
                                                type="text"
                                                placeholder="(Teatro Amianan, CS AVR, etc.)"
                                                value={venue}
                                                onChange={(e) => setVenue(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="text-sm font-medium mb-2">Venue Approver <span className="text-red-500">*</span></h3>
                                                <Input
                                                    id="venueApprover"
                                                    type="text"
                                                    placeholder="Provide their name"
                                                    value={isOffCampus === "yes" ? "N/A" : venueApprover}
                                                    disabled={isOffCampus === "yes"}
                                                    className={isOffCampus === "yes" ? "bg-gray-100 cursor-not-allowed" : ""}
                                                    onChange={(e) => setVenueApprover(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium mb-2">Venue Approver Contact Info <span className="text-red-500">*</span></h3>
                                                <Input
                                                    id="venueApproverContact"
                                                    type="text"
                                                    placeholder="09XXXXXXXXX or XXX@up.edu.ph"
                                                    value={isOffCampus === "yes" ? "N/A" : venueApproverContact}
                                                    disabled={isOffCampus === "yes"}
                                                    className={isOffCampus === "yes" ? "bg-gray-100 cursor-not-allowed" : ""}
                                                    onChange={(e) => setVenueApproverContact(e.target.value)}
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
                                                    type="text"
                                                    placeholder="Provide their role"
                                                    value={partnerDescription}
                                                    onChange={(e) => setPartnerDescription(e.target.value)}
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
                                                    type="text"
                                                    placeholder="Provide their name"
                                                    value={greenCampusMonitor}
                                                    onChange={(e) => setGreenCampusMonitor(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium mb-2">Green Campus Monitor Contact Info <span className="text-red-500">*</span></h3>
                                                <Input
                                                    id="greenCampusMonitorContact"
                                                    type="text"
                                                    placeholder="09XXXXXXXXX or XXX@up.edu.ph"
                                                    value={greenCampusMonitorContact}
                                                    onChange={(e) => setGreenCampusMonitorContact(e.target.value)}
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
                                        className="bg-[#7B1113] text-white hover:bg-[#5e0d0f] px-6"
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
                                            <input
                                                id="activityRequestFileUpload"
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                disabled={isSubmitting}
                                            />
                                            </label>
                                        </div>

                                            {selectedFile && (
                                                <div>
                                                <h4 className="text-sm font-medium mb-1">Selected File</h4>
                                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileText className="w-4 h-4 text-red-500" />
                                                    {selectedFile.name}
                                                </p>
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
                                <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
                                <AlertDialogDescription>
                                Are you sure you want to submit this activity request now?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
                                No
                                </AlertDialogCancel>
                                <AlertDialogAction
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="bg-[#7B1113] text-white hover:bg-[#5e0d0f] px-6"
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
                                <AlertDialogTitle className="text-[#7B1113] text-2xl font-bold mb-6 text-left">
                                Submitted Successfully!
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-sm font-medium mb-2">
                                You will be redirected to the dashboard...
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                {/* Reminders Popup Modal */}
                <AlertDialog open={showRemindersDialog} onOpenChange={setShowRemindersDialog}>
                <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
                    <AlertDialogHeader>
                    <AlertDialogTitle className="text-[#7B1113]">
                        Please read before submitting your activity request:
                    </AlertDialogTitle>
                    </AlertDialogHeader>

                    <ScrollArea className="h-[60vh] pr-4">
                        <div className="text-sm text-gray-800 space-y-2 leading-relaxed">
                        <ol className="list-decimal list-inside space-y-2">
                        <li>
                        Requests to use any university facility or space must be submitted <strong>at least five days</strong> or at most two weeks prior to use. However, requests for activities to be held off-campus may be submitted earlier than two weeks.
                        </li>
                        <li>
                        The official curfew on campus is <strong>9:00 PM</strong>. Staying beyond this time is permitted only under exceptional circumstances, and requests for extensions will be considered only if supported by valid and acceptable justifications. Strict instructions are given to the Security Office not to allow use of facilities without prior approval for late stays. <strong>The presence of the organization’s adviser is required if the organization intends to remain on campus beyond 9:00 PM.</strong> Overnight sleeping on campus is strictly prohibited.
                        </li>
                        <li>
                        Student organizations requesting tables and chairs for their activity are responsible for setting them up in the designated venues and ensuring their proper return. Organizations that fail to return the equipment will receive a warning, and repeated violations may result in disciplinary action. Additionally, organizations are responsible for obtaining the keys to their requested rooms and must coordinate with the relevant offices or venue approvers during office hours, especially if the activity is scheduled for the weekend or extends beyond the 9:00 PM curfew.
                        </li>
                        <li>
                        There are designated areas for specific activities. For example, selling activities must be held in the space near the guardhouse and will not be allowed in the lobby or other areas. Organizations must always coordinate with the OSA and SRO to ensure that proper arrangements are made.
                        </li>
                        <li>
                        For the use of classrooms: (A) Organizations, particularly the Green Campus Monitor, must clean up and return the chairs to their original arrangement; (B) Any markings on the board should be erased; (C) Users should minimize noise to avoid disturbing ongoing classes and activities in adjacent rooms.
                        </li>
                        <li>
                        For borrowed equipment at OSA: (A) Equipment may be signed out an hour before the activity. If the equipment is to be used over the weekend, it may be signed out between 1:00 and 3:00 PM on Friday. (B) Equipment must be returned immediately after the approved time stated in the Approval Slip. If the activity takes place on a weekend, the equipment must be returned the following Monday between 8:00 AM and 9:00 AM. Upon return, OSA personnel will inspect the equipment to ensure it is in proper condition. (C) Lost equipment must be replaced with the same specifications. A reasonable deadline will be set for replacement. Damaged or non-functioning units will be dealt with on a 'case-to-case' basis, depending on the severity of the damage.
                        </li>
                        <li>
                        Student organizations must strictly adhere to the approved time for using the facility or staying on campus. Any extensions will require further approval, as other requests may be scheduled after their use.
                        </li>
                        <li>
                        When collaborating with a university unit or another organization, the concept paper for the activity must be signed by the representatives of both the partner unit or organization and the student organization's representatives, including the organization advisers.
                        </li>
                        <li>
                        If the activity is off-campus, the requesting organization must also submit OSA-SRO Form 2A (Notice of Off-Campus Activity) and OSA-SRO Form 2B (Waiver for Off-Campus Student Activities), with Form 2B requiring notarization.
                        </li>
                        <li>
                        A venue approver is only needed when the activity is held on-campus and conducted in person. Otherwise, the organization must indicate the online platform to be used or the off-campus venue.
                        </li>
                        <li>
                        Violations of any rules/guidelines shall be dealt with strictly and accordingly.
                        </li>
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

export default AdminCreateActivity;