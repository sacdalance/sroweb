import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const AnnualReport = () => {
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);

    // Form state for Annual Report
    const [selectedOrg, setSelectedOrg] = useState("");
    const [annualReportEmail, setAnnualReportEmail] = useState("");

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
            formData.append('folder', "Annual Reports");
            formData.append('submissionType', "Annual Report");
            
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
            
            // Show success message for Annual Report
            setUploadStatus("Submission Sent! Your files have been successfully uploaded.");
            
            setFiles([]);
        } catch (error) {
            console.error("Error during upload:", error);
            setUploadStatus("Error uploading files. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 text-center">Annual Report</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Annual Report</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="selectedOrg" className="text-sm font-medium">
                                Organization Name
                            </label>
                            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                                <SelectTrigger id="selectedOrg">
                                    <SelectValue placeholder="Select your Organization" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="org1">Samahan ng Organisasyon UPB (SO - UPB)</SelectItem>
                                    <SelectItem value="org2">Computer Science Society (CSS)</SelectItem>
                                    <SelectItem value="org3">UP Aguman (UPA)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <label htmlFor="annualReportEmail" className="text-sm font-medium">
                                Organization E-mail
                            </label>
                            <Input 
                                type="email" 
                                id="annualReportEmail" 
                                value={annualReportEmail}
                                onChange={(e) => setAnnualReportEmail(e.target.value)}
                                placeholder="orgemail@gmail.com"
                            />
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
                                <span>Revised OSA Form D: Report on Past Activities, including partnerships</span>
                                <Button variant="outline" size="sm" className="h-7">Download</Button>
                            </li>
                            <li className="flex justify-between items-center">
                                <span>Financial Report (Form F), AY 202X-202X</span>
                                <Button variant="outline" size="sm" className="h-7">Download</Button>
                            </li>
                        </ul>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 text-center">
                                <label htmlFor="annualReportFileUpload" className="cursor-pointer block">
                                    <div className="mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Drag and Drop or Upload File</p>
                                    <input
                                        id="annualReportFileUpload"
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
        </div>
    );
};

export default AnnualReport; 