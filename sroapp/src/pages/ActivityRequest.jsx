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

const ActivityRequest = () => {
    const [selectedValue, setSelectedValue] = useState("");
    const [activityName, setActivityName] = useState("");
    const [selectedActivityType, setSelectedActivityType] = useState("");
    const [otherActivityType, setOtherActivityType] = useState("");
    const [chargingFees1, setChargingFees1] = useState("");
    const [chargingFees2, setChargingFees2] = useState("");
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

    const handleFileChange = (e) => {
        if (e.target.files?.[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission here
        console.log('Form submitted');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl p-6">
                <h1 className="text-2xl font-bold mb-6 text-left">Request Form</h1>

                <h3 className="text-sm mb-3 text-left">Organization Name</h3>
                
                <div className="w-full">
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

                <h3 className="text-sm mt-3 text-left">Student Position</h3>
                <Textarea
                    placeholder="(Chairperson, Secretary, etc.)"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    className="mt-2"
                />

                <h3 className="text-sm mt-3 text-left">Student Contact Number</h3>
                <Textarea
                    placeholder="(09xxxxxxxxx)"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    className="mt-2 min-h-[50px]"
                />

                <h3 className="text-sm mt-3 text-left">Activity Name</h3>
                <Textarea
                    placeholder="(Mass Orientation, Welcome Party, etc.)"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    className="mt-2 min-h-[50px]"
                />

                <h3 className="text-sm mt-3 text-left">Activity Description</h3>
                <Textarea
                    placeholder="Enter activity description"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    className="mt-2 min-h-[100px]"
                />

                <h3 className="text-sm mt-3 text-left">Activity Type</h3>
                <div className="mt-2 border rounded-md p-4">
                    <p className="text-sm text-gray-500 mb-3">Categorize the requested activity.</p>
                    <RadioGroup
                        value={selectedActivityType}
                        onValueChange={setSelectedActivityType}
                        className="space-y-3"
                    >
                        {activityTypeOptions.map((option) => (
                            <div key={option.id} className="flex flex-col">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value={option.id} id={option.id} />
                                    <label
                                        htmlFor={option.id}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {option.label}
                                    </label>
                                </div>
                                {option.id === "others" && selectedActivityType === "others" && (
                                    <Input
                                        type="text"
                                        placeholder="Please specify"
                                        value={otherActivityType}
                                        onChange={(e) => setOtherActivityType(e.target.value)}
                                        className="mt-2 ml-6 border-0 border-b focus:ring-0 rounded-none px-0 h-7 text-sm"
                                    />
                                )}
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                <h3 className="text-sm mt-3 text-left">Sustainable Development Goals</h3>
                <div className="mt-2 border rounded-md p-4">
                    <p className="text-sm text-gray-500 italic mb-3">Select all target development goals that your activity will try to achieve.</p>
                    <div className="space-y-3">
                        {sdgOptions.map((option) => (
                            <div key={option.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={option.id}
                                    checked={selectedSDGs[option.id]}
                                    onCheckedChange={() => handleSDGChange(option.id)}
                                />
                                <label
                                    htmlFor={option.id}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    {option.label}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>


                <h3 className="text-sm mt-3 text-left">Charging Fees?</h3>
                <div className="mt-2 border rounded-md p-4">
                    <p className="text-sm text-gray-500 italic mb-3">(If Yes, provide the mechanics in the Concept Paper.)</p>
                    <RadioGroup
                        value={chargingFees1}
                        onValueChange={setChargingFees1}
                        className="space-y-3"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="fees-yes" />
                            <label
                                htmlFor="fees1-yes"
                                className="text-sm font-medium leading-none"
                            >
                                Yes
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="fees-no" />
                            <label
                                htmlFor="fees1-no"
                                className="text-sm font-medium leading-none"
                            >
                                No
                            </label>
                        </div>
                    </RadioGroup>
                </div>

                <h3 className="text-sm mt-3 text-left">Partnering with a university unit or organization?</h3>
                <div className="mt-2 border rounded-md p-4">
                    <p className="text-sm text-gray-500 italic mb-3">(HSO, BREHA, OGG, OAS, etc.)</p>
                    <RadioGroup
                        value={partnering}
                        onValueChange={setPartnering}
                        className="space-y-3"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="partnering-yes" />
                            <label
                                htmlFor="partnering-yes"
                                className="text-sm font-medium leading-none"
                            >
                                Yes
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="partnering-no" />
                            <label
                                htmlFor="partnering-no"
                                className="text-sm font-medium leading-none"
                            >
                                No
                            </label>
                        </div>
                    </RadioGroup>
                </div>

                <h3 className="text-sm mt-3 text-left">University Partner/s</h3>
                <div className="mt-2 border rounded-md p-4">
                    <p className="text-sm text-gray-500 italic mb-3">Select all that you are partnered with.</p>
                    
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-sm mb-2">Colleges</h4>
                            <div className="space-y-2">
                                {universityPartners.colleges.map((college) => (
                                    <div key={college} className="flex items-center space-x-2">
                                        <Checkbox id={`college-${college}`} />
                                        <label
                                            htmlFor={`college-${college}`}
                                            className="text-sm font-medium leading-none"
                                        >
                                            {college}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-sm mb-2">Departments</h4>
                            <div className="space-y-2">
                                {universityPartners.departments.map((dept) => (
                                    <div key={dept} className="flex items-center space-x-2">
                                        <Checkbox id={`dept-${dept}`} />
                                        <label
                                            htmlFor={`dept-${dept}`}
                                            className="text-sm font-medium leading-none"
                                        >
                                            {dept}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-sm mb-2">Student Affairs</h4>
                            <div className="space-y-2">
                                {universityPartners.studentAffairs.map((office) => (
                                    <div key={office} className="flex items-center space-x-2">
                                        <Checkbox id={`student-${office}`} />
                                        <label
                                            htmlFor={`student-${office}`}
                                            className="text-sm font-medium leading-none"
                                        >
                                            {office}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-sm mb-2">Academic Affairs</h4>
                            <div className="space-y-2">
                                {universityPartners.academicAffairs.map((office) => (
                                    <div key={office} className="flex items-center space-x-2">
                                        <Checkbox id={`academic-${office}`} />
                                        <label
                                            htmlFor={`academic-${office}`}
                                            className="text-sm font-medium leading-none"
                                        >
                                            {office}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-sm mb-2">Public Affairs</h4>
                            <div className="space-y-2">
                                {universityPartners.publicAffairs.map((office) => (
                                    <div key={office} className="flex flex-col">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`public-${office}`}
                                                checked={selectedPublicAffairs[office]}
                                                onCheckedChange={() => {
                                                    setSelectedPublicAffairs(prev => ({
                                                        ...prev,
                                                        [office]: !prev[office]
                                                    }));
                                                }}
                                            />
                                            <label
                                                htmlFor={`public-${office}`}
                                                className="text-sm font-medium leading-none"
                                            >
                                                {office}
                                            </label>
                                        </div>
                                        {office === "Others" && selectedPublicAffairs["Others"] && (
                                            <Input
                                                type="text"
                                                placeholder="Please specify"
                                                value={otherPublicAffairs}
                                                onChange={(e) => setOtherPublicAffairs(e.target.value)}
                                                className="mt-2 ml-6 border-0 border-b focus:ring-0 rounded-none px-0 h-7 text-sm"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <h3 className="text-sm mt-3 text-left">Description of Partner's Role in the Activity</h3>
                <Textarea
                    placeholder="Your Answer"
                    value={partnerDescription}
                    onChange={(e) => setPartnerDescription(e.target.value)}
                    className="mt-2"
                />

                <h3 className="text-sm mt-3 text-left">Recurring?</h3>
                <div className="mt-2 border rounded-md p-4">
                    <p className="text-sm text-gray-500 italic mb-3">One-time, if the activity will happen on a single date. Recurring, if the activity will happen over the course of multiple dates</p>
                    <RadioGroup
                        value={recurring}
                        onValueChange={setRecurring}
                        className="space-y-3"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="one-time" id="one-time" />
                            <label
                                htmlFor="one-time"
                                className="text-sm font-medium leading-none"
                            >
                                One-time
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="recurring" id="recurring" />
                            <label
                                htmlFor="recurring"
                                className="text-sm font-medium leading-none"
                            >
                                Recurring
                            </label>
                        </div>
                    </RadioGroup>
                </div>

                <h3 className="text-sm mt-3 text-left">Activity Start Date</h3>
                <div className="mt-2 border rounded-md p-4">
                    <p className="text-sm text-gray-500 italic mb-3">Date of activity should be requested AT LEAST FIVE (5) DAYS BEFORE the activity.</p>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-2"
                    />
                </div>

                {recurring === "recurring" && (
                    <>
                        <h3 className="text-sm mt-3 text-left">Activity End Date</h3>
                        <div className="mt-2 border rounded-md p-4">
                            <p className="text-sm text-gray-500 italic mb-3">Date of activity should be requested AT LEAST FIVE (5) DAYS BEFORE the activity.</p>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="mt-2"
                            />
                        </div>
                        
                        <h3 className="text-sm mt-3 text-left">Recurring Day/s Per Week</h3>
                        <div className="mt-2 border rounded-md p-4">
                            <p className="text-sm text-gray-500 italic mb-3">Indicate the day/s of the week in which the activity will occur.</p>
                            <div className="space-y-2">
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

                    </>
                )}

                <h3 className="text-sm mt-3 text-left">Activity Start Time</h3>
                <div className="mt-2 border rounded-md p-4">
                    <p className="text-sm text-gray-500 italic mb-3">NOTE: Official curfew in the campus is at 9:00PM.</p>
                    <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="mt-2"
                    />
                </div>

                <h3 className="text-sm mt-3 text-left">Activity End Time</h3>
                <div className="mt-2 border rounded-md p-4">
                    <p className="text-sm text-gray-500 italic mb-3">NOTE: Official curfew in the campus is at 9:00PM.</p>
                    <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="mt-2"
                    />
                </div>

                <h3 className="text-sm mt-3 text-left">Off-Campus?</h3>
                <div className="mt-2 border rounded-md p-4">
                    <p className="text-sm text-gray-500 italic mb-3">If Yes, submit OSA-SRO Forms 2A and 2B.</p>
                    <RadioGroup
                        value={isOffCampus}
                        onValueChange={setIsOffCampus}
                        className="space-y-3"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="offcampus-yes" />
                            <label
                                htmlFor="offcampus-yes"
                                className="text-sm font-medium leading-none"
                            >
                                Yes
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="offcampus-no" />
                            <label
                                htmlFor="offcampus-no"
                                className="text-sm font-medium leading-none"
                            >
                                No
                            </label>
                        </div>
                    </RadioGroup>
                </div>

                <h3 className="text-sm mt-3 text-left">Venue</h3>
                <Input
                    type="text"
                    placeholder="Your Answer"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="mt-2"
                />

                <h3 className="text-sm mt-3 text-left">Venue Approver</h3>
                <Input
                    type="text"
                    placeholder="Provide their name. Write 'N/A' if the venue is off-campus."
                    value={venueApprover}
                    onChange={(e) => setVenueApprover(e.target.value)}
                    className="mt-2"
                />

                <h3 className="text-sm mt-3 text-left">Venue Approver Contact Info</h3>
                <Input
                    type="text"
                    placeholder="Provide their name. Write 'N/A' if the venue is off-campus."
                    value={venueApproverContact}
                    onChange={(e) => setVenueApproverContact(e.target.value)}
                    className="mt-2"
                />

                <h3 className="text-sm mt-3 text-left">Organization Adviser</h3>
                <Input
                    type="text"
                    placeholder="Provide their name"
                    value={organizationAdviser}
                    onChange={(e) => setOrganizationAdviser(e.target.value)}
                    className="mt-2"
                />

                <h3 className="text-sm mt-3 text-left">Organization Adviser Contact Info</h3>
                <Input
                    type="text"
                    placeholder="Provide their mobile no. or e-mail."
                    value={organizationAdviserContact}
                    onChange={(e) => setOrganizationAdviserContact(e.target.value)}
                    className="mt-2"
                />

                <h3 className="text-sm mt-3 text-left">Green Campus Monitor/s</h3>
                <Input
                    type="text"
                    placeholder="Provide their name/s."
                    value={greenCampusMonitor}
                    onChange={(e) => setGreenCampusMonitor(e.target.value)}
                    className="mt-2"
                />

                <h3 className="text-sm mt-3 text-left">Green Campus Monitor/s Contact Info</h3>
                <Input
                    type="text"
                    placeholder="Provide their mobile no. or e-mail."
                    value={greenCampusMonitorContact}
                    onChange={(e) => setGreenCampusMonitorContact(e.target.value)}
                    className="mt-2 mb-6"
                />

                <h3 className="text-sm mt-3 text-left">Scanned Copy of Activity Request Form (PDF)</h3>
                <div className="mt-2 border rounded-md p-4">
                    <p className="text-sm text-black-500 mb-3">
                        Provide a scanned copy of your activity request form with your point person's, venue approver's, and adviser's signature.
                    </p>
                    <p className="text-sm text-black-500 font-bold mb-3">
                        NOTE: INCLUDE OTHER SCANNED FORMS IN THE PDF IF RELEVANT
                        <br />
                        (Notice of Off-Campus Activity, Job Request Forms, etc.)
                    </p>
                    <p className="text-sm text-black-500 font-bold mb-3">
                        [LAST NAME OF REQUESTING STUDENT]_[ORG]_Activity Request Form_(mm-dd-yyyy)
                        <br />
                        i.e. LARUA-COMBIS@UPB.EDU.PH_Activity Request Form_01-01-2024
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

                <div className="mt-6 flex justify-end">
                    <Button
                        type="submit"
                        className="bg-[#014421] text-white hover:bg-[#003218]"
                        onClick={handleSubmit}
                    >
                        Submit
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ActivityRequest;

