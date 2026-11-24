import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const { user } = useAuth();
  return (
    <div>
      <section className="hero">
        <div className="container py-5">
          <div className="row align-items-center g-5 py-lg-5">
            <div className="col-lg-7">
              <span className="eyebrow"><i className="bi bi-calendar2-check me-2"></i>SMART LAB SCHEDULING</span>
              <h1 className="display-4 fw-bold mt-3">Your research deserves <span className="text-primary">the right time.</span></h1>
              <p className="lead text-secondary mt-3">Request laboratory equipment, track your bookings, and spend less time waiting for the tools your research needs.</p>
              <div className="d-flex flex-wrap gap-2 mt-4">
                <Link to={user ? "/dashboard" : "/register"} className="btn btn-primary btn-lg">{user ? "Go to dashboard" : "Get started"} <i className="bi bi-arrow-right ms-2"></i></Link>
                <Link to="/equipment" className="btn btn-outline-dark btn-lg">Explore equipment</Link>
              </div>
              <div className="d-flex gap-4 mt-4 small text-secondary"><span><i className="bi bi-check-circle-fill text-success me-1"></i>Easy requests</span><span><i className="bi bi-check-circle-fill text-success me-1"></i>Clear status</span><span><i className="bi bi-check-circle-fill text-success me-1"></i>Fair scheduling</span></div>
            </div>
            <div className="col-lg-5">
              <div className="hero-card">
                <div className="d-flex justify-content-between align-items-center"><span className="fw-semibold">Equipment overview</span><span className="live-dot">● Live demo</span></div>
                <div className="equipment-preview mt-4"><div className="equipment-icon"><i className="bi bi-microscope"></i></div><div><strong>Digital Microscope</strong><div className="small text-secondary">Lab Room 301</div></div><span className="ms-auto badge text-bg-success">Available</span></div>
                <div className="equipment-preview"><div className="equipment-icon"><i className="bi bi-fan"></i></div><div><strong>High-Speed Centrifuge</strong><div className="small text-secondary">Lab Room 302</div></div><span className="ms-auto badge text-bg-success">Available</span></div>
                <div className="equipment-preview"><div className="equipment-icon"><i className="bi bi-activity"></i></div><div><strong>Spectrophotometer</strong><div className="small text-secondary">Lab Room 303</div></div><span className="ms-auto badge text-bg-success">Available</span></div>
                <div className="small text-secondary mt-3"><i className="bi bi-info-circle me-1"></i>Availability shown here is sample data in demo mode.</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="container py-5">
        <div className="text-center mb-4"><span className="eyebrow">HOW IT WORKS</span><h2 className="fw-bold mt-2">A simpler way to book lab equipment</h2></div>
        <div className="row g-3">
          {[["bi-ui-checks","1. Submit a request","Choose equipment, date, duration and research deadline."],["bi-calendar-week","2. Get scheduled","The lab team reviews requests and prepares the equipment schedule."],["bi-clipboard-check","3. Track your booking","See whether your request is pending, approved or rescheduled."]].map(([icon,title,desc])=><div className="col-md-4" key={title}><div className="feature-card h-100"><i className={`bi ${icon} feature-icon`}></i><h5 className="mt-3">{title}</h5><p className="text-secondary mb-0">{desc}</p></div></div>)}
        </div>
      </section>
    </div>
  );
}
