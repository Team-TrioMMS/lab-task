import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { api.getMyBookings(user.id).then(setBookings).catch(e=>setError(e.message)); }, [user.id]);
  const pending = bookings.filter(b=>b.status==="Pending").length;
  const approved = bookings.filter(b=>b.status==="Approved").length;
  return <div className="container page-wrap">
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4"><div><span className="eyebrow">STUDENT WORKSPACE</span><h2 className="fw-bold mt-2">Hello, {user.name.split(" ")[0]} 👋</h2><p className="text-secondary mb-0">Here is an overview of your laboratory activity.</p></div><Link to="/book" className="btn btn-primary"><i className="bi bi-plus-lg me-2"></i>New booking</Link></div>
    {error && <div className="alert alert-danger">{error}</div>}
    <div className="row g-3 mb-4">
      {[["Total bookings",bookings.length,"bi-calendar2-week","stat-blue"],["Pending requests",pending,"bi-hourglass-split","stat-yellow"],["Approved bookings",approved,"bi-check2-circle","stat-green"]].map(([label,value,icon,cls])=><div className="col-md-4" key={label}><div className="stat-card"><div><p className="text-secondary mb-1">{label}</p><h3 className="fw-bold mb-0">{value}</h3></div><div className={`stat-icon ${cls}`}><i className={`bi ${icon}`}></i></div></div></div>)}
    </div>
    <div className="section-card"><div className="d-flex justify-content-between align-items-center mb-3"><h5 className="fw-bold mb-0">Recent bookings</h5><Link to="/my-bookings" className="small">View all</Link></div>
      {bookings.length ? <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Booking ID</th><th>Equipment</th><th>Date</th><th>Status</th></tr></thead><tbody>{bookings.slice(0,5).map(b=><tr key={b.id}><td className="fw-semibold">{b.id}</td><td>{b.equipmentName}</td><td>{b.date}</td><td><StatusBadge status={b.status}/></td></tr>)}</tbody></table></div> : <EmptyState title="No bookings yet" text="Your submitted equipment requests will appear here." /> }
    </div>
  </div>;
}
