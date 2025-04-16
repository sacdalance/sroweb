import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { Progress } from "../../components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

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
  const [currentSection, setCurrentSection] = useState("general-info");

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

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Admin submission logic here
    console.log("Form submitted with values:", {
      organization: selectedValue,
      studentPosition,
      activityName,
      activityDescription,
      activityType: selectedActivityType,
      sdgs: Object.keys(selectedSDGs).filter(key => selectedSDGs[key]),
      chargingFees: chargingFees1,
      partnering,
      partnerDescription,
      startDate,
      endDate,
      startTime,
      endTime,
      venue,
      isOffCampus
    });
  };

  const handleSectionChange = (sectionId) => {
    setCurrentSection(sectionId);
  };

  return (
    <div className="min-h-screen flex flex-col items-start justify-start py-8">
      <div className="w-full max-w-2xl mx-auto px-6">
        <h1 className="text-2xl font-bold mb-6 text-[#7B1113]">Request Form</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-[#7B1113]">Create Activity Form</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              This form is for admins to create activity requests to add directly to records.
            </p>
          </CardContent>
        </Card>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Menu Bar */}
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant={currentSection === "general-info" ? "default" : "ghost"}
              className={`${currentSection === "general-info" ? "bg-[#7B1113] text-white" : "text-[#7B1113] hover:text-[#7B1113] hover:bg-[#7B1113]/10"}`}
              onClick={() => handleSectionChange("general-info")}
            >
              General Information
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant={currentSection === "date-info" ? "default" : "ghost"}
              className={`${currentSection === "date-info" ? "bg-[#7B1113] text-white" : "text-[#7B1113] hover:text-[#7B1113] hover:bg-[#7B1113]/10"}`}
              onClick={() => handleSectionChange("date-info")}
            >
              Date Information
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant={currentSection === "specifications" ? "default" : "ghost"}
              className={`${currentSection === "specifications" ? "bg-[#7B1113] text-white" : "text-[#7B1113] hover:text-[#7B1113] hover:bg-[#7B1113]/10"}`}
              onClick={() => handleSectionChange("specifications")}
            >
              Specifications
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant={currentSection === "submission" ? "default" : "ghost"}
              className={`${currentSection === "submission" ? "bg-[#7B1113] text-white" : "text-[#7B1113] hover:text-[#7B1113] hover:bg-[#7B1113]/10"}`}
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
                    <h3 className="text-sm font-medium mb-2">Organization Name</h3>
                    <Select value={selectedValue} onValueChange={setSelectedValue}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="org1">Organization 1</SelectItem>
                        <SelectItem value="org2">Organization 2</SelectItem>
                        <SelectItem value="org3">Organization 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Student Name */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Student Name</h3>
                    <Input 
                      placeholder="(Last Name, First Name M.I.)"
                    />
                  </div>

                  {/* Student Position */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Student Position</h3>
                    <Input 
                      placeholder="(Chairperson, Secretary, etc.)"
                      value={studentPosition}
                      onChange={(e) => setStudentPosition(e.target.value)}
                    />
                  </div>

                  {/* Student Contact Number */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Student Contact Number</h3>
                    <Input 
                      placeholder="(09xxxxxxxx)"
                      value={studentContact}
                      onChange={(e) => setStudentContact(e.target.value)}
                    />
                  </div>

                  {/* Activity Name */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Activity Name</h3>
                    <Input 
                      placeholder="(Mass Orientation, Welcome Party, etc.)"
                      value={activityName}
                      onChange={(e) => setActivityName(e.target.value)}
                    />
                  </div>

                  {/* Activity Description */}
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
              </div>
            )}

            {/* Date Information Section */}
            {currentSection === "date-info" && (
              <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Start Date */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Start Date</h3>
                    <Input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">End Date</h3>
                    <Input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>

                  {/* Start Time */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Start Time</h3>
                    <Input 
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">End Time</h3>
                    <Input 
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>

                  {/* Location/Venue */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Venue</h3>
                    <Input 
                      placeholder="Enter venue"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Specifications Section */}
            {currentSection === "specifications" && (
              <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-1 gap-6">
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
                      <div className="mt-3">
                        <Input 
                          placeholder="Please specify"
                          value={otherActivityType}
                          onChange={(e) => setOtherActivityType(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Sustainable Development Goals */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Sustainable Development Goals</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {sdgOptions.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={option.id}
                            checked={selectedSDGs[option.id] || false}
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

                  {/* Will you be charging fees? */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Will you be charging fees?</h3>
                    <RadioGroup value={chargingFees1} onValueChange={setChargingFees1}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="chargingFees1-yes" />
                        <label htmlFor="chargingFees1-yes">Yes</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="chargingFees1-no" />
                        <label htmlFor="chargingFees1-no">No</label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Is this off-campus? */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Is this off-campus?</h3>
                    <RadioGroup value={isOffCampus} onValueChange={setIsOffCampus}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="isOffCampus-yes" />
                        <label htmlFor="isOffCampus-yes">Yes</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="isOffCampus-no" />
                        <label htmlFor="isOffCampus-no">No</label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            )}

            {/* Submission Section */}
            {currentSection === "submission" && (
              <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Upload Supporting Documents */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Upload Supporting Documents</h3>
                    <Input 
                      type="file"
                      onChange={handleFileChange}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Please upload any relevant supporting documents for this activity request.
                    </p>
                  </div>

                  {/* Final Submission */}
                  <div className="flex justify-end space-x-3">
                    <Button 
                      type="button" 
                      variant="outline"
                      className="border-[#7B1113] text-[#7B1113]"
                    >
                      Save as Draft
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-[#7B1113] hover:bg-[#5e0d0e]"
                    >
                      Submit Request
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            {currentSection !== "general-info" && (
              <Button
                type="button"
                variant="outline"
                className="border-[#7B1113] text-[#7B1113]"
                onClick={() => {
                  const sections = ["general-info", "date-info", "specifications", "submission"];
                  const currentIndex = sections.indexOf(currentSection);
                  setCurrentSection(sections[currentIndex - 1]);
                }}
              >
                Previous
              </Button>
            )}
            {currentSection !== "submission" && (
              <Button
                type="button"
                className="bg-[#7B1113] hover:bg-[#5e0d0e] ml-auto"
                onClick={() => {
                  const sections = ["general-info", "date-info", "specifications", "submission"];
                  const currentIndex = sections.indexOf(currentSection);
                  setCurrentSection(sections[currentIndex + 1]);
                }}
              >
                Next
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCreateActivity; 