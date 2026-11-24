import { useEffect, useState } from "react";
import AdminPage from "../components/AdminPage.jsx";
import { api } from "../services/api.js";

export default function EquipmentManagement() {
  const [equipment, setEquipment] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    try {
      setEquipment(await api.getEquipment());
      setError("");
    } catch (cause) {
      setError(cause.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function changeStatus(item, status) {
    setError("");
    setNotice("");
    try {
      await api.updateEquipment(item.id, { status });
      setNotice(`${item.name} status updated.`);
      await load();
    } catch (cause) {
      setError(cause.message);
    }
  }

  async function addEquipment(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      await api.createEquipment(form);
      setForm({ name: "", description: "" });
      setNotice("Equipment added.");
      await load();
    } catch (cause) {
      setError(cause.message);
    }
  }

  return (
    <AdminPage eyebrow="LAB INVENTORY" title="Equipment management" description="Update availability and register newly acquired equipment.">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      <div className="section-card mb-4">
        <h5 className="fw-bold mb-3">Add equipment</h5>
        <form className="row g-3 align-items-end" onSubmit={addEquipment}>
          <div className="col-md-4"><label className="form-label" htmlFor="equipment-name">Name</label><input id="equipment-name" className="form-control" required maxLength="100" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
          <div className="col-md-6"><label className="form-label" htmlFor="equipment-description">Description</label><input id="equipment-description" className="form-control" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
          <div className="col-md-2"><button className="btn btn-primary w-100">Add item</button></div>
        </form>
      </div>
      <div className="row g-3">
        {equipment.map((item) => (
          <div className="col-md-6 col-xl-4" key={item.id}>
            <div className="equipment-card h-100">
              <div className="d-flex justify-content-between gap-2"><div><h5 className="fw-bold">{item.name}</h5><p className="small text-secondary">{item.description || "No description provided."}</p></div><i className="bi bi-cpu fs-3 text-primary" /></div>
              <label className="form-label" htmlFor={`equipment-status-${item.id}`}>Equipment status</label>
              <select id={`equipment-status-${item.id}`} className="form-select" value={item.status.toLowerCase().replaceAll(" ", "_")} onChange={(event) => changeStatus(item, event.target.value)}>
                <option value="available">Available</option><option value="in_use">In use</option><option value="maintenance" disabled>Maintenance · use maintenance page</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </AdminPage>
  );
}
