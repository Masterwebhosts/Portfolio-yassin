const state = {
  step: 1,
  services: [],
  availability: null,
  booking: {
    serviceId: "",
    serviceName: "",
    meetingType: "",
    meetingName: "",
    duration: 0,
    date: "",
    time: "",
    name: "",
    email: "",
    phone: "",
    projectName: "",
    projectUrl: "",
    projectDescription: ""
  }
};

const meetingNames = {
  consultation: "استشارة أولية",
  project: "اجتماع مشروع",
  analysis: "تحليل مشروع",
  technical: "اجتماع تقني"
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    const [servicesResponse, availabilityResponse] = await Promise.all([
      fetch("../data/services.json"),
      fetch("../data/availability.json")
    ]);

    if (!servicesResponse.ok || !availabilityResponse.ok) {
      throw new Error("Failed to load booking data.");
    }

    const servicesData = await servicesResponse.json();
    state.availability = await availabilityResponse.json();
    state.services = servicesData.services || [];

    renderServices();
    setupEvents();
    setMinimumDate();
  } catch (error) {
    showMessage(
      "تعذر تحميل بيانات الحجز. افتح المشروع عبر خادم محلي.",
      "error"
    );

    console.error(error);
  }
}

function setupEvents() {
  document.querySelectorAll("[data-next]").forEach(button => {
    button.addEventListener("click", () => {
      const nextStep = Number(button.dataset.next);

      if (!validateStep(state.step)) {
        return;
      }

      if (nextStep === 5) {
        collectCustomerData();
        renderSummary();
      }

      goToStep(nextStep);
    });
  });

  document.querySelectorAll("[data-prev]").forEach(button => {
    button.addEventListener("click", () => {
      goToStep(Number(button.dataset.prev));
    });
  });

  document.querySelectorAll('input[name="meetingType"]').forEach(input => {
    input.addEventListener("change", () => {
      state.booking.meetingType = input.value;
      state.booking.meetingName = meetingNames[input.value] || input.value;
      state.booking.duration = Number(input.dataset.duration);

      state.booking.time = "";

      const timeSelect = document.getElementById("booking-time");

      if (timeSelect) {
        timeSelect.value = "";
      }

      updateAvailableTimes();
    });
  });

  document.getElementById("booking-date").addEventListener("change", event => {
    state.booking.date = event.target.value;
    state.booking.time = "";

    const timeSelect = document.getElementById("booking-time");

    if (timeSelect) {
      timeSelect.value = "";
    }

    updateAvailableTimes();
  });

  document.getElementById("booking-time").addEventListener("change", event => {
    state.booking.time = event.target.value;
  });

  document
    .getElementById("booking-form")
    .addEventListener("submit", handleSubmit);
}

function renderServices() {
  const container = document.getElementById("services-list");

  if (!container) {
    return;
  }

  container.innerHTML = state.services
    .map(
      service => `
        <label class="service-card">
          <input
            type="radio"
            name="service"
            value="${escapeHtml(service.id)}"
          >
          <span class="service-content">
            <strong>${escapeHtml(service.name)}</strong>
            <small>${escapeHtml(service.description)}</small>
          </span>
        </label>
      `
    )
    .join("");

  container
    .querySelectorAll('input[name="service"]')
    .forEach(input => {
      input.addEventListener("change", () => {
        const service = state.services.find(
          item => item.id === input.value
        );

        if (service) {
          state.booking.serviceId = service.id;
          state.booking.serviceName = service.name;
        }

        container.querySelectorAll(".service-card").forEach(card => {
          card.classList.remove("selected");
        });

        input.closest(".service-card")?.classList.add("selected");
      });
    });
}

function validateStep(step) {
  if (step === 1 && !state.booking.serviceId) {
    showMessage("يرجى اختيار الخدمة أولا.", "error");
    return false;
  }

  if (step === 2 && !state.booking.meetingType) {
    showMessage("يرجى اختيار نوع الاجتماع.", "error");
    return false;
  }

  if (step === 3) {
    const date = document.getElementById("booking-date").value;
    const time = document.getElementById("booking-time").value;

    if (!date || !time) {
      showMessage("يرجى اختيار التاريخ والوقت.", "error");
      return false;
    }

    state.booking.date = date;
    state.booking.time = time;
  }

  if (step === 4) {
    collectCustomerData();

    if (!state.booking.name || !state.booking.email) {
      showMessage("الاسم والبريد الإلكتروني مطلوبان.", "error");
      return false;
    }

    if (!isValidEmail(state.booking.email)) {
      showMessage("يرجى إدخال بريد إلكتروني صحيح.", "error");
      return false;
    }
  }

  clearMessage();
  return true;
}

function collectCustomerData() {
  state.booking.name =
    document.getElementById("customer-name")?.value.trim() || "";

  state.booking.email =
    document.getElementById("customer-email")?.value.trim() || "";

  state.booking.phone =
    document.getElementById("customer-phone")?.value.trim() || "";

  state.booking.projectName =
    document.getElementById("project-name")?.value.trim() || "";

  state.booking.projectUrl =
    document.getElementById("project-url")?.value.trim() || "";

  state.booking.projectDescription =
    document.getElementById("project-description")?.value.trim() || "";
}

function goToStep(step) {
  state.step = step;

  document.querySelectorAll(".step").forEach(section => {
    section.classList.toggle(
      "active",
      Number(section.dataset.stepContent) === step
    );
  });

  document.querySelectorAll(".progress-step").forEach(item => {
    item.classList.toggle(
      "active",
      Number(item.dataset.step) <= step
    );
  });

  const card = document.querySelector(".booking-card");

  if (card) {
    window.scrollTo({
      top: card.offsetTop - 30,
      behavior: "smooth"
    });
  }
}

function setMinimumDate() {
  const input = document.getElementById("booking-date");

  if (!input) {
    return;
  }

  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  input.min = `${year}-${month}-${day}`;
}

function updateAvailableTimes() {
  const select = document.getElementById("booking-time");
  const message = document.getElementById("availability-message");

  if (!select || !message) {
    return;
  }

  select.innerHTML = '<option value="">اختر الوقت</option>';

  if (!state.booking.date || !state.booking.duration) {
    message.textContent =
      "اختر التاريخ ونوع الاجتماع لعرض الأوقات المتاحة.";

    return;
  }

  const selectedDate = new Date(`${state.booking.date}T00:00:00`);
  const day = selectedDate.getDay();

  if (!state.availability.workingDays.includes(day)) {
    message.textContent =
      "هذا اليوم خارج أوقات العمل. اختر يوم عمل.";

    return;
  }

  const slots = generateSlots(
    state.availability.workingHours.start,
    state.availability.workingHours.end,
    state.booking.duration,
    state.availability.breaks || []
  );

  const existingBookings = getBookings();

  const availableSlots = slots.filter(time => {
    return !isSlotBooked(
      state.booking.date,
      time,
      state.booking.duration,
      existingBookings
    );
  });

  if (!availableSlots.length) {
    message.textContent =
      "لا توجد أوقات متاحة لهذا اليوم.";

    return;
  }

  availableSlots.forEach(time => {
    const option = document.createElement("option");

    option.value = time;
    option.textContent = time;

    select.appendChild(option);
  });

  message.textContent =
    `${availableSlots.length} موعد متاح.`;
}

function generateSlots(start, end, duration, breaks = []) {
  const slots = [];

  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  for (
    let current = startMinutes;
    current + duration <= endMinutes;
    current += 30
  ) {
    const slotEnd = current + duration;

    const overlapsBreak = breaks.some(item => {
      const breakStart = timeToMinutes(item.start);
      const breakEnd = timeToMinutes(item.end);

      return current < breakEnd && slotEnd > breakStart;
    });

    if (!overlapsBreak) {
      slots.push(minutesToTime(current));
    }
  }

  return slots;
}

function isSlotBooked(date, time, duration, bookings) {
  const start = timeToMinutes(time);
  const end = start + duration;

  return bookings.some(booking => {
    if (
      booking.date !== date ||
      booking.status === "cancelled"
    ) {
      return false;
    }

    const bookingStart = timeToMinutes(booking.time);
    const bookingEnd =
      bookingStart + Number(booking.duration || 30);

    return start < bookingEnd && end > bookingStart;
  });
}

function renderSummary() {
  const summary = document.getElementById("booking-summary");

  if (!summary) {
    return;
  }

  summary.innerHTML = `
    <div class="summary-row">
      <span>الخدمة</span>
      <strong>${escapeHtml(state.booking.serviceName)}</strong>
    </div>

    <div class="summary-row">
      <span>نوع الاجتماع</span>
      <strong>${escapeHtml(state.booking.meetingName)}</strong>
    </div>

    <div class="summary-row">
      <span>المدة</span>
      <strong>${state.booking.duration} دقيقة</strong>
    </div>

    <div class="summary-row">
      <span>التاريخ</span>
      <strong>${escapeHtml(state.booking.date)}</strong>
    </div>

    <div class="summary-row">
      <span>الوقت</span>
      <strong>${escapeHtml(state.booking.time)}</strong>
    </div>

    <div class="summary-row">
      <span>العميل</span>
      <strong>${escapeHtml(state.booking.name)}</strong>
    </div>

    <div class="summary-row">
      <span>البريد</span>
      <strong>${escapeHtml(state.booking.email)}</strong>
    </div>
  `;
}

function handleSubmit(event) {
  event.preventDefault();

  if (!validateStep(4)) {
    goToStep(4);
    return;
  }

  if (
    !state.booking.date ||
    !state.booking.time ||
    !state.booking.duration
  ) {
    showMessage(
      "بيانات الموعد غير مكتملة. اختر التاريخ والوقت.",
      "error"
    );

    goToStep(3);
    return;
  }

  const bookings = getBookings();

  if (
    isSlotBooked(
      state.booking.date,
      state.booking.time,
      state.booking.duration,
      bookings
    )
  ) {
    showMessage(
      "هذا الموعد تم حجزه للتو. اختر وقتا آخر.",
      "error"
    );

    goToStep(3);
    updateAvailableTimes();

    return;
  }

  const booking = {
    id: generateBookingId(),
    ...state.booking,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  bookings.push(booking);

  localStorage.setItem(
    "tradeSphareBookings",
    JSON.stringify(bookings)
  );

  localStorage.setItem(
    "tradeSphareLastBooking",
    JSON.stringify(booking)
  );

  window.location.href = "success.html";
}

function getBookings() {
  try {
    const bookings = JSON.parse(
      localStorage.getItem("tradeSphareBookings") || "[]"
    );

    return Array.isArray(bookings) ? bookings : [];
  } catch {
    return [];
  }
}

function generateBookingId() {
  const random = Math.floor(1000 + Math.random() * 9000);

  return `TS-${new Date().getFullYear()}-${random}`;
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}`;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showMessage(message, type) {
  const element = document.getElementById("form-message");

  if (!element) {
    return;
  }

  element.hidden = false;
  element.className = `form-message ${type}`;
  element.textContent = message;
}

function clearMessage() {
  const element = document.getElementById("form-message");

  if (!element) {
    return;
  }

  element.hidden = true;
  element.textContent = "";
}
