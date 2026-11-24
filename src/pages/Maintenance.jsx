import { useEffect, useState } from "react";
import AdminPage from "../components/AdminPage.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { api } from "../services/api.js";

const emptyForm = { equipmentId: "", startDateTime: "", endDateTime: "", reason: "" };

function localDateTime(value) {
  return value ? value.replace(" ", "T").slice(0, 16) : "";
}

export default function Maintenance() {
  const [equipment, setEquipment] = useState([]);
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    try {
      const [items, maintenance] = await Promise.all([api.getEquipment(), api.getMaintenance()]);
      setEquipment(items);
      setRecords(maintenance);
      setError("");
    } catch (cause) {
      setError(cause.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const result = await api.createMaintenance(form);
      setNotice(`Maintenance logged. ${result.rescheduledBookings} overlapping booking(s) were moved or flagged for attention.`);
      setForm(emptyForm);
      await load();
    } catch (cause) {
      setError(cause.message);
    }
  }

  async function complete(record) {
    setError("");
    setNotice("");
    try {
      await api.completeMaintenance(record.id);
      setNotice("Maintenance marked complete. Run schedule generation to place any waiting requests.");
      await load();
    } catch (cause) {
      setError(cause.message);
    }
  }

  return (
    <AdminPage eyebrow="EQUIPMENT HEALTH" title="Maintenance & breakdowns" description="Log equipment outages. Overlapping bookings are removed from the affected slot and rescheduled when possible.">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {notice && <div className="alert alert-info" role="status">{notice}</div>}
      <div className="section-card mb-4">
        <h5 className="fw-bold mb-3">Record maintenance or breakdown</h5>
        <form className="row g-3" onSubmit={submit}>
          <div className="col-md-6"><label className="form-label" htmlFor="maintenance-equipment">Equipment</label><select id="maintenance-equipment" className="form-select" required value={form.equipmentId} onChange={(event) => setForm({ ...form, equipmentId: event.target.value })}><option value="">Select equipment</option>{equipment.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div>
          <div className="col-md-3"><label className="form-label" htmlFor="maintenance-start">Unavailable from</label><input id="maintenance-start" className="form-control" type="datetime-local" required value={form.startDateTime} onChange={(event) => setForm({ ...form, startDateTime: event.target.value })} /></div>
          <div className="col-md-3"><label className="form-label" htmlFor="maintenance-end">Expected available at</label><input id="maintenance-end" className="form-control" type="datetime-local" min={form.startDateTime} value={form.endDateTime} onChange={(event) => setForm({ ...form, endDateTime: event.target.value })} /><div className="form-text">Leave blank for an unknown repair time.</div></div>
          <div className="col-md-9"><label className="form-label" htmlFor="maintenance-reason">Reason / breakdown details</label><input id="maintenance-reason" className="form-control" required maxLength="500" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></div>
          <div className="col-md-3 d-flex align-items-end"><button className="btn btn-primary w-100">Save maintenance</button></div>
        </form>
      </div>
      <div className="section-card">
        <h5 className="fw-bold mb-3">Maintenance history</h5>
        {records.length ? <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Equipment</th><th>Reason</th><th>Start</th><th>Expected end</th><th>Status</th><th /></tr></thead><tbody>
          {records.map((record) => <tr key={record.id}><td className="fw-semibold">{record.equipment_name}</td><td>{record.reason}</td><td>{localDateTime(record.start_date).replace("T", " ")}</td><td>{record.end_date ? localDateTime(record.end_date).replace("T", " ") : "Unknown"}</td><td><span className={`badge ${record.status === "active" ? "text-bg-warning" : "text-bg-secondary"}`}>{record.status}</span></td><td>{record.status === "active" && <button className="btn btn-sm btn-outline-success" onClick={() => complete(record)}>Mark complete</button>}</td></tr>)}
        </tbody></table></div> : <EmptyState title="No maintenance records" text="Log a planned service or breakdown above." />}
      </div>
    </AdminPage>
  );
}
