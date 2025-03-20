import { useState } from "react";

const OrgRecognition = () => {
    const [selectedOption, setSelectedOption] = useState("Annual Report");
    const [files, setFiles] = useState([]);

    const handleOptionChange = (e) => {
        setSelectedOption(e.target.value);
        setFiles([]); // Clear files when changing option
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here you would implement the actual file submission logic
        // For example, send files to a server using fetch or axios
        console.log("Files to submit:", files);
        alert("Files submitted successfully!");
        setFiles([]);
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 text-center">Organization Recognition</h1>
            
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-4">
                    <label htmlFor="submissionType" className="block text-sm font-medium mb-2">
                        Submission Type
                    </label>
                    <select
                        id="submissionType"
                        value={selectedOption}
                        onChange={handleOptionChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="Annual Report">Annual Report</option>
                        <option value="Organization Recognition">Organization Recognition</option>
                    </select>
                </div>

                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Required Forms:</h2>
                    {selectedOption === "Annual Report" ? (
                        <ul className="list-disc pl-6 mb-4 space-y-1">
                            <li>Revised OSA Form D: Report on Past Activities, including partnerships</li>
                            <li>Financial Report (Form F), AY 202X-202X</li>
                        </ul>
                    ) : (
                        <ul className="list-disc pl-6 mb-4 space-y-1">
                            <li>Revised OSA Form A: Application for Student Organization Recognition</li>
                            <li>OSA Form B1: Officer Roster</li>
                            <li>OSA Form B2: Member Roster</li>
                            <li>OSA Form C: Officer Data</li>
                            <li>Revised OSA Form E: Proposed Activities for AY 2025-2026</li>
                        </ul>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 text-center">
                        <label htmlFor="fileUpload" className="cursor-pointer block">
                            <div className="mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">Drag and drop your files here or click to browse</p>
                            <p className="text-xs text-gray-500">Only PDF files are accepted</p>
                            <input
                                id="fileUpload"
                                type="file"
                                accept=".pdf"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
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

                    <button
                        type="submit"
                        disabled={files.length === 0}
                        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                            files.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        Submit Files
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OrgRecognition;