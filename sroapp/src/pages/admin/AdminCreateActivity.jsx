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
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { Progress } from "../../components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { AlertCircle } from "lucide-react";

const AdminCreateActivity = () => {
  // Form state
  const [formData, setFormData] = useState({
    // General Information
    organization: "",
    studentName: "",
    studentPosition: "",
    studentContact: "",
    activityName: "",
    activityDescription: "",
    
    // Date Information
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    venue: "",
    
    // Specifications
    activityType: "",
    otherActivityType: "",
    sdgs: {},
    chargingFees: "",
    isOffCampus: "",
    
    // Submission
    supportingDocs: null
  });

  // Validation state
  const [errors, setErrors] = useState({});
  const [currentSection, setCurrentSection] = useState("general-information");
  const [visitedSections, setVisitedSections] = useState(new Set(["general-information"]));

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

  const validateGeneralInfo = () => {
    const newErrors = {};
    if (!formData.organization) newErrors.organization = "Organization is required";
    if (!formData.studentName) newErrors.studentName = "Student name is required";
    if (!formData.studentPosition) newErrors.studentPosition = "Position is required";
    if (!formData.studentContact) newErrors.studentContact = "Contact number is required";
    if (!formData.activityName) newErrors.activityName = "Activity name is required";
    if (!formData.activityDescription) newErrors.activityDescription = "Description is required";
    return newErrors;
  };

  const validateDateInfo = () => {
    const newErrors = {};
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (!formData.startTime) newErrors.startTime = "Start time is required";
    if (!formData.endTime) newErrors.endTime = "End time is required";
    if (!formData.venue) newErrors.venue = "Venue is required";
    
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = "End date cannot be before start date";
    }
    return newErrors;
  };

  const validateSpecifications = () => {
    const newErrors = {};
    if (!formData.activityType) newErrors.activityType = "Activity type is required";
    if (formData.activityType === "others" && !formData.otherActivityType) {
      newErrors.otherActivityType = "Please specify the activity type";
    }
    if (!formData.chargingFees) newErrors.chargingFees = "Please indicate if you're charging fees";
    if (!formData.isOffCampus) newErrors.isOffCampus = "Please indicate if this is off-campus";
    if (Object.keys(formData.sdgs).filter(key => formData.sdgs[key]).length === 0) {
      newErrors.sdgs = "Please select at least one SDG";
    }
    return newErrors;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSDGChange = (id) => {
    setFormData(prev => ({
      ...prev,
      sdgs: {
        ...prev.sdgs,
        [id]: !prev.sdgs[id]
      }
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFormData(prev => ({
        ...prev,
        supportingDocs: e.target.files[0]
      }));
    }
  };

  const validateCurrentSection = () => {
    switch (currentSection) {
      case "general-information":
        return validateGeneralInfo();
      case "date-information":
        return validateDateInfo();
      case "specifications":
        return validateSpecifications();
      default:
        return {};
    }
  };

  const handleNext = () => {
    const validationErrors = validateCurrentSection();
    if (Object.keys(validationErrors).length === 0) {
      const sections = ["general-information", "date-information", "specifications", "submission"];
      const currentIndex = sections.indexOf(currentSection);
      const nextSection = sections[currentIndex + 1];
      setCurrentSection(nextSection);
      setVisitedSections(prev => new Set([...prev, nextSection]));
      setErrors({});
    } else {
      setErrors(validationErrors);
    }
  };

  const handlePrevious = () => {
    const sections = ["general-information", "date-information", "specifications", "submission"];
    const currentIndex = sections.indexOf(currentSection);
    setCurrentSection(sections[currentIndex - 1]);
  };

  const handleSectionChange = (sectionId) => {
    if (visitedSections.has(sectionId) || sectionId === currentSection) {
      setCurrentSection(sectionId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateCurrentSection();
    if (Object.keys(validationErrors).length === 0) {
      // Submit form logic here
      console.log("Form submitted:", formData);
    } else {
      setErrors(validationErrors);
    }
  };

  const renderError = (field) => {
    if (errors[field]) {
      return (
        <p className="text-sm text-red-500 mt-1">
          {errors[field]}
        </p>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col items-start justify-start py-8">
      <div className="w-full max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-3 text-[#7B1113]">Request Form</h1>
        
        <Card className="w-full mb-6">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold text-[#7B1113] mb-2">Create Activity Form</h2>
            <p className="text-sm text-gray-600">
              Complete all required fields in each section before proceeding. You can return to previous sections to review or update your answers.
            </p>
          </CardContent>
        </Card>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Menu Bar */}
          <div className="flex items-center space-x-4 mb-4">
            {["general-information", "date-information", "specifications", "submission"].map((section, index) => (
              <>
                <Button
                  key={section}
                  variant={currentSection === section ? "default" : "ghost"}
                  className={`
                    ${currentSection === section ? "bg-[#7B1113] text-white" : "text-[#7B1113] hover:text-[#7B1113] hover:bg-[#7B1113]/10"}
                    ${!visitedSections.has(section) && section !== currentSection ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                  onClick={() => handleSectionChange(section)}
                  disabled={!visitedSections.has(section) && section !== currentSection}
                >
                  {section.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                </Button>
                {index < 3 && <Separator orientation="vertical" className="h-6" />}
              </>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <Progress 
              value={
                currentSection === "general-information" ? 25 : 
                currentSection === "date-information" ? 50 : 
                currentSection === "specifications" ? 75 : 100
              } 
              className="h-2 bg-[#7B1113]/20 [&>div]:bg-[#7B1113]"
            />
          </div>

          {/* Form Sections */}
          <div className="min-h-[500px]">
            {/* General Information Section */}
            {currentSection === "general-information" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Organization Name *</h3>
                    <Select 
                      value={formData.organization} 
                      onValueChange={(value) => handleInputChange("organization", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an organization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="org1">Organization 1</SelectItem>
                        <SelectItem value="org2">Organization 2</SelectItem>
                        <SelectItem value="org3">Organization 3</SelectItem>
                      </SelectContent>
                    </Select>
                    {renderError("organization")}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Student Name *</h3>
                    <Input 
                      placeholder="(Last Name, First Name M.I.)"
                      value={formData.studentName}
                      onChange={(e) => handleInputChange("studentName", e.target.value)}
                    />
                    {renderError("studentName")}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Student Position *</h3>
                    <Input 
                      placeholder="(Chairperson, Secretary, etc.)"
                      value={formData.studentPosition}
                      onChange={(e) => handleInputChange("studentPosition", e.target.value)}
                    />
                    {renderError("studentPosition")}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Student Contact Number *</h3>
                    <Input 
                      placeholder="(09xxxxxxxx)"
                      value={formData.studentContact}
                      onChange={(e) => handleInputChange("studentContact", e.target.value)}
                    />
                    {renderError("studentContact")}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Activity Name *</h3>
                    <Input 
                      placeholder="(Mass Orientation, Welcome Party, etc.)"
                      value={formData.activityName}
                      onChange={(e) => handleInputChange("activityName", e.target.value)}
                    />
                    {renderError("activityName")}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Activity Description *</h3>
                    <Textarea 
                      placeholder="Enter activity description"
                      value={formData.activityDescription}
                      onChange={(e) => handleInputChange("activityDescription", e.target.value)}
                      className="min-h-[100px]"
                    />
                    {renderError("activityDescription")}
                  </div>
                </div>
              </div>
            )}

            {/* Date Information Section */}
            {currentSection === "date-information" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Start Date *</h3>
                    <Input 
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange("startDate", e.target.value)}
                    />
                    {renderError("startDate")}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">End Date *</h3>
                    <Input 
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange("endDate", e.target.value)}
                    />
                    {renderError("endDate")}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Start Time *</h3>
                    <Input 
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange("startTime", e.target.value)}
                    />
                    {renderError("startTime")}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">End Time *</h3>
                    <Input 
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange("endTime", e.target.value)}
                    />
                    {renderError("endTime")}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Venue *</h3>
                    <Input 
                      placeholder="Enter venue"
                      value={formData.venue}
                      onChange={(e) => handleInputChange("venue", e.target.value)}
                    />
                    {renderError("venue")}
                  </div>
                </div>
              </div>
            )}

            {/* Specifications Section */}
            {currentSection === "specifications" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Activity Type *</h3>
                    <Select 
                      value={formData.activityType}
                      onValueChange={(value) => handleInputChange("activityType", value)}
                    >
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
                    {renderError("activityType")}
                    
                    {formData.activityType === "others" && (
                      <div className="mt-3">
                        <Input 
                          placeholder="Please specify"
                          value={formData.otherActivityType}
                          onChange={(e) => handleInputChange("otherActivityType", e.target.value)}
                        />
                        {renderError("otherActivityType")}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Sustainable Development Goals *</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {sdgOptions.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={option.id}
                            checked={formData.sdgs[option.id] || false}
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
                    {renderError("sdgs")}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Will you be charging fees? *</h3>
                    <RadioGroup 
                      value={formData.chargingFees}
                      onValueChange={(value) => handleInputChange("chargingFees", value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="chargingFees-yes" />
                        <label htmlFor="chargingFees-yes">Yes</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="chargingFees-no" />
                        <label htmlFor="chargingFees-no">No</label>
                      </div>
                    </RadioGroup>
                    {renderError("chargingFees")}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Is this off-campus? *</h3>
                    <RadioGroup 
                      value={formData.isOffCampus}
                      onValueChange={(value) => handleInputChange("isOffCampus", value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="isOffCampus-yes" />
                        <label htmlFor="isOffCampus-yes">Yes</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="isOffCampus-no" />
                        <label htmlFor="isOffCampus-no">No</label>
                      </div>
                    </RadioGroup>
                    {renderError("isOffCampus")}
                  </div>
                </div>
              </div>
            )}

            {/* Submission Section */}
            {currentSection === "submission" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
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

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Review your submission</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <p><strong>Organization:</strong> {formData.organization}</p>
                      <p><strong>Activity Name:</strong> {formData.activityName}</p>
                      <p><strong>Date:</strong> {formData.startDate} to {formData.endDate}</p>
                      <p><strong>Time:</strong> {formData.startTime} to {formData.endTime}</p>
                      <p><strong>Venue:</strong> {formData.venue}</p>
                    </div>
                  </div>

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
            {currentSection !== "general-information" && (
              <Button
                type="button"
                variant="outline"
                className="border-[#7B1113] text-[#7B1113]"
                onClick={handlePrevious}
              >
                Previous
              </Button>
            )}
            {currentSection !== "submission" && (
              <Button
                type="button"
                className="bg-[#7B1113] hover:bg-[#5e0d0e] ml-auto"
                onClick={handleNext}
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