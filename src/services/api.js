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
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
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
    if (API_BASE) return request("/equipment");
    return demoEquipment;
  },

  async getMyBookings(userId) {
    if (API_BASE) return request("/bookings/my");
    const bookings = read(KEYS.bookings, initialBookings);
    return bookings.filter((b) => !b.userId || b.userId === userId);
  },

  async createBooking(payload) {
    if (API_BASE) return request("/bookings", { method: "POST", body: JSON.stringify(payload) });
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
    if (API_BASE) return request(`/bookings/${id}/cancel`, { method: "PATCH" });
    const bookings = read(KEYS.bookings, initialBookings);
    const updated = bookings.map((b) => b.id === id && b.status === "Pending" ? { ...b, status: "Cancelled" } : b);
    write(KEYS.bookings, updated);
    return { success: true };
  }
};
