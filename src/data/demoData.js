export const demoEquipment = [
  { id: 1, name: "Digital Microscope", category: "Microscope", description: "High-resolution microscope for sample observation and imaging.", status: "Available", location: "Lab Room 301", icon: "bi-microscope" },
  { id: 2, name: "High-Speed Centrifuge", category: "Centrifuge", description: "Laboratory centrifuge for separating sample components.", status: "Available", location: "Lab Room 302", icon: "bi-fan" },
  { id: 3, name: "UV-Vis Spectrophotometer", category: "Spectrophotometer", description: "Measures absorbance and transmission of samples.", status: "Available", location: "Lab Room 303", icon: "bi-activity" }
];

export const initialBookings = [
  { id: "LB-1001", equipmentId: 1, equipmentName: "Digital Microscope", date: "2026-11-26", startTime: "10:00", durationMinutes: 180, deadline: "2026-11-27", urgency: "High", purpose: "Observe prepared research samples", status: "Approved", createdAt: "2026-11-23" },
  { id: "LB-1002", equipmentId: 2, equipmentName: "High-Speed Centrifuge", date: "2026-11-28", startTime: "12:00", durationMinutes: 20, deadline: "2026-12-05", urgency: "Low", purpose: "Separate sample components", status: "Pending", createdAt: "2026-11-24" }
];
