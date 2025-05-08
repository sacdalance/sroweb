/*
  }) => {
    if (files.length !== 2) {
      throw new Error("You must upload exactly 2 PDF files.");
    }
  
    const formData = new FormData();
    formData.append("org_id", org_id);
    formData.append("submitted_by", submitted_by);
    formData.append("academic_year", academic_year);
    files.forEach((file) => formData.append("files", file)); // send as "files"
  
    try {
      const response = await fetch("/api/annual-report", {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) throw new Error("Failed to submit annual report");
      return await response.json();
    } catch (err) {
      console.error("submitAnnualReport error:", err);
      throw err;
    }
  };
  */
