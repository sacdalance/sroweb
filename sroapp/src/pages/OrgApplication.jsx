import { useState } from "react";
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
import { FileText, UploadCloud, Loader2, ChevronDown, Check } from "lucide-react";
import { toast, Toaster } from "sonner";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const OrgApplication = () => {

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
  ]
  
  const academicYearsList = ["2024-2025", "2025-2026", "2026-2027", "2027-2028"]
  
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [showInterviewPrompt, setShowInterviewPrompt] = useState(false);

  const [orgName, setOrgName] = useState("");
  
  const [orgTypeOpen, setOrgTypeOpen] = useState(false)
  const [orgType, setOrgType] = useState("")
  const [selectedOrgTypeName, setSelectedOrgTypeName] = useState("")
  const [orgTypeSearch, setOrgTypeSearch] = useState("")

  const [yearOpen, setYearOpen] = useState(false)
  const [academicYear, setAcademicYear] = useState("") // ✅ this is what was missing
  const [selectedYear, setSelectedYear] = useState("")
  const [yearSearch, setYearSearch] = useState("")
  
  const filteredCategories = categoriesList.filter((cat) =>
    cat.name.toLowerCase().includes(orgTypeSearch.toLowerCase())
  )

  const filteredYears = academicYearsList.filter((year) =>
    year.toLowerCase().includes(yearSearch.toLowerCase())
  )  

  const [orgEmail, setOrgEmail] = useState("");
  const [chairperson, setChairperson] = useState("");
  const [chairpersonEmail, setChairpersonEmail] = useState("");
  const [adviser, setAdviser] = useState("");
  const [adviserEmail, setAdviserEmail] = useState("");
  const [coAdviser, setCoAdviser] = useState("");
  const [coAdviserEmail, setCoAdviserEmail] = useState("");

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setUploadStatus(null);
  };

  const uploadToGoogleDrive = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "Organization Recognition");
      formData.append("submissionType", "Organization Application");

      const response = await fetch("/api/upload-to-drive", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload file to Google Drive");

      return await response.json();
    } catch (error) {
      console.error("Error uploading to Google Drive:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error("Please upload at least one file.");
      return;
    }
    setIsUploading(true);
    toast.loading("Uploading your files...");

    try {
      const uploadPromises = files.map((file) => uploadToGoogleDrive(file));
      await Promise.all(uploadPromises);
      toast.success("Files uploaded successfully.");
      setShowInterviewPrompt(true);
      setFiles([]);
    } catch (error) {
      console.error("Error during upload:", error);
      toast.error("Error uploading files. Please try again.");
      setUploadStatus("Error uploading files. Please try again.");
    } finally {
      toast.dismiss();
      setIsUploading(false);
    }
  };

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Toaster />
      <h1 className="text-3xl font-semibold mb-8 text-center">Organization Application</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium block mb-1">Organization Name</label>
            <Input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Samahan ng Organisasyon UPB (SO - UPB)"
            />
          </div>

          {/* Organization Type */}
          <div>
            <h3 className="text-sm font-medium mb-2">
              Organization Type <span className="text-red-500">*</span>
            </h3>

            <Popover open={orgTypeOpen} onOpenChange={setOrgTypeOpen}>
              <PopoverTrigger asChild>
                <div
                  role="combobox"
                  aria-expanded={orgTypeOpen}
                  className="w-full flex items-center justify-between border border-input bg-transparent rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring hover:border-gray-400"
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
                          setOrgType(cat.id)
                          setSelectedOrgTypeName(cat.name)
                          setOrgTypeSearch(cat.name)
                          setOrgTypeOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                          orgType === cat.id ? "bg-gray-100 font-medium" : ""
                        }`}
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
          </div>

          {/* Academic Year */}
          <div>
            <h3 className="text-sm font-medium mb-2">
              Academic Year <span className="text-red-500">*</span>
            </h3>

            <Popover open={yearOpen} onOpenChange={setYearOpen}>
              <PopoverTrigger asChild>
                <div
                  role="combobox"
                  aria-expanded={yearOpen}
                  className="w-full flex items-center justify-between border border-input bg-transparent rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring hover:border-gray-400"
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
                          setAcademicYear(year)
                          setSelectedYear(year)
                          setYearSearch(year)
                          setYearOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                          academicYear === year ? "bg-gray-100 font-medium" : ""
                        }`}
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
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Organization E-mail</label>
            <Input
              type="email"
              value={orgEmail}
              onChange={(e) => setOrgEmail(e.target.value)}
              placeholder="orgemail@gmail.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Organization Chairperson/President</label>
            <Input
              type="text"
              value={chairperson}
              onChange={(e) => setChairperson(e.target.value)}
              placeholder="DEL PILAR, Marcelo H."
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">E-mail of Chairperson/President</label>
            <Input
              type="email"
              value={chairpersonEmail}
              onChange={(e) => setChairpersonEmail(e.target.value)}
              placeholder="delpilarmh@up.edu.ph"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Adviser</label>
            <Input
              type="text"
              value={adviser}
              onChange={(e) => setAdviser(e.target.value)}
              placeholder="DEL PILAR, Marcelo H."
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Adviser E-mail</label>
            <Input
              type="email"
              value={adviserEmail}
              onChange={(e) => setAdviserEmail(e.target.value)}
              placeholder="delpilarmh@up.edu.ph"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Co-Adviser</label>
            <Input
              type="text"
              value={coAdviser}
              onChange={(e) => setCoAdviser(e.target.value)}
              placeholder="DEL PILAR, Marcelo H."
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Co-Adviser E-mail</label>
            <Input
              type="email"
              value={coAdviserEmail}
              onChange={(e) => setCoAdviserEmail(e.target.value)}
              placeholder="delpilarmh@up.edu.ph"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Required Forms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Revised OSA Form A: Application for Student Organization Recognition", "OSA Form B1: Officer Roster", "OSA Form B2: Member Roster", "OSA Form C: Officer Data", "Revised OSA Form E: Proposed Activities for AY 2025-2026"].map((form, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{form}</span>
                <Button variant="outline" size="sm">Download</Button>
              </div>
            ))}

            <div className="border-2 border-dashed border-gray-300 p-4 rounded-md text-center">
              <label htmlFor="orgAppFileUpload" className="cursor-pointer flex flex-col items-center">
                <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm">Drag and Drop or Upload File</p>
                <input
                  id="orgAppFileUpload"
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>

            {files.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Selected Files</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {files.map((file, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-500" />
                      {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={files.length === 0 || isUploading}
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
      </form>

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
            <Button variant="destructive" onClick={() => handleInterviewResponse(false)}>No</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgApplication;