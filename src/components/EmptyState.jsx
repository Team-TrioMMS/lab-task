export default function EmptyState({ icon = "bi-inbox", title, text }) {
  return <div className="empty-state text-center py-5"><i className={`bi ${icon} display-5 text-secondary`}></i><h5 className="mt-3">{title}</h5><p className="text-secondary mb-0">{text}</p></div>;
}
