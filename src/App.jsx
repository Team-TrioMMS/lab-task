import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppLayout from "./components/AppLayout.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import Equipment from "./pages/Equipment.jsx";
import BookingForm from "./pages/BookingForm.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AllRequests from "./pages/AllRequests.jsx";
import ScheduleCalendar from "./pages/ScheduleCalendar.jsx";
import EquipmentManagement from "./pages/EquipmentManagement.jsx";
import Maintenance from "./pages/Maintenance.jsx";
import ManageSchedule from "./pages/ManageSchedule.jsx";

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/equipment" element={<ProtectedRoute><Equipment /></ProtectedRoute>} />
          <Route path="/book" element={<ProtectedRoute><BookingForm /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/requests" element={<ProtectedRoute role="admin"><AllRequests /></ProtectedRoute>} />
          <Route path="/admin/schedule" element={<ProtectedRoute role="admin"><ScheduleCalendar /></ProtectedRoute>} />
          <Route path="/admin/equipment" element={<ProtectedRoute role="admin"><EquipmentManagement /></ProtectedRoute>} />
          <Route path="/admin/maintenance" element={<ProtectedRoute role="admin"><Maintenance /></ProtectedRoute>} />
          <Route path="/admin/manage-schedule" element={<ProtectedRoute role="admin"><ManageSchedule /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
