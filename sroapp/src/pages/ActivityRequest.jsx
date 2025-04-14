import { useState } from "react";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Progress } from "../components/ui/progress";
import { createActivity } from '../api/activityRequestAPI';     
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
import supabase from "@/lib/supabase";  

const ActivityRequest = () => {
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
    const [otherPublicAffairs, setOtherPublicAffairs] = useState("");
    const [endTime, setEndTime] = useState("");
    const [isOffCampus, setIsOffCampus] = useState("");
    const [venue, setVenue] = useState("");
    const [venueApprover, setVenueApprover] = useState("");
    const [venueApproverContact, setVenueApproverContact] = useState("");
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
    const navigate = useNavigate();

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

    // Example options for the select component
    const options = Array.from({ length: 20 }, (_, i) => ({
        value: `option-${i + 1}`,
        label: `Option ${i + 1}`
    }));

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
            "Kasarian Gender Studies Program)",
            "Office of Anti-Sexual Harassment",
        ],
        publicAffairs: [
            "Office of Public Affairs (OPA)",
            "Alumni Relations Office (ARO)",
            "Others"
        ]
    };

        // ✅ Handles file upload validation
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
        
            if (selectedFile && selectedFile.type !== "application/pdf") {
              toast.error("Only PDF files are allowed.");
              return;
            }
        
            try {
              const {
                data: { user },
                error: userError
              } = await supabase.auth.getUser();
        
              if (userError || !user) {
                toast.error("You're not logged in.");
                return;
              }
        
              const { data: accountData, error: accountError } = await supabase
                .from("account")
                .select("account_id")
                .eq("email", user.email)
                .single();
        
              if (accountError || !accountData) {
                toast.error("No matching account found.");
                return;
              }
        
              const account_id = accountData.account_id;
        
              const activityData = {
                account_id,
                org_id: 1, //change this    
                student_position: studentPosition,
                activity_name: activityName,
                activity_description: activityDescription,
                activity_type: selectedActivityType,
                sdg_goals: Object.keys(selectedSDGs).filter(key => selectedSDGs[key]).join(","),
                charge_fee: chargingFees1 === "yes",
                university_partner: partnering === "yes",
                partner_name: partnerDescription,
                partner_role: '',
                venue,
                venue_approver: venueApprover,
                venue_approver_contact: venueApproverContact,
                is_off_campus: isOffCampus === "yes",
                green_monitor_name: greenCampusMonitor,
                green_monitor_contact: greenCampusMonitorContact,
              };
        
              const result = await createActivity(activityData, selectedFile);
              console.log("✅ Activity submitted:", result);
        
              toast.success("Your activity request was submitted successfully!");
        
              setTimeout(() => {
                navigate("/dashboard");
              }, 2000);
        
            } catch (error) {
              console.error("Submission error:", error);
              toast.error(error.message || "Something went wrong.");
            }
          };

    const handleSectionChange = (sectionId) => {
        setCurrentSection(sectionId);
    };

    return (
        <div className="min-h-screen flex flex-col items-start justify-start py-8">
            <div className="w-full max-w-2xl mx-auto px-6">
                <h1 className="text-2xl font-bold mb-6 text-left">Request Form</h1>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <Toaster/>
                    {/* Menu Bar */}
                    <div className="flex items-center space-x-4 mb-4">
                        <Button
                            variant={currentSection === "general-info" ? "default" : "ghost"}
                            className={`${currentSection === "general-info" ? "bg-[#014421] text-white" : "text-[#014421] hover:text-[#014421] hover:bg-[#014421]/10"}`}
                            onClick={() => handleSectionChange("general-info")}
                        >
                            General Information
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <Button
                            variant={currentSection === "date-info" ? "default" : "ghost"}
                            className={`${currentSection === "date-info" ? "bg-[#014421] text-white" : "text-[#014421] hover:text-[#014421] hover:bg-[#014421]/10"}`}
                            onClick={() => handleSectionChange("date-info")}
                        >
                            Date Information
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <Button
                            variant={currentSection === "specifications" ? "default" : "ghost"}
                            className={`${currentSection === "specifications" ? "bg-[#014421] text-white" : "text-[#014421] hover:text-[#014421] hover:bg-[#014421]/10"}`}
                            onClick={() => handleSectionChange("specifications")}
                        >
                            Specifications
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <Button
                            variant={currentSection === "submission" ? "default" : "ghost"}
                            className={`${currentSection === "submission" ? "bg-[#014421] text-white" : "text-[#014421] hover:text-[#014421] hover:bg-[#014421]/10"}`}
                            onClick={() => handleSectionChange("submission")}
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
                                        <h3 className="text-sm font-medium mb-2">Organization Name</h3>
                                        <Select value={selectedValue} onValueChange={setSelectedValue}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select an option" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[200px]">
                                                {options.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Student Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Student Position</h3>
                                            <Input
                                                placeholder="(Chairperson, Secretary, etc.)"
                                                value={studentPosition}
                                                onChange={(e) => setStudentPosition(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Student Contact Number</h3>
                                            <Input
                                                placeholder="(09xxxxxxxxx)"
                                                value={studentContact}
                                                onChange={(e) => setStudentContact(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Activity Information */}
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Activity Name</h3>
                                            <Input
                                                placeholder="(Mass Orientation, Welcome Party, etc.)"
                                                value={activityName}
                                                onChange={(e) => setActivityName(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Activity Description</h3>
                                            <Textarea
                                                placeholder="Enter activity description"
                                                value={activityDescription}
                                                onChange={(e) => setActivityDescription(e.target.value)}
                                                className="min-h-[100px]"
                                            />
                                        </div>
                                    </div>

                                    {/* Activity Type */}
                                    <div>
                                        <h3 className="text-sm font-medium mb-2">Activity Type</h3>
                                        <Select value={selectedActivityType} onValueChange={setSelectedActivityType}>
                                            <SelectTrigger className="w-full">
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
                                        <h3 className="text-sm font-medium mb-2">Sustainable Development Goals</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {sdgOptions.map((option) => (
                                                <div key={option.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={option.id}
                                                        checked={selectedSDGs[option.id]}
                                                        onCheckedChange={() => handleSDGChange(option.id)}
                                                    />
                                                    <label
                                                        htmlFor={option.id}
                                                        className="text-sm font-medium leading-none"
                                                    >
                                                        {option.label}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Charging Fees */}
                                    <div>
                                        <h3 className="text-sm font-medium mb-2">Charging Fees?</h3>
                                        <RadioGroup
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
                                        <h3 className="text-sm font-medium mb-2">Partnering with a university unit or organization?</h3>
                                        <RadioGroup
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
                                        className="bg-[#014421] text-white hover:bg-[#003218] px-6"
                                        onClick={() => handleSectionChange("date-info")}
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
                                        <h3 className="text-sm font-medium mb-2">Recurring?</h3>
                                        <RadioGroup
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
                                            <h3 className="text-sm font-medium mb-2">Activity Start Date</h3>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </div>
                                        {recurring === "recurring" && (
                                            <div>
                                                <h3 className="text-sm font-medium mb-2">Activity End Date</h3>
                                                <Input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Activity Start Time</h3>
                                            <Input
                                                type="time"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Activity End Time</h3>
                                            <Input
                                                type="time"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Recurring Days */}
                                    {recurring === "recurring" && (
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Recurring Day/s Per Week</h3>
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
                                        onClick={() => handleSectionChange("general-info")}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="button"
                                        className="bg-[#014421] text-white hover:bg-[#003218] px-6"
                                        onClick={() => handleSectionChange("specifications")}
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
                                        <h3 className="text-sm font-medium mb-2">Off-Campus?</h3>
                                        <RadioGroup
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
                                            <h3 className="text-sm font-medium mb-2">Venue</h3>
                                            <Input
                                                type="text"
                                                placeholder="Your Answer"
                                                value={venue}
                                                onChange={(e) => setVenue(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="text-sm font-medium mb-2">Venue Approver</h3>
                                                <Input
                                                    type="text"
                                                    placeholder="Provide their name. Write 'N/A' if the venue is off-campus."
                                                    value={venueApprover}
                                                    onChange={(e) => setVenueApprover(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium mb-2">Venue Approver Contact Info</h3>
                                                <Input
                                                    type="text"
                                                    placeholder="Provide their contact information"
                                                    value={venueApproverContact}
                                                    onChange={(e) => setVenueApproverContact(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Organization Information */}
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="text-sm font-medium mb-2">Organization Adviser</h3>
                                                <Input
                                                    type="text"
                                                    placeholder="Provide their name"
                                                    value={organizationAdviser}
                                                    onChange={(e) => setOrganizationAdviser(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium mb-2">Organization Adviser Contact Info</h3>
                                                <Input
                                                    type="text"
                                                    placeholder="Provide their mobile no. or e-mail."
                                                    value={organizationAdviserContact}
                                                    onChange={(e) => setOrganizationAdviserContact(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Green Campus Monitor Information */}
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="text-sm font-medium mb-2">Green Campus Monitor/s</h3>
                                                <Input
                                                    type="text"
                                                    placeholder="Provide their name/s."
                                                    value={greenCampusMonitor}
                                                    onChange={(e) => setGreenCampusMonitor(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium mb-2">Green Campus Monitor/s Contact Info</h3>
                                                <Input
                                                    type="text"
                                                    placeholder="Provide their mobile no. or e-mail."
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
                                        onClick={() => handleSectionChange("date-info")}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="button"
                                        className="bg-[#014421] text-white hover:bg-[#003218] px-6"
                                        onClick={() => handleSectionChange("submission")}
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
                                    <h3 className="text-sm font-medium mb-2">Scanned Copy of Activity Request Form (PDF)</h3>
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
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                id="file-upload"
                                            />
                                            <Button
                                                type="button"
                                                className="bg-[#014421] text-white hover:bg-[#003218]"
                                                onClick={() => document.getElementById('file-upload').click()}
                                            >
                                                Add File
                                            </Button>
                                            {selectedFile && (
                                                <p className="mt-2 text-sm text-gray-600">
                                                    Selected file: {selectedFile.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <Button
                                        type="button"
                                        className="bg-gray-300 text-gray-600 hover:bg-gray-400 px-6"
                                        onClick={() => handleSectionChange("specifications")}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-[#014421] text-white hover:bg-[#003218] px-6"
                                    >
                                        Submit
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ActivityRequest;
