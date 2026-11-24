import { useEffect, useMemo, useState } from "react";
import AdminPage from "../components/AdminPage.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { api } from "../services/api.js";

function shiftDate(value, days) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function timeFromDateTime(value) {
  if (value instanceof Date) return value.toISOString().slice(11, 16);
  return String(value || "").replace("T", " ").slice(11, 16);
}

export default function ScheduleCalendar() {
  const [bookings, setBookings] = useState([]);
  const [mode, setMode] = useState("week");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [generating, setGenerating] = useState(false);

  async function load() {
    try {
      setBookings(await api.getAllBookings());
      setError("");
    } catch (cause) {
      setError(cause.message);
    }
  }
  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    const end = mode === "day" ? selectedDate : shiftDate(selectedDate, 6);
    return bookings
      .filter((booking) => booking.scheduledStart && booking.date >= selectedDate && booking.date <= end)
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  }, [bookings, mode, selectedDate]);

  async function generate() {
    setGenerating(true);
    setNotice("");
    setError("");
    try {
      const result = await api.generateSchedule();
      setNotice(`Scheduled ${result.scheduled.length} request(s); ${result.unscheduled.length} need attention.`);
      await load();
      if (result.unscheduled.length) {
        setError(result.unscheduled.map((item) => `#${item.bookingId}: ${item.reason}`).join(" "));
      }
    } catch (cause) {
      setError(cause.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <AdminPage
      eyebrow="EQUIPMENT AVAILABILITY"
      title="Schedule calendar"
      description="View approved equipment usage by day or week, then generate an optimized conflict-free schedule."
      actions={<button className="btn btn-primary" onClick={generate} disabled={generating}><i className="bi bi-stars me-2" />{generating ? "Generating..." : "Generate schedule"}</button>}
    >
      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      {error && <div className="alert alert-warning" role="alert">{error}</div>}
      <div className="section-card">
        <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
          <div className="btn-group" role="group" aria-label="Schedule view">
            <button type="button" className={`btn ${mode === "day" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setMode("day")}>Daily</button>
            <button type="button" className={`btn ${mode === "week" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setMode("week")}>Weekly</button>
          </div>
          <label className="d-flex align-items-center gap-2 small text-secondary">
            {mode === "day" ? "Day" : "Date within week"}
            <input className="form-control form-control-sm" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </label>
          <span className="small text-secondary ms-auto">Sessions stay continuous; equipment and maintenance conflicts are excluded.</span>
        </div>
        {visible.length ? (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead><tr><th>Date</th><th>Time</th><th>Equipment</th><th>Student</th><th>Duration</th><th>Deadline</th><th>Urgency</th></tr></thead>
              <tbody>{visible.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.date}</td>
                  <td>{booking.startTime} – {timeFromDateTime(booking.scheduledEnd)}</td>
                  <td className="fw-semibold">{booking.equipmentName}</td>
                  <td>{booking.userName || `User ${booking.userId}`}</td>
                  <td>{booking.durationMinutes} min</td>
                  <td>{booking.deadline || "—"}</td>
                  <td>{booking.urgency}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyState title="No scheduled equipment use" text="Choose another date or generate a schedule from pending requests." />}
      </div>
    </AdminPage>
  );
}
