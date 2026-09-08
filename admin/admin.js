const STORAGE_KEY = "tradeSphareBookings";

const statusLabels = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  completed: "مكتمل",
  cancelled: "ملغى"
};

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("status-filter")
    .addEventListener("change", render);

  document
    .getElementById("date-filter")
    .addEventListener("change", render);

  document
    .getElementById("clear-all")
    .addEventListener("click", clearAll);

  render();
});

function getBookings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveBookings(bookings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function render() {
  const bookings = getBookings();

  updateStats(bookings);

  const status = document.getElementById("status-filter").value;
  const date = document.getElementById("date-filter").value;

  const filtered = bookings.filter(booking => {
    const matchesStatus = !status || booking.status === status;
    const matchesDate = !date || booking.date === date;

    return matchesStatus && matchesDate;
  });

  const tbody = document.getElementById("bookings-table");
  const empty = document.getElementById("empty-state");

  tbody.innerHTML = "";

  empty.hidden = filtered.length !== 0;

  filtered
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .forEach(booking => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${escapeHtml(booking.id)}</td>
        <td>
          <strong>${escapeHtml(booking.name)}</strong><br>
          <small>${escapeHtml(booking.email)}</small>
        </td>
        <td>${escapeHtml(booking.serviceName)}</td>
        <td>
          ${escapeHtml(booking.date)}<br>
          ${escapeHtml(booking.time)}
        </td>
        <td>
          <span class="status ${escapeHtml(booking.status)}">
            ${escapeHtml(statusLabels[booking.status] || booking.status)}
          </span>
        </td>
        <td>
          <div class="actions">
            ${booking.status === "pending"
              ? `<button class="btn primary" onclick="changeStatus('${booking.id}', 'confirmed')">تأكيد</button>`
              : ""
            }

            ${booking.status === "confirmed"
              ? `<button class="btn success" onclick="changeStatus('${booking.id}', 'completed')">مكتمل</button>`
              : ""
            }

            ${booking.status !== "cancelled"
              ? `<button class="btn danger" onclick="changeStatus('${booking.id}', 'cancelled')">إلغاء</button>`
              : ""
            }

            <button class="btn muted" onclick="deleteBooking('${booking.id}')">
              حذف
            </button>
          </div>
        </td>
      `;

      tbody.appendChild(row);
    });
}

function updateStats(bookings) {
  document.getElementById("stat-total").textContent = bookings.length;
  document.getElementById("stat-pending").textContent =
    bookings.filter(item => item.status === "pending").length;
  document.getElementById("stat-confirmed").textContent =
    bookings.filter(item => item.status === "confirmed").length;
  document.getElementById("stat-cancelled").textContent =
    bookings.filter(item => item.status === "cancelled").length;
}

function changeStatus(id, status) {
  const bookings = getBookings();

  const updated = bookings.map(booking => {
    if (booking.id !== id) {
      return booking;
    }

    return {
      ...booking,
      status,
      updatedAt: new Date().toISOString()
    };
  });

  saveBookings(updated);
  render();
}

function deleteBooking(id) {
  if (!confirm("هل تريد حذف هذا الحجز نهائيا من Demo")) {
    return;
  }

  const bookings = getBookings().filter(
    booking => booking.id !== id
  );

  saveBookings(bookings);
  render();
}

function clearAll() {
  if (!confirm("سيتم حذف جميع الحجوزات التجريبية. هل أنت متأكد")) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("tradeSphareLastBooking");

  render();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
