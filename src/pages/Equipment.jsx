import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

export default function Equipment() {
  const [equipment, setEquipment] = useState([]);
  const [error, setError] = useState("");
  useEffect(()=>{api.getEquipment().then(setEquipment).catch(e=>setError(e.message));},[]);
  return <div className="container page-wrap"><span className="eyebrow">LAB RESOURCES</span><h2 className="fw-bold mt-2">Available equipment</h2><p className="text-secondary mb-4">Explore the equipment available for your research.</p>
    {error && <div className="alert alert-danger">{error}</div>}
    <div className="row g-3">{equipment.map(item=><div className="col-md-6 col-lg-4" key={item.id}><div className="equipment-card h-100"><div className="d-flex justify-content-between"><div className="equipment-icon large"><i className={`bi ${item.icon || "bi-tools"}`}></i></div><span className={`badge rounded-pill ${item.status==="Available"?"text-bg-success":"text-bg-secondary"}`}>{item.status}</span></div><h5 className="fw-bold mt-4">{item.name}</h5><p className="text-secondary small">{item.description}</p><div className="small text-secondary mb-3"><i className="bi bi-geo-alt me-1"></i>{item.location}</div><Link to={`/book?equipment=${item.id}`} className="btn btn-outline-primary w-100" aria-disabled={item.status!=="Available"}>Request this equipment</Link></div></div>)}</div>
  </div>;
}
