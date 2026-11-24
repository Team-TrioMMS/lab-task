import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings,setBookings]=useState([]);
  const [filter,setFilter]=useState("All");
  const [error,setError]=useState("");
  async function load(){try{setBookings(await api.getMyBookings(user.id));}catch(e){setError(e.message);}}
  useEffect(()=>{load();},[user.id]);
  const filtered=useMemo(()=>filter==="All"?bookings:bookings.filter(b=>b.status===filter),[bookings,filter]);
  async function cancel(id){if(!window.confirm("Cancel this pending request?"))return;try{await api.cancelBooking(id);await load();}catch(e){setError(e.message);}}
  return <div className="container page-wrap"><div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4"><div><span className="eyebrow">YOUR ACTIVITY</span><h2 className="fw-bold mt-2">My bookings</h2><p className="text-secondary mb-0">Track current requests and your booking history.</p></div><a href="/book" className="btn btn-primary"><i className="bi bi-plus-lg me-2"></i>New booking</a></div>
    {error&&<div className="alert alert-danger">{error}</div>}
    <div className="section-card"><div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3"><h5 className="fw-bold mb-0">Booking history</h5><select className="form-select form-select-sm filter-select" value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option><option>Rescheduled</option><option>Cancelled</option></select></div>
      {filtered.length?<div className="table-responsive"><table className="table align-middle"><thead><tr><th>Booking ID</th><th>Equipment</th><th>Date & time</th><th>Duration</th><th>Deadline</th><th>Status</th><th>Action</th></tr></thead><tbody>{filtered.map(b=><tr key={b.id}><td className="fw-semibold">{b.id}</td><td>{b.equipmentName}</td><td>{b.date}<div className="small text-secondary">{b.startTime}</div></td><td>{b.durationMinutes} min</td><td>{b.deadline}</td><td><StatusBadge status={b.status}/></td><td>{b.status==="Pending"?<button className="btn btn-sm btn-outline-danger" onClick={()=>cancel(b.id)}>Cancel</button>:<span className="text-secondary small">—</span>}</td></tr>)}</tbody></table></div>:<EmptyState title="No matching bookings" text="Try another filter or submit a new booking request."/>}
    </div>
  </div>;
}
