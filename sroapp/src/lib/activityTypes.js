// Canonical activity type display labels (short form for admin views, calendars, dialogs)
export const categoryMap = {
  charitable: "Charitable",
  serviceWithinUPB: "Service (within UPB)",
  serviceOutsideUPB: "Service (outside UPB)",
  contestWithinUPB: "Contest (within UPB)",
  contestOutsideUPB: "Contest (outside UPB)",
  educational: "Educational",
  incomeGenerating: "Income-Generating Project",
  massOrientation: "Mass Orientation/General Assembly",
  booth: "Booth",
  rehearsals: "Rehearsals/Preparation",
  specialEvents: "Special Events",
  others: "Others",
};

// Activity type options for admin/display dropdowns (short labels)
export const activityTypeOptions = Object.entries(categoryMap).map(
  ([id, label]) => ({ id, label })
);

// Activity type options for student-facing forms (descriptive labels)
export const activityTypeFormOptions = [
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
  { id: "others", label: "Others" },
];

// Tailwind color classes for activity type badges/chips
export const activityTypeColors = {
  charitable: { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-300" },
  serviceWithinUPB: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  serviceOutsideUPB: { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-300" },
  contestWithinUPB: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
  contestOutsideUPB: { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-300" },
  educational: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300" },
  incomeGenerating: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  massOrientation: { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-300" },
  booth: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
  rehearsals: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
  specialEvents: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-300" },
  others: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
};

// Tailwind dot colors for mobile calendar view
export const dotColorMap = {
  charitable: "bg-pink-400",
  serviceWithinUPB: "bg-blue-400",
  serviceOutsideUPB: "bg-cyan-400",
  contestWithinUPB: "bg-purple-400",
  contestOutsideUPB: "bg-violet-400",
  educational: "bg-emerald-400",
  incomeGenerating: "bg-amber-400",
  massOrientation: "bg-indigo-400",
  booth: "bg-orange-400",
  rehearsals: "bg-slate-400",
  specialEvents: "bg-rose-400",
  others: "bg-gray-400",
};
