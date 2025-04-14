import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const OrgApplication = () => {
    const navigate = useNavigate();
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [showInterviewPrompt, setShowInterviewPrompt] = useState(false);

    // Form state for Organization Application
    const [orgName, setOrgName] = useState("");
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
        // This is a placeholder for the actual Google Drive API implementation
        // In a real application, you would use the Google Drive API client library
        
        try {
            // Create FormData object for the file
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', "Organization Recognition");
            formData.append('submissionType', "Organization Application");
            
            // Send the file to your backend, which will handle Google Drive authentication and upload
            const response = await fetch('/api/upload-to-drive', {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) {
                throw new Error('Failed to upload file to Google Drive');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error uploading to Google Drive:', error);
            throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (files.length === 0) return;
        
        setIsUploading(true);
        setUploadStatus("Uploading files to Google Drive...");
        
        try {
            // Upload each file to Google Drive
            const uploadPromises = files.map(file => uploadToGoogleDrive(file));
            await Promise.all(uploadPromises);
            
            // Show interview prompt for Organization Application
            setShowInterviewPrompt(true);
            
            setFiles([]);
        } catch (error) {
            console.error("Error during upload:", error);
            setUploadStatus("Error uploading files. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleInterviewResponse = (response) => {
        setShowInterviewPrompt(false);
        
        if (response) {
            // Navigate to appointment booking page
            navigate("/appointment-booking");
        } else {
            // Show success message
            setUploadStatus("Submission Sent! Your files have been successfully uploaded.");
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 text-center">Organization Application</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Organization Application</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="orgName" className="text-sm font-medium">
                                    Organization Name
                                </label>
                                <Input
                                    id="orgName"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    placeholder="Samahan ng Organisasyon UPB (SO - UPB)"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label htmlFor="orgEmail" className="text-sm font-medium">
                                    Organization E-mail
                                </label>
                                <Input
                                    type="email"
                                    id="orgEmail"
                                    value={orgEmail}
                                    onChange={(e) => setOrgEmail(e.target.value)}
                                    placeholder="orgemail@gmail.com"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label htmlFor="chairperson" className="text-sm font-medium">
                                    Organization Chairperson/President
                                </label>
                                <Input
                                    id="chairperson"
                                    value={chairperson}
                                    onChange={(e) => setChairperson(e.target.value)}
                                    placeholder="DEL PILAR, Marcelo H."
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label htmlFor="chairpersonEmail" className="text-sm font-medium">
                                    E-mail of Chairperson/President
                                </label>
                                <Input
                                    type="email"
                                    id="chairpersonEmail"
                                    value={chairpersonEmail}
                                    onChange={(e) => setChairpersonEmail(e.target.value)}
                                    placeholder="delpilarrh@up.edu.ph"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label htmlFor="adviser" className="text-sm font-medium">
                                    Adviser
                                </label>
                                <Input
                                    id="adviser"
                                    value={adviser}
                                    onChange={(e) => setAdviser(e.target.value)}
                                    placeholder="DEL PILAR, Marcelo H."
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label htmlFor="adviserEmail" className="text-sm font-medium">
                                    Adviser E-mail
                                </label>
                                <Input
                                    type="email"
                                    id="adviserEmail"
                                    value={adviserEmail}
                                    onChange={(e) => setAdviserEmail(e.target.value)}
                                    placeholder="delpilarrh@up.edu.ph"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label htmlFor="coAdviser" className="text-sm font-medium">
                                    Co-Adviser
                                </label>
                                <Input
                                    id="coAdviser"
                                    value={coAdviser}
                                    onChange={(e) => setCoAdviser(e.target.value)}
                                    placeholder="DEL PILAR, Marcelo H."
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label htmlFor="coAdviserEmail" className="text-sm font-medium">
                                    Co-Adviser E-mail
                                </label>
                                <Input
                                    type="email"
                                    id="coAdviserEmail"
                                    value={coAdviserEmail}
                                    onChange={(e) => setCoAdviserEmail(e.target.value)}
                                    placeholder="delpilarrh@up.edu.ph"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Required Forms</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 mb-6">
                            <li className="flex justify-between items-center">
                                <span>Revised OSA Form A: Application for Student Organization Recognition</span>
                                <Button variant="outline" size="sm" className="h-7">Download</Button>
                            </li>
                            <li className="flex justify-between items-center">
                                <span>OSA Form B1: Officer Roster</span>
                                <Button variant="outline" size="sm" className="h-7">Download</Button>
                            </li>
                            <li className="flex justify-between items-center">
                                <span>OSA Form B2: Member Roster</span>
                                <Button variant="outline" size="sm" className="h-7">Download</Button>
                            </li>
                            <li className="flex justify-between items-center">
                                <span>OSA Form C: Officer Data</span>
                                <Button variant="outline" size="sm" className="h-7">Download</Button>
                            </li>
                            <li className="flex justify-between items-center">
                                <span>Revised OSA Form E: Proposed Activities for AY 2025-2026</span>
                                <Button variant="outline" size="sm" className="h-7">Download</Button>
                            </li>
                        </ul>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 text-center">
                                <label htmlFor="orgAppFileUpload" className="cursor-pointer block">
                                    <div className="mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Drag and Drop or Upload File</p>
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
                                <div className="mb-4">
                                    <h3 className="text-sm font-medium mb-2">Selected Files:</h3>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        {files.map((file, index) => (
                                            <li key={index} className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                {file.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {uploadStatus && (
                                <div className={`mb-4 p-3 rounded-md ${
                                    uploadStatus.includes("successfully") || uploadStatus.includes("Submission Sent")
                                    ? "bg-green-100 text-green-800" 
                                    : uploadStatus.includes("Error") 
                                    ? "bg-red-100 text-red-800" 
                                    : "bg-blue-100 text-blue-800"
                                }`}>
                                    {uploadStatus}
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={files.length === 0 || isUploading}
                                variant={files.length === 0 || isUploading ? "outline" : "default"}
                            >
                                {isUploading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Uploading...
                                    </span>
                                ) : "Submit Form"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
            
            <Dialog open={showInterviewPrompt} onOpenChange={setShowInterviewPrompt}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-center">Submission Sent</DialogTitle>
                        <DialogDescription className="text-center">
                            Schedule An Interview?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-center gap-4">
                        <Button 
                            onClick={() => handleInterviewResponse(true)}
                            variant="default"
                        >
                            Yes
                        </Button>
                        <Button 
                            onClick={() => handleInterviewResponse(false)}
                            variant="destructive"
                        >
                            No
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OrgApplication; 