import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const result = await login(form);
      navigate(result.user?.role === "admin" ? "/admin" : "/dashboard");
    }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  return <div className="auth-wrap"><div className="auth-card"><div className="text-center mb-4"><div className="auth-icon"><i className="bi bi-person-lock"></i></div><h2 className="fw-bold mt-3">Welcome back</h2><p className="text-secondary">Log in to manage your lab bookings.</p></div>
    {error && <div className="alert alert-danger py-2">{error}</div>}
    <form onSubmit={submit}><label className="form-label">Email address</label><input className="form-control mb-3" type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@university.edu" />
      <label className="form-label">Password</label><input className="form-control mb-4" type="password" required minLength="6" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Enter your password" />
      <button className="btn btn-primary w-100" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button></form>
    <p className="text-center small text-secondary mt-4 mb-0">New to LabBook? <Link to="/register">Create an account</Link></p>
  </div></div>;
}
