import { demoEquipment, initialBookings } from "../data/demoData.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const KEYS = { users: "labbook_users", bookings: "labbook_bookings", currentUser: "labbook_current_user" };

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
async function request(path, options = {}) {
  const token = localStorage.getItem("labbook_token");
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || "Request failed");
  return data;
}

function dateValue(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function timeValue(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(11, 16);
  return String(value).slice(0, 5);
}

function displayStatus(value) {
  return value
    ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Pending";
}

function dateTimeTime(value) {
  if (value instanceof Date) return value.toISOString().slice(11, 16);
  return String(value).replace("T", " ").slice(11, 16);
}

function normalizeBooking(booking) {
  const scheduledStart = booking.scheduled_start || booking.scheduledStart;
  const scheduledEnd = booking.scheduled_end || booking.scheduledEnd;
  const scheduledDate = scheduledStart ? dateValue(scheduledStart) : "";
  const scheduledTime = scheduledStart ? dateTimeTime(scheduledStart) : "";
  return {
    ...booking,
    userId: booking.user_id ?? booking.userId,
    userName: booking.user_name ?? booking.userName,
    equipmentId: booking.equipment_id ?? booking.equipmentId,
    equipmentName: booking.equipment_name ?? booking.equipmentName,
    date: scheduledDate || dateValue(booking.booking_date ?? booking.date ?? booking.bookingDate),
    startTime: scheduledTime || timeValue(booking.start_time ?? booking.startTime),
    scheduledStart: scheduledStart || null,
    scheduledEnd: scheduledEnd || null,
    durationMinutes: booking.duration_minutes ?? booking.durationMinutes,
    deadline: dateValue(booking.deadline),
    urgency: booking.urgency ? displayStatus(booking.urgency) : "Low",
    status: displayStatus(booking.status)
  };
}

function requireAdminApi() {
  if (!API_BASE) throw new Error("Admin scheduling requires the backend API. Configure VITE_API_BASE_URL and sign in as an admin.");
}

export const api = {
  async register(payload) {
    if (API_BASE) return request("/auth/register", { method: "POST", body: JSON.stringify(payload) });
    const users = read(KEYS.users, []);
    if (users.some((u) => u.email === payload.email)) throw new Error("This email is already registered.");
    const user = { id: Date.now(), ...payload, role: "student" };
    write(KEYS.users, [...users, user]);
    return { user };
  },

  async login(payload) {
    if (API_BASE) return request("/auth/login", { method: "POST", body: JSON.stringify(payload) });
    const users = read(KEYS.users, []);
    const user = users.find((u) => u.email === payload.email && u.password === payload.password);
    if (!user) throw new Error("Invalid email or password. Register first or try demo access.");
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  },

  async getEquipment() {
    if (API_BASE) {
      const data = await request("/equipment");
      return (data.equipment || data).map((equipment) => ({
        ...equipment,
        status: displayStatus(equipment.status)
      }));
    }
    return demoEquipment;
  },

  async getMyBookings(userId) {
    if (API_BASE) {
      const data = await request("/bookings/my");
      return (data.bookings || data).map(normalizeBooking);
    }
    const bookings = read(KEYS.bookings, initialBookings);
    return bookings.filter((b) => !b.userId || b.userId === userId);
  },

  async createBooking(payload) {
    if (API_BASE) {
      const data = await request("/bookings", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          bookingDate: payload.bookingDate || payload.date,
          urgency: payload.urgency?.toLowerCase()
        })
      });
      return normalizeBooking(data.booking || data);
    }
    const bookings = read(KEYS.bookings, initialBookings);
    const item = {
      ...payload,
      id: `LB-${Date.now().toString().slice(-7)}`,
      equipmentName: demoEquipment.find((e) => String(e.id) === String(payload.equipmentId))?.name || "Equipment",
      status: "Pending",
      createdAt: new Date().toISOString().slice(0, 10)
    };
    write(KEYS.bookings, [{ ...item, userId: payload.userId }, ...bookings]);
    return item;
  },

  async cancelBooking(id) {
    if (API_BASE) return request(`/bookings/${id}`, { method: "DELETE" });
    const bookings = read(KEYS.bookings, initialBookings);
    const updated = bookings.map((b) => b.id === id && b.status === "Pending" ? { ...b, status: "Cancelled" } : b);
    write(KEYS.bookings, updated);
    return { success: true };
  },

  async getAllBookings() {
    requireAdminApi();
    const data = await request("/bookings");
    return (data.bookings || data).map(normalizeBooking);
  },

  async updateBookingStatus(id, status, details = {}) {
    requireAdminApi();
    const data = await request(`/bookings/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: status.toLowerCase(), ...details })
    });
    return data;
  },

  async generateSchedule() {
    requireAdminApi();
    return request("/bookings/schedule/generate", { method: "POST" });
  },

  async createEquipment(payload) {
    requireAdminApi();
    const data = await request("/equipment", { method: "POST", body: JSON.stringify(payload) });
    return data.equipment;
  },

  async updateEquipment(id, payload) {
    requireAdminApi();
    const data = await request(`/equipment/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
    return { ...data.equipment, status: displayStatus(data.equipment.status) };
  },

  async getMaintenance() {
    requireAdminApi();
    const data = await request("/maintenance");
    return data.maintenance || [];
  },

  async createMaintenance(payload) {
    requireAdminApi();
    return request("/maintenance", { method: "POST", body: JSON.stringify(payload) });
  },

  async completeMaintenance(id) {
    requireAdminApi();
    return request(`/maintenance/${id}`, { method: "PATCH", body: JSON.stringify({ status: "completed" }) });
  }
};
