const API = "http://localhost:5000";

function convertToTimestamp(date, time) {
    // safety: if date or time missing, return empty
    if (!date || !time) return "";
    let [hours, minutes] = time.split(" ")[0].split(":");
    let ampm = time.split(" ")[1];

    hours = parseInt(hours);
    if (ampm === "PM" && hours !== 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    return `${date} ${hours.toString().padStart(2, "0")}:${minutes}:00`;
}

let rooms = [];
let bookings = [];

/* --------------------- LOAD ROOMS --------------------- */
async function loadRooms() {
    try {
        const res = await fetch(API + "/rooms", {
            credentials: "include"
        });
        if (!res.ok) throw new Error("Failed to fetch rooms: " + res.status);
        rooms = await res.json();
        console.log("rooms loaded:", rooms.length);
        return rooms;
    } catch (err) {
        console.error("loadRooms error:", err);
        rooms = [];
        return [];
    }
}

/* helper: fill room dropdown, ensures rooms are loaded first */
async function loadAllRooms() {
    // ensure rooms loaded
    if (!rooms || rooms.length === 0) {
        await loadRooms();
    }

    const dropdown = document.getElementById("roomSelect");
    if (!dropdown) return;
    dropdown.innerHTML = `<option value="">Select Room</option>`;

    rooms.forEach(r => {
        dropdown.innerHTML += `<option value="${r.no}">${r.no} (${r.type})</option>`;
    });
}

/* --------------------- LOAD BOOKINGS --------------------- */
async function loadBookings() {
    try {
        const res = await fetch(API + "/bookings", {
            credentials: "include"
        });
        if (!res.ok) {
            throw new Error("Failed to fetch bookings: " + res.status);
        }
        bookings = await res.json();
        console.log("bookings loaded:", bookings.length);
        return bookings;
    } catch (err) {
        console.error("loadBookings error:", err);
        bookings = [];
        return [];
    }
}

/* --------------------- PAGE SWITCH --------------------- */
function showSection(id) {
    document.querySelectorAll(".page-section").forEach(s => s.classList.add("d-none"));
    const el = document.getElementById(id);
    if (!el) {
        console.warn("showSection: no element with id", id);
        return;
    }
    el.classList.remove("d-none");

    // Decide actions per section
    if (id === "dashboard") {
        // always reload bookings then render
        loadBookings().then(() => renderDashboard());
    } else if (id === "bookingList") {
        loadBookings().then(() => renderBookingTable());
    } else if (id === "createBooking") {
        // ensure room list is fresh
        loadAllRooms();
    }
}

/* --------------------- DASHBOARD --------------------- */
function renderDashboard() {
    // stats
    document.getElementById("statAvailable").innerText = rooms.length;
    document.getElementById("statBooked").innerText = bookings.length;

    let today = new Date().toISOString().split('T')[0];

    let checkinsToday = bookings.filter(b => typeof b.checkIn === 'string' && b.checkIn.startsWith(today) && b.status === 'Checked-In').length;
    document.getElementById("statCheckins").innerText = checkinsToday;

    let checkoutsToday = bookings.filter(b => typeof b.checkOut === 'string' && b.checkOut.startsWith(today) && b.status === 'Checked-Out').length;
    document.getElementById("statCheckouts").innerText = checkoutsToday;

    let tbody = document.querySelector("#dashboardBookings tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    bookings.forEach(b => {
        let tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${b.id}</td>
            <td>${b.name}</td>
            <td>${b.room}</td>
            <td>${b.checkIn}</td>
            <td>${b.checkOut}</td>
            <td><span class="badge bg-info">${b.status}</span></td>
            <td>
                <button class="btn btn-sm btn-success" onclick="checkIn('${b.id}')">Check-In</button>
                <button class="btn btn-sm btn-danger" onclick="checkOut('${b.id}')">Check-Out</button>
                <button class="btn btn-sm btn-warning" onclick="deleteBooking('${b.id}')">Delete</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

/* --------------------- AVAILABILITY CHECK --------------------- */
const availabilityForm = document.getElementById("availabilityForm");
if (availabilityForm) {
    availabilityForm.onsubmit = async (e) => {
        e.preventDefault();

        const roomType = e.target.roomType ? e.target.roomType.value : "Any";
        const checkInDate = e.target.checkInDate ? e.target.checkInDate.value : "";
        const checkInTime = e.target.checkInTime ? e.target.checkInTime.value : "";
        const checkOutDate = e.target.checkOutDate ? e.target.checkOutDate.value : "";
        const checkOutTime = e.target.checkOutTime ? e.target.checkOutTime.value : "";

        let body = {
            roomType,
            checkIn: convertToTimestamp(checkInDate, checkInTime),
            checkOut: convertToTimestamp(checkOutDate, checkOutTime)
        };

        try {
            const res = await fetch(API + "/bookings/availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error("Availability API failed: " + err);
            }

            const available = await res.json();

            let box = document.getElementById("availabilityResults");
            if (!box) return;
            box.innerHTML = "";

            if (!available || available.length === 0) {
                box.innerHTML = `<p class="text-danger">No rooms available.</p>`;
                return;
            }

            available.forEach(r => {
                box.innerHTML += `
                    <div class="border p-2 mb-2 rounded">
                        <strong>${r.no}</strong> - ${r.type}
                        <button class="btn btn-sm btn-outline-primary float-end" onclick="selectRoom('${r.no}')">Select</button>
                    </div>`;
            });
        } catch (err) {
            console.error(err);
            alert("Failed to check availability. See console.");
        }
    };
}

/* --------------------- SELECT ROOM --------------------- */
function selectRoom(no) {
    showSection("createBooking");
    const roomSelect = document.getElementById("roomSelect");

    if (roomSelect) {
        let exists = Array.from(roomSelect.options).some(o => o.value === no);
        if (!exists) {
            let opt = document.createElement("option");
            opt.value = no;
            opt.innerText = no;
            roomSelect.appendChild(opt);
        }
        roomSelect.value = no;
    }
}

/* --------------------- CREATE BOOKING --------------------- */
document.getElementById("createBookingForm").onsubmit = async (e) => {
    e.preventDefault();
    let fd = new FormData(e.target);

    let body = {
        room: fd.get("room"),
        name: fd.get("name"),
        mobile: fd.get("mobile"),
        advance: fd.get("advance"),
        checkIn: fd.get("checkIn").replace("T", " ") + ":00",
        checkOut: fd.get("checkOut").replace("T", " ") + ":00"
    };

    await fetch(API + "/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
    });

    alert("Booking Saved!");

    await loadBookings();
    showSection("dashboard");
};


/* --------------------- BOOKING TABLE --------------------- */
function renderBookingTable() {
    let tbody = document.querySelector("#bookingTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    bookings.forEach(b => {
        let tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${b.id}</td>
            <td>${b.name}</td>
            <td>${b.mobile}</td>
            <td>${b.room}</td>
            <td>${b.checkIn}</td>
            <td>${b.checkOut}</td>
            <td>${b.status}</td>
            <td>
                <button class="btn btn-sm btn-success" onclick="checkIn('${b.id}')">Check-In</button>
                <button class="btn btn-sm btn-danger" onclick="checkOut('${b.id}')">Check-Out</button>
                <button class="btn btn-sm btn-warning" onclick="deleteBooking('${b.id}')">Delete</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

/* --------------------- CHECK-IN --------------------- */
async function checkIn(id) {
    try {
        const res = await fetch(API + `/bookings/${id}/checkin`, { method: "PUT", credentials: "include" });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || "Check-in failed");
        }
        await loadBookings();
        renderDashboard();
    } catch (err) {
        console.error(err);
        alert("Check-in failed. See console.");
    }
}

/* --------------------- CHECK-OUT --------------------- */
async function checkOut(id) {
    try {
        const res = await fetch(API + `/bookings/${id}/checkout`, { method: "PUT", credentials: "include" });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || "Check-out failed");
        }
        await loadBookings();
        renderDashboard();
    } catch (err) {
        console.error(err);
        alert("Check-out failed. See console.");
    }
}

/* --------------------- DELETE BOOKING --------------------- */
async function deleteBooking(id) {
    if (!confirm("Delete this booking?")) return;
    try {
        const res = await fetch(API + `/bookings/${id}`, { method: "DELETE", credentials: "include" });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || "Delete failed");
        }
        await loadBookings();
        renderDashboard();
        alert("Booking deleted!");
    } catch (err) {
        console.error(err);
        alert("Delete failed. See console.");
    }
}

/* --------------------- SEARCH --------------------- */
const searchBooking = document.getElementById("searchBooking");
if (searchBooking) {
    searchBooking.onkeyup = function () {
        let value = this.value.toLowerCase();
        document.querySelectorAll("#bookingTable tbody tr").forEach(tr => {
            tr.style.display = tr.innerText.toLowerCase().includes(value) ? "" : "none";
        });
    };
}

async function logout() {
    await fetch(API + "/auth/logout", { method: "POST", credentials: "include" });

    // Redirect to login page
    window.location.href = "login.html";
}


/* Expose to global for inline onclick handlers in HTML */
window.checkOut = checkOut;
window.checkIn = checkIn;
window.deleteBooking = deleteBooking;
window.showSection = showSection;
window.selectRoom = selectRoom;

/* --------------------- INIT ON PAGE LOAD --------------------- */
async function init() {
    // load everything once
    await Promise.all([loadRooms(), loadBookings()]);

    // render depending on default visible section
    // if dashboard is visible at start, render it; else ensure booking list form have data
    if (!document.querySelector(".page-section.d-none")) {
        // nothing hidden? render dashboard by default
        renderDashboard();
    }

    // If dashboard element exists and visible -> render
    const dashboardEl = document.getElementById("dashboard");
    if (dashboardEl && !dashboardEl.classList.contains("d-none")) {
        renderDashboard();
    }

    // If booking list visible
    const bookingListEl = document.getElementById("bookingList");
    if (bookingListEl && !bookingListEl.classList.contains("d-none")) {
        renderBookingTable();
    }

    // populate create booking dropdown if createBooking section visible
    const createEl = document.getElementById("createBooking");
    if (createEl && !createEl.classList.contains("d-none")) {
        loadAllRooms();
    }
}

// start
init();
/* --------------------- FORM SUBMISSION OVERRIDES --------------------- */