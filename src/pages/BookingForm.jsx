import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function BookingForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [equipment, setEquipment] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ equipmentId: params.get("equipment") || "", date: "", startTime: "", durationMinutes: "60", deadline: "", urgency: "Normal", purpose: "" });
  useEffect(()=>{api.getEquipment().then(setEquipment).catch(e=>setError(e.message));},[]);
  function change(e){setForm({...form,[e.target.name]:e.target.value});}
  async function submit(e){
    e.preventDefault(); setError(""); setSuccess("");
    if (form.deadline && form.deadline < form.date) return setError("Research deadline cannot be earlier than the requested booking date.");
    setLoading(true);
    try {
      await api.createBooking({ ...form, durationMinutes: Number(form.durationMinutes), userId: user.id });
      setSuccess("Your booking request has been submitted successfully.");
      setTimeout(()=>navigate("/my-bookings"),900);
    } catch(err){setError(err.message);}
    finally{setLoading(false);}
  }
  return <div className="container page-wrap"><div className="form-shell"><div className="mb-4"><span className="eyebrow">NEW REQUEST</span><h2 className="fw-bold mt-2">Book laboratory equipment</h2><p className="text-secondary">Provide your research requirements. The lab team will review your request.</p></div>
    {error && <div className="alert alert-danger">{error}</div>}{success && <div className="alert alert-success">{success}</div>}
    <form onSubmit={submit}><div className="mb-3"><label className="form-label">Equipment</label><select className="form-select" name="equipmentId" required value={form.equipmentId} onChange={change}><option value="">Choose equipment</option>{equipment.map(e=><option key={e.id} value={e.id} disabled={e.status!=="Available"}>{e.name} — {e.status}</option>)}</select></div>
      <div className="row g-3"><div className="col-md-6"><label className="form-label">Preferred date</label><input className="form-control" type="date" name="date" min={new Date().toISOString().slice(0,10)} required value={form.date} onChange={change}/></div>
      <div className="col-md-6"><label className="form-label">Preferred start time</label><input className="form-control" type="time" name="startTime" required value={form.startTime} onChange={change}/></div>
      <div className="col-md-6"><label className="form-label">Required duration</label><select className="form-select" name="durationMinutes" value={form.durationMinutes} onChange={change}><option value="20">20 minutes</option><option value="30">30 minutes</option><option value="60">1 hour</option><option value="120">2 hours</option><option value="180">3 hours</option><option value="240">4 hours</option></select></div>
      <div className="col-md-6"><label className="form-label">Research deadline</label><input className="form-control" type="date" name="deadline" min={form.date || new Date().toISOString().slice(0,10)} required value={form.deadline} onChange={change}/></div>
      <div className="col-md-6"><label className="form-label">Urgency</label><select className="form-select" name="urgency" value={form.urgency} onChange={change}><option>Low</option><option>Normal</option><option>High</option><option>Critical</option></select></div>
      <div className="col-12"><label className="form-label">Research purpose / notes</label><textarea className="form-control" name="purpose" rows="4" required maxLength="500" value={form.purpose} onChange={change} placeholder="Briefly explain what you need the equipment for..."></textarea><div className="form-text">Maximum 500 characters.</div></div></div>
      <div className="d-flex flex-wrap gap-2 mt-4"><button className="btn btn-primary" disabled={loading}>{loading?"Submitting...":"Submit booking request"}</button><Link to="/equipment" className="btn btn-light border">Cancel</Link></div>
    </form>
    <div className="alert alert-info mt-4 small mb-0"><i className="bi bi-info-circle me-2"></i>Submitting a request does not guarantee approval. The final schedule is subject to equipment availability and lab administrator review.</div>
  </div></div>;
}
