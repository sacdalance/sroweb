import { z } from "zod";

// --- REUSABLE VALIDATORS ---
// Strict regex matching sanitizeInput: /[^a-zA-Z0-9\s.,!?:'"()\-@]/g
const safeStringRegex = /^[a-zA-Z0-9\s.,!?:'"()\-@]*$/;
const safeStringMultilineRegex = /^[a-zA-Z0-9\s.,!?:'"()\-@\n]*$/;

const emailSchema = (customMessage) =>
    z.string()
        .email(customMessage || "Invalid email address")
        .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email format");

// Phone: Matches 09xxxxxxxxx (Philippines mobile)
const phoneSchema = z.string().regex(/^09\d{9}$/, "Must be a valid PH mobile number (e.g., 09123456789)");

// Names: 3-50 chars, safe characters only
const nameSchema = z.string()
    .min(3, "Must be at least 3 characters")
    .max(50, "Must be under 50 characters")
    .regex(safeStringRegex, "Contains invalid characters");

// Org Names: 3-100 chars, safe characters only
const orgNameSchema = z.string()
    .min(3, "Must be at least 3 characters")
    .max(100, "Must be under 100 characters")
    .regex(safeStringRegex, "Contains invalid characters");


// --- 1. APPOINTMENT BOOKING SCHEMA ---
export const appointmentSchema = z.object({
    reason: z.string().min(1, "Please select a reason").regex(safeStringRegex, "Invalid characters"),
    subject: z.string().min(1, "Subject is required").regex(safeStringRegex, "Invalid characters"),
    mode: z.enum(["face-to-face", "online"], { errorMap: () => ({ message: "Please select a meeting mode" }) }),
    email: emailSchema(),
    contact: phoneSchema,
    date: z.date({ required_error: "Date is required", invalid_type_error: "Date is required" }),
    time: z.string().min(1, "Time is required"),
    notes: z.string().regex(safeStringMultilineRegex, "Invalid characters").optional()
});


// --- 2. ORG APPLICATION SCHEMA ---
export const orgApplicationSchema = z.object({
    orgName: orgNameSchema,
    orgType: z.string().min(1, "Organization Type is required"),
    academicYear: z.string().min(1, "Academic Year is required"),
    orgEmail: emailSchema("Invalid Organization Email"),

    chairperson: nameSchema,
    chairpersonEmail: emailSchema("Invalid Chairperson Email"),

    adviser: nameSchema,
    adviserEmail: emailSchema("Invalid Adviser Email"),

    // Co-Adviser is optional, but if entered, must be valid
    coAdviser: z.string().optional().refine(val => !val || val.trim() === "" || (val.length >= 3 && val.length <= 50 && safeStringRegex.test(val)), {
        message: "Must be 3 to 50 characters and use safe characters"
    }),
    coAdviserEmail: z.string().optional().refine(val => !val || val.trim() === "" || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val), {
        message: "Invalid email format"
    }),

    // Files: exactly 6
    files: z.array(z.any()).length(6, "Please upload exactly 6 PDF files"),
});


// --- 3. ANNUAL REPORT SCHEMA ---
export const annualReportSchema = z.object({
    org: z.string().min(1, "Please select an organization"),
    academicYear: z.string().min(1, "Please select an academic year"),
    files: z.array(z.any()).length(2, "Please upload exactly 2 PDF files"),
});


// --- 4. ACTIVITY FORM SCHEMA ---
export const activityFormSchema = z.object({
    // General Info
    selectedValue: z.string().min(1, "Please select your organization").regex(safeStringRegex, "Invalid characters"), // orgSelect
    studentPosition: z.string().min(3, "Student Position must be between 3 to 50 characters").max(50, "Student Position must be between 3 to 50 characters").regex(safeStringRegex, "Invalid characters"),
    studentContact: z.string().regex(/^\d{11}$/, "Student Contact must be an 11-digit number"), // ActivityForm expects 11 digits, strictly numbers (no 09 specific regex in original but implied? Original regex was /^\d{11}$/)
    activityName: z.string().min(3, "Activity Name must be 3–100 characters").max(100, "Activity Name must be 3–100 characters").regex(safeStringRegex, "Invalid characters"),
    activityDescription: z.string().min(20, "Description must be at least 20 characters").regex(safeStringMultilineRegex, "Invalid characters"),
    selectedActivityType: z.string().min(1, "Please select an activity type").regex(safeStringRegex, "Invalid characters"),

    // SDGs: Check if at least one value is true
    selectedSDGs: z.record(z.boolean()).refine((obj) => Object.values(obj).some(Boolean), "Select at least one SDG goal"),

    chargingFees1: z.string().min(1, "Please indicate if you're charging fees").regex(safeStringRegex, "Invalid characters"),
    partnering: z.string().min(1, "Please indicate if you're partnering with a unit").regex(safeStringRegex, "Invalid characters"),

    // Date Info
    recurring: z.string().min(1, "Please indicate if activity is recurring").regex(safeStringRegex, "Invalid characters"),
    startDate: z.string().min(1, "Start date is required"),
    // Note: Date logic (past checks, business days) often better in refine or component due to 'today' dependency complexity, but we can try simple checks here.
    // We'll leave complex date comparisons (business days) to the component or a superRefine, but simple structure checks here.

    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),

    // Conditional: Recurring
    endDate: z.string().optional(),
    recurringDays: z.record(z.boolean()).optional(),

    // Specifications
    isOffCampus: z.string().min(1, "Please indicate if off-campus").regex(safeStringRegex, "Invalid characters"),
    venue: z.string().min(1, "Venue is required").max(100, "Venue must be under 100 characters").regex(safeStringRegex, "Invalid characters"),

    // Conditional: Off-Campus Fields
    venueApprover: z.string().regex(safeStringRegex, "Invalid characters").optional().or(z.literal('')),
    venueApproverContact: z.string().optional(), // regex check in superRefine

    // Conditional: Partnering Fields
    partnerDescription: z.string().regex(safeStringMultilineRegex, "Invalid characters").optional().or(z.literal('')),
    selectedPublicAffairs: z.any().optional(), // Complex nested object, refined below

    greenCampusMonitor: z.string().min(3, "Monitor name must be 3–50 characters").max(50, "Monitor name must be 3–50 characters").regex(safeStringRegex, "Invalid characters"),
    greenCampusMonitorContact: z.string().regex(/^09\d{9}$|^[^@]+@(up\.edu\.ph|gmail\.com)$/, "Provide valid phone or UP/Gmail email"),

    // Submission
    selectedFile: z.any().refine((file) => file instanceof File || (file && file.name), "Please upload your Activity Request PDF"),
    appealReason: z.string().regex(safeStringMultilineRegex, "Invalid characters").optional().or(z.literal('')),
}).superRefine((data, ctx) => {
    // DATE LOGIC
    if (data.startDate) {
        const chosen = new Date(data.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        chosen.setHours(0, 0, 0, 0);
        if (chosen < today) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Start date cannot be in the past", path: ["startDate"] });
        }
    }

    if (data.recurring === "recurring") {
        if (!data.endDate) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End date is required", path: ["endDate"] });
        } else if (data.startDate && new Date(data.endDate) < new Date(data.startDate)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End date cannot be before start date", path: ["endDate"] });
        }

        if (!data.recurringDays || !Object.values(data.recurringDays).some(Boolean)) {
            // path: recurringDays
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select at least one recurring day", path: ["recurringDays"] });
        }
    }

    // OFF CAMPUS LOGIC
    if (data.isOffCampus !== "yes") {
        // Required fields if NOT off campus
        if (!data.venueApprover || data.venueApprover.length < 3 || data.venueApprover.length > 50) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Approver name must be 3–50 characters", path: ["venueApprover"] });
        }
        if (!data.venueApproverContact || !/^09\d{9}$|^[^@]+@(up\.edu\.ph|gmail\.com)$/.test(data.venueApproverContact)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provide valid phone or UP/Gmail email", path: ["venueApproverContact"] });
        }
    }

    // PARTNERING LOGIC
    if (data.partnering === "yes") {
        if (!data.partnerDescription || data.partnerDescription.trim().length < 3) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provide partner role description (min 3 chars)", path: ["partnerDescription"] });
        }

        // Check partners
        const hasPartner = data.selectedPublicAffairs && Object.values(data.selectedPublicAffairs).some((val) =>
            Array.isArray(val) ? val.some((v) => v.trim() !== "") : val === true
        );
        if (!hasPartner) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select at least one partner", path: ["partnerUnits"] }); // "partnerUnits" alias for error key
        }
    }
});
