// src/api/orgApplicationAPI.js

export const submitOrgApplication = async ({
  org_name,
  academic_year,
  org_email,
  org_chairperson,
  chairperson_email,
  org_adviser,
  adviser_email,
  org_coadviser,
  coadviser_email,
  org_type,
  org_status,
  submitted_by,
  files,
  }) => {
    // Validate file count
    if (files.length !== 6) {
      throw new Error("Exactly 6 PDF files must be uploaded.");
    }
  
    // Create form data
    const formData = new FormData();
    formData.append("org_name", org_name);
    formData.append("academic_year", academic_year);
    formData.append("org_email", org_email);
    formData.append("org_chairperson", org_chairperson);
    formData.append("chairperson_email", chairperson_email);
    formData.append("org_adviser", org_adviser);
    formData.append("adviser_email", adviser_email);
    formData.append("org_coadviser", org_coadviser);
    formData.append("coadviser_email", coadviser_email);
    formData.append("org_type", org_type); // ✅ renamed
    formData.append("org_status", org_status);
    formData.append("submitted_by", submitted_by);
  
    // Attach all 6 PDF files
    files.forEach((file) => formData.append("files", file));
  
    // Send to backend
    const response = await fetch("/api/orgApplication", {
      method: "POST",
      body: formData,
    });
  
    // Handle errors
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit organization application.");
    }
  
    return await response.json();
  };
  