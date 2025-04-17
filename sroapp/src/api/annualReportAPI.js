// annualReportAPI.js

export const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organization/list");
      if (!response.ok) throw new Error("Failed to fetch organization list");
      return await response.json();
    } catch (err) {
      console.error("fetchOrganizations error:", err);
      throw err;
    }
  };
  
  export const uploadAnnualReportFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "Annual Reports");
    formData.append("submissionType", "Annual Report");
  
    try {
      const response = await fetch("/api/upload-to-drive", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload file to Google Drive");
      return await response.json();
    } catch (err) {
      console.error("uploadAnnualReportFile error:", err);
      throw err;
    }
  };