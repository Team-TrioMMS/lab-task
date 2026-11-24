import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminPage from "../components/AdminPage.jsx";
import { api } from "../services/api.js";

const links = [
  { to: "/admin/requests", title: "Review requests", icon: "bi-inbox", text: "Approve, reject, and prioritize student requests." },
  { to: "/admin/schedule", title: "Equipment schedule", icon: "bi-calendar-week", text: "Generate and inspect daily or weekly schedules." },
  { to: "/admin/manage-schedule", title: "Manage schedule", icon: "bi-arrow-left-right", text: "Move bookings or add a research reservation." },
  { to: "/admin/equipment", title: "Equipment", icon: "bi-tools", text: "Manage equipment and its current status." },
  { to: "/admin/maintenance", title: "Maintenance", icon: "bi-wrench-adjustable", text: "Record breakdowns and track maintenance." }
];

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getAllBookings(), api.getEquipment(), api.getMaintenance()])
      .then(([allBookings, allEquipment, maintenanceRecords]) => {
        setBookings(allBookings);
        setEquipment(allEquipment);
        setMaintenance(maintenanceRecords);
      })
      .catch((cause) => setError(cause.message));
  }, []);

  const stats = [
    ["Pending requests", bookings.filter((booking) => booking.status === "Pending").length, "bi-hourglass-split", "stat-yellow"],
    ["Scheduled bookings", bookings.filter((booking) => booking.scheduledStart).length, "bi-calendar-check", "stat-green"],
    ["Equipment items", equipment.length, "bi-tools", "stat-blue"],
    ["Active maintenance", maintenance.filter((item) => item.status === "active").length, "bi-wrench-adjustable", "stat-yellow"]
  ];

  return (
    <AdminPage eyebrow="LAB ADMINISTRATION" title="Admin dashboard" description="Review requests and keep laboratory equipment schedules conflict-free.">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="row g-3 mb-4">
        {stats.map(([label, value, icon, color]) => (
          <div className="col-md-6 col-xl-3" key={label}>
            <div className="stat-card">
              <div><p className="text-secondary mb-1">{label}</p><h3 className="fw-bold mb-0">{value}</h3></div>
              <div className={`stat-icon ${color}`}><i className={`bi ${icon}`} /></div>
            </div>
          </div>
        ))}
      </div>
      <div className="row g-3">
        {links.map((item) => (
          <div className="col-md-6 col-xl-4" key={item.to}>
            <Link to={item.to} className="admin-action-card">
              <span className="admin-action-icon"><i className={`bi ${item.icon}`} /></span>
              <span><strong>{item.title}</strong><span className="d-block text-secondary small mt-1">{item.text}</span></span>
              <i className="bi bi-arrow-up-right ms-auto text-secondary" />
            </Link>
          </div>
        ))}
      </div>
    </AdminPage>
  );
}
