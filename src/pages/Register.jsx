import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", studentId: "", department: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  async function submit(e) {
    e.preventDefault(); setError("");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const { confirmPassword, ...details } = form;
      await register(details);
      navigate("/dashboard");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  return <div className="auth-wrap"><div className="auth-card auth-card-wide"><div className="text-center mb-4"><div className="auth-icon"><i className="bi bi-person-plus"></i></div><h2 className="fw-bold mt-3">Create student account</h2><p className="text-secondary">Register to request laboratory equipment.</p></div>
    {error && <div className="alert alert-danger py-2">{error}</div>}
    <form onSubmit={submit}><div className="row g-3">
      <div className="col-md-6"><label className="form-label">Full name</label><input className="form-control" name="name" required value={form.name} onChange={change} placeholder="Your full name" /></div>
      <div className="col-md-6"><label className="form-label">Email</label><input className="form-control" type="email" name="email" required value={form.email} onChange={change} placeholder="you@university.edu" /></div>
      <div className="col-md-6"><label className="form-label">Student ID</label><input className="form-control" name="studentId" required value={form.studentId} onChange={change} placeholder="Your student ID" /></div>
      <div className="col-md-6"><label className="form-label">Department</label><input className="form-control" name="department" required value={form.department} onChange={change} placeholder="e.g. Biotechnology" /></div>
      <div className="col-md-6"><label className="form-label">Password</label><input className="form-control" type="password" name="password" minLength="6" required value={form.password} onChange={change} /></div>
      <div className="col-md-6"><label className="form-label">Confirm password</label><input className="form-control" type="password" name="confirmPassword" minLength="6" required value={form.confirmPassword} onChange={change} /></div>
    </div><button className="btn btn-primary w-100 mt-4" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button></form>
    <p className="text-center small text-secondary mt-4 mb-0">Already registered? <Link to="/login">Log in</Link></p>
  </div></div>;
}
