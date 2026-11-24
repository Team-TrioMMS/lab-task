export default function AdminPage({ eyebrow, title, description, children, actions }) {
  return (
    <div className="container page-wrap">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="fw-bold mt-2 mb-1">{title}</h2>
          <p className="text-secondary mb-0">{description}</p>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
