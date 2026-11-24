export default function StatusBadge({ status }) {
  const classes = {
    Pending: "text-bg-warning",
    Approved: "text-bg-success",
    Rejected: "text-bg-danger",
    Rescheduled: "text-bg-info",
    Cancelled: "text-bg-secondary"
  };
  return <span className={`badge rounded-pill ${classes[status] || "text-bg-secondary"}`}>{status}</span>;
}
