import { useEffect, useState } from "react";
import AdminPage from "../components/AdminPage.jsx";
import EmptyState from "../components/EmptyState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { api } from "../services/api.js";

export default function AllRequests() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  async function load() {
    try {
      setBookings(await api.getAllBookings());
      setError("");
    } catch (cause) {
      setError(cause.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function setStatus(booking, status) {
    setLoadingId(booking.id);
    setError("");
    try {
      await api.updateBookingStatus(booking.id, status);
      await load();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <AdminPage eyebrow="REQUEST QUEUE" title="All booking requests" description="Review urgency and research deadlines before approving equipment time.">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="section-card">
        {bookings.length ? (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead><tr><th>Student</th><th>Equipment</th><th>Research purpose</th><th>Requested slot</th><th>Duration</th><th>Deadline</th><th>Urgency</th><th>Status</th><th>Decision</th></tr></thead>
              <tbody>{bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="fw-semibold">{booking.userName || `User ${booking.userId}`}</td>
                  <td>{booking.equipmentName}</td>
                  <td>{booking.purpose || "—"}</td>
                  <td>{booking.date}<div className="small text-secondary">{booking.startTime}</div></td>
                  <td>{booking.durationMinutes} min</td>
                  <td>{booking.deadline || "—"}</td>
                  <td><span className={`badge ${booking.urgency === "High" || booking.urgency === "Critical" ? "text-bg-danger" : booking.urgency === "Medium" || booking.urgency === "Normal" ? "text-bg-warning" : "text-bg-secondary"}`}>{booking.urgency}</span></td>
                  <td><StatusBadge status={booking.status} /></td>
                  <td>
                    {booking.status === "Pending" ? (
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-success" disabled={loadingId === booking.id} onClick={() => setStatus(booking, "approved")}>Approve</button>
                        <button className="btn btn-sm btn-outline-danger" disabled={loadingId === booking.id} onClick={() => setStatus(booking, "rejected")}>Reject</button>
                      </div>
                    ) : <span className="small text-secondary">—</span>}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : !error ? <EmptyState title="No booking requests" text="New student requests will appear here." /> : null}
      </div>
    </AdminPage>
  );
}
