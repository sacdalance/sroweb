// routes/adminOrgApplicationsRoutes.js
import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

router.post("/update-status", async (req, res) => {
  const { recognition_id, is_recognized } = req.body;

  if (!recognition_id || typeof is_recognized !== "boolean") {
    return res.status(400).json({ error: "Missing or invalid data." });
  }

  try {
    const { error } = await supabase
      .from("org_recognition")
      .update({
        is_recognized,
        org_status: is_recognized ? "Recognized" : "Declined",
        approved_at: is_recognized ? new Date().toISOString() : null,
      })
      .eq("recognition_id", recognition_id);

    if (error) throw error;

    res.status(200).json({ message: "Status updated successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
