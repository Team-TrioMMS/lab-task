import { useEffect, useState } from "react";
import AdminPage from "../components/AdminPage.jsx";
import { api } from "../services/api.js";

const initialBooking = { equipmentId: "", date: "", startTime: "", durationMinutes: "60", deadline: "", urgency: "medium", purpose: "" };

export default function ManageSchedule() {
  const [bookings, setBookings] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [bookingId, setBookingId] = useState("");
  const [override, setOverride] = useState({ scheduledEquipmentId: "", scheduledDate: "", scheduledStartTime: "" });
  const [personal, setPersonal] = useState(initialBooking);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    try {
      const [allBookings, items] = await Promise.all([api.getAllBookings(), api.getEquipment()]);
      setBookings(allBookings);
      setEquipment(items);
      setError("");
    } catch (cause) {
      setError(cause.message);
    }
  }
  useEffect(() => { load(); }, []);

  const selected = bookings.find((booking) => String(booking.id) === bookingId);
  function selectBooking(value) {
    const booking = bookings.find((item) => String(item.id) === value);
    setBookingId(value);
    setOverride({
      scheduledEquipmentId: String(booking?.equipmentId || ""),
      scheduledDate: booking?.date || "",
      scheduledStartTime: booking?.startTime || ""
    });
  }

  async function moveBooking(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      await api.updateBookingStatus(bookingId, selected?.status === "Pending" ? "approved" : "rescheduled", override);
      setNotice("Booking was moved and checked against all equipment and maintenance conflicts.");
      await load();
    } catch (cause) {
      setError(cause.message);
    }
  }

  async function addResearchBooking(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const booking = await api.createBooking(personal);
      try {
        await api.updateBookingStatus(booking.id, "approved", {
          scheduledDate: personal.date,
          scheduledStartTime: personal.startTime,
          scheduledEquipmentId: personal.equipmentId
        });
      } catch (cause) {
        await load();
        setError(`Research request #${booking.id} was saved but remains pending because it could not be scheduled: ${cause.message}`);
        return;
      }
      setNotice("Your research reservation was added to the equipment schedule.");
      setPersonal(initialBooking);
      await load();
    } catch (cause) {
      setError(cause.message);
    }
  }

  return (
    <AdminPage eyebrow="SCHEDULE CONTROL" title="Manage schedule" description="Manually move a request or place an administrator research reservation. Every change is checked for conflicts.">
      {error && <div className={`alert ${error.toLowerCase().includes("conflict") || error.includes("maintenance") ? "alert-warning" : "alert-danger"}`} role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      <div className="section-card mb-4">
        <h5 className="fw-bold mb-3">Manual schedule override</h5>
        <form className="row g-3" onSubmit={moveBooking}>
          <div className="col-md-6"><label className="form-label" htmlFor="override-booking">Booking request</label><select id="override-booking" className="form-select" required value={bookingId} onChange={(event) => selectBooking(event.target.value)}><option value="">Choose a request</option>{bookings.filter((booking) => ["Pending", "Approved", "Rescheduled"].includes(booking.status)).map((booking) => <option key={booking.id} value={booking.id}>#{booking.id} · {booking.userName || "Student"} · {booking.equipmentName} · {booking.date} {booking.startTime}</option>)}</select></div>
          <div className="col-md-6"><label className="form-label" htmlFor="override-equipment">Equipment</label><select id="override-equipment" className="form-select" required value={override.scheduledEquipmentId} onChange={(event) => setOverride({ ...override, scheduledEquipmentId: event.target.value })}><option value="">Choose equipment</option>{equipment.filter((item) => item.status !== "Maintenance").map((item) => <option key={item.id} value={item.id}>{item.name} · {item.status}</option>)}</select></div>
          <div className="col-md-4"><label className="form-label" htmlFor="override-date">New date</label><input id="override-date" className="form-control" type="date" required value={override.scheduledDate} onChange={(event) => setOverride({ ...override, scheduledDate: event.target.value })} /></div>
          <div className="col-md-4"><label className="form-label" htmlFor="override-time">New start time</label><input id="override-time" className="form-control" type="time" required value={override.scheduledStartTime} onChange={(event) => setOverride({ ...override, scheduledStartTime: event.target.value })} /></div>
          <div className="col-md-4 d-flex align-items-end"><button className="btn btn-primary w-100" disabled={!selected}>Save override</button></div>
        </form>
        <p className="small text-secondary mt-3 mb-0">If the requested slot overlaps a booking or maintenance, the server rejects the change and reports the conflict; existing bookings are never silently displaced.</p>
      </div>
      <div className="section-card">
        <h5 className="fw-bold mb-3">Add personal research booking</h5>
        <form className="row g-3" onSubmit={addResearchBooking}>
          <div className="col-md-6"><label className="form-label" htmlFor="personal-equipment">Equipment</label><select id="personal-equipment" className="form-select" required value={personal.equipmentId} onChange={(event) => setPersonal({ ...personal, equipmentId: event.target.value })}><option value="">Choose equipment</option>{equipment.filter((item) => item.status !== "Maintenance").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <div className="col-md-3"><label className="form-label" htmlFor="personal-date">Date</label><input id="personal-date" className="form-control" type="date" required value={personal.date} onChange={(event) => setPersonal({ ...personal, date: event.target.value })} /></div>
          <div className="col-md-3"><label className="form-label" htmlFor="personal-time">Start time</label><input id="personal-time" className="form-control" type="time" required value={personal.startTime} onChange={(event) => setPersonal({ ...personal, startTime: event.target.value })} /></div>
          <div className="col-md-3"><label className="form-label" htmlFor="personal-duration">Duration (minutes)</label><input id="personal-duration" className="form-control" type="number" min="1" max="1440" required value={personal.durationMinutes} onChange={(event) => setPersonal({ ...personal, durationMinutes: event.target.value })} /></div>
          <div className="col-md-3"><label className="form-label" htmlFor="personal-deadline">Deadline</label><input id="personal-deadline" className="form-control" type="date" value={personal.deadline} onChange={(event) => setPersonal({ ...personal, deadline: event.target.value })} /></div>
          <div className="col-md-3"><label className="form-label" htmlFor="personal-urgency">Urgency</label><select id="personal-urgency" className="form-select" value={personal.urgency} onChange={(event) => setPersonal({ ...personal, urgency: event.target.value })}><option value="low">Low</option><option value="medium">Normal</option><option value="high">High</option></select></div>
          <div className="col-md-3"><label className="form-label" htmlFor="personal-purpose">Research purpose</label><input id="personal-purpose" className="form-control" maxLength="500" value={personal.purpose} onChange={(event) => setPersonal({ ...personal, purpose: event.target.value })} /></div>
          <div className="col-12"><button className="btn btn-outline-primary">Add research reservation</button></div>
        </form>
      </div>
    </AdminPage>
  );
}
