import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  function handleLogout() { logout(); navigate("/"); }
  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top">
        <div className="container">
          <Link className="navbar-brand fw-bold brand" to="/"><i className="bi bi-beaker me-2"></i>LabBook</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav"><span className="navbar-toggler-icon"></span></button>
          <div className="collapse navbar-collapse" id="mainNav">
            <div className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
              {user ? <>
                {user.role === "admin" ? <>
                  <NavLink className="nav-link" to="/admin">Admin</NavLink>
                  <NavLink className="nav-link" to="/admin/requests">Requests</NavLink>
                  <NavLink className="nav-link" to="/admin/schedule">Schedule</NavLink>
                  <NavLink className="nav-link" to="/admin/equipment">Equipment</NavLink>
                  <NavLink className="nav-link" to="/admin/maintenance">Maintenance</NavLink>
                </> : <>
                  <NavLink className="nav-link" to="/dashboard">Dashboard</NavLink>
                  <NavLink className="nav-link" to="/equipment">Equipment</NavLink>
                  <NavLink className="nav-link" to="/book">New Booking</NavLink>
                  <NavLink className="nav-link" to="/my-bookings">My Bookings</NavLink>
                </>}
                <span className="small text-secondary ms-lg-2">Hi, {user.name}</span>
                <button className="btn btn-outline-secondary btn-sm ms-lg-2" onClick={handleLogout}>Log out</button>
              </> : <>
                <NavLink className="nav-link" to="/">Home</NavLink>
                <Link className="btn btn-outline-primary btn-sm" to="/login">Log in</Link>
                <Link className="btn btn-primary btn-sm" to="/register">Create account</Link>
              </>}
            </div>
          </div>
        </div>
      </nav>
      <main><Outlet /></main>
      <footer className="footer mt-5 py-4">
        <div className="container d-flex flex-column flex-md-row justify-content-between gap-2">
          <span className="fw-semibold">LabBook <span className="text-secondary fw-normal">· Laboratory equipment scheduling</span></span>
          <span className="text-secondary small">Student Portal · University Laboratory</span>
        </div>
      </footer>
    </>
  );
}
