/* Shared interaction logic for all wireframe prototypes. Vanilla JS, in-memory mock data only
   (nothing persists across a page reload — this is a low-fidelity prototype, not a real app). */

function statusBadge(code) {
  return `<span class="badge badge-status badge-status-${code}" aria-label="Status: ${STATUS_LABELS[code]}">${STATUS_LABELS[code]}</span>`;
}
function priorityBadge(code) {
  return `<span class="badge badge-priority badge-priority-${code}" aria-label="Priority: ${PRIORITY_LABELS[code]}">${PRIORITY_LABELS[code]}</span>`;
}
function money(n) { return "$" + Number(n).toFixed(2); }

/* ---------- Dashboard ---------- */
function renderDashboard() {
  const counts = { D: 0, A: 0, R: 0, C: 0, X: 0 };
  TICKETS.forEach(t => counts[t.status]++);
  const openCount = counts.D + counts.A + counts.R;

  document.getElementById("stat-open").textContent = openCount;
  document.getElementById("stat-awaiting").textContent = counts.A;
  const completedEl = document.getElementById("stat-completed");
  if (completedEl) completedEl.textContent = counts.C;

  const priorityCounts = { L: 0, M: 0, H: 0, U: 0 };
  TICKETS.filter(t => t.status !== "C" && t.status !== "X").forEach(t => priorityCounts[t.priority]++);
  document.getElementById("priority-breakdown").innerHTML = Object.keys(priorityCounts)
    .map(p => `<li>${priorityBadge(p)} <span class="count">${priorityCounts[p]}</span></li>`).join("");

  const recent = [...TICKETS].sort((a, b) => b.date_created.localeCompare(a.date_created)).slice(0, 5);
  document.getElementById("recent-tickets").innerHTML = recent.map(t => {
    const c = findCustomer(t.customer_id);
    return `<li><a href="tickets.html#ticket-${t.id}">#${t.id} — ${t.device_info} (${c.first_name} ${c.last_name})</a> ${statusBadge(t.status)} ${priorityBadge(t.priority)}</li>`;
  }).join("");
}

/* ---------- Tickets: master-detail ---------- */
let selectedTicketId = null;
let ticketListFilter = null; // null = show all (themes with no Active/Closed tab UI); "active" | "closed" otherwise
const ACTIVE_STATUSES = ["D", "A", "R"];
const CLOSED_STATUSES = ["C", "X"];

function visibleTickets() {
  if (ticketListFilter === null) return TICKETS;
  const statuses = ticketListFilter === "closed" ? CLOSED_STATUSES : ACTIVE_STATUSES;
  return TICKETS.filter(t => statuses.includes(t.status));
}

function renderTicketList() {
  const list = document.getElementById("ticket-list");
  const tickets = visibleTickets();
  list.innerHTML = tickets.map(t => {
    const c = findCustomer(t.customer_id);
    return `<li>
      <button class="list-row" id="row-ticket-${t.id}" data-id="${t.id}" aria-current="${t.id === selectedTicketId ? "true" : "false"}">
        <span class="row-title">#${t.id} · ${t.device_info}</span>
        <span class="row-sub">${c.first_name} ${c.last_name}</span>
        <span class="row-badges">${statusBadge(t.status)} ${priorityBadge(t.priority)}</span>
      </button>
    </li>`;
  }).join("") || `<li class="empty-state">No ${ticketListFilter ? ticketListFilter + " " : ""}tickets.</li>`;
  list.querySelectorAll(".list-row").forEach(btn => {
    btn.addEventListener("click", () => selectTicket(Number(btn.dataset.id)));
  });
}

function selectTicket(id) {
  selectedTicketId = id;
  renderTicketList();
  renderTicketDetail(id);
}

function renderTicketDetail(id) {
  const t = TICKETS.find(t => t.id === id);
  const panel = document.getElementById("ticket-detail");
  if (!t) { panel.innerHTML = `<p class="empty-state">Select a ticket from the list to view and update it.</p>`; return; }
  const c = findCustomer(t.customer_id);
  const tech = findTechnician(t.technician_id);

  const partsRows = t.reserved_parts.map(rp => {
    const p = findProduct(rp.product_id);
    return `<li>${p.product_name} × ${rp.quantity}</li>`;
  }).join("") || `<li class="empty-state">No parts reserved.</li>`;

  const approvalButtons = t.status === "A" ? `
    <div class="approval-actions">
      <button class="btn btn-approve" data-action="approve">Approved</button>
      <button class="btn btn-decline" data-action="decline">Not Approved</button>
    </div>
    <p class="hint">Recording the customer's decision, given in person or by phone — the customer does not use this system.</p>
  ` : "";

  const checklist = (t.status === "R" || t.status === "C") ? `
    <section class="checklist" aria-labelledby="checklist-heading-${t.id}">
      <h3 id="checklist-heading-${t.id}">Closure Checklist</h3>
      <ul>
        <li><label><input type="checkbox" ${t.status === "C" ? "checked disabled" : ""}> Diagnosis &amp; repair notes finalized</label></li>
        <li><label><input type="checkbox" ${t.status === "C" ? "checked disabled" : ""}> Reserved parts consumed</label></li>
        <li><label><input type="checkbox" ${t.status === "C" ? "checked disabled" : ""}> Total cost confirmed</label></li>
      </ul>
      ${t.status === "R" ? `<button class="btn btn-primary" data-action="complete">Complete Ticket</button>` : `<p class="hint">Ticket completed.</p>`}
    </section>
  ` : "";

  panel.innerHTML = `
    <div class="detail-header">
      <h2>Ticket #${t.id} ${statusBadge(t.status)} ${priorityBadge(t.priority)}</h2>
      <p class="detail-sub">${c.first_name} ${c.last_name} · assigned to ${tech.first_name} ${tech.last_name} · ${t.date_created}</p>
    </div>

    <div class="field-row">
      <label for="f-device">Device</label>
      <input id="f-device" type="text" value="${t.device_info}">
    </div>
    <div class="field-row">
      <label for="f-complaint">Complaint</label>
      <textarea id="f-complaint" rows="2">${t.complaint}</textarea>
    </div>
    <div class="field-row">
      <label for="f-notes">Diagnosis / repair notes</label>
      <textarea id="f-notes" rows="3">${t.diagnosis_notes}</textarea>
    </div>

    <div class="field-grid">
      <div class="field-row">
        <label for="f-status">Status</label>
        <select id="f-status">
          ${Object.keys(STATUS_LABELS).map(code => `<option value="${code}" ${code === t.status ? "selected" : ""}>${STATUS_LABELS[code]}</option>`).join("")}
        </select>
      </div>
      <div class="field-row">
        <label for="f-priority">Priority</label>
        <select id="f-priority">
          ${Object.keys(PRIORITY_LABELS).map(code => `<option value="${code}" ${code === t.priority ? "selected" : ""}>${PRIORITY_LABELS[code]}</option>`).join("")}
        </select>
      </div>
    </div>

    <div class="field-grid">
      <div class="field-row">
        <label for="f-labor">Labor cost</label>
        <input id="f-labor" type="number" step="0.01" value="${t.labor_cost}">
      </div>
      <div class="field-row">
        <label>Total quote</label>
        <output>${money(t.total_cost)}</output>
      </div>
    </div>

    <section aria-labelledby="parts-heading-${t.id}">
      <h3 id="parts-heading-${t.id}">Reserved Parts</h3>
      <ul class="parts-list">${partsRows}</ul>
      <p class="hint">Reserve a part for this ticket from the <a href="reserve-parts.html">Reserve Parts</a> screen, or view all reservations on the <a href="inventory.html">Inventory</a> screen's Reserved tab.</p>
    </section>

    ${approvalButtons}
    ${checklist}

    <button class="btn btn-primary" data-action="save">Save Changes</button>
    <p class="save-msg" role="status" aria-live="polite"></p>
  `;

  panel.querySelector('[data-action="save"]').addEventListener("click", () => {
    t.device_info = document.getElementById("f-device").value;
    t.complaint = document.getElementById("f-complaint").value;
    t.diagnosis_notes = document.getElementById("f-notes").value;
    t.status = document.getElementById("f-status").value;
    t.priority = document.getElementById("f-priority").value;
    t.labor_cost = Number(document.getElementById("f-labor").value);
    panel.querySelector(".save-msg").textContent = "Saved.";
    renderTicketList();
    renderTicketDetail(t.id);
  });

  const approveBtn = panel.querySelector('[data-action="approve"]');
  const declineBtn = panel.querySelector('[data-action="decline"]');
  if (approveBtn) approveBtn.addEventListener("click", () => { t.status = "R"; renderTicketList(); renderTicketDetail(t.id); });
  if (declineBtn) declineBtn.addEventListener("click", () => { t.status = "X"; renderTicketList(); renderTicketDetail(t.id); });

  const completeBtn = panel.querySelector('[data-action="complete"]');
  if (completeBtn) completeBtn.addEventListener("click", () => { t.status = "C"; renderTicketList(); renderTicketDetail(t.id); });
}

function initTicketsPage() {
  const tabs = document.querySelectorAll("[data-ticket-filter]");
  if (tabs.length) {
    ticketListFilter = "active";
    tabs.forEach(tab => tab.addEventListener("click", () => {
      ticketListFilter = tab.dataset.ticketFilter;
      tabs.forEach(t => t.setAttribute("aria-selected", t === tab ? "true" : "false"));
      if (selectedTicketId !== null && !visibleTickets().some(t => t.id === selectedTicketId)) {
        selectedTicketId = null;
        renderTicketDetail(null);
      }
      renderTicketList();
    }));
  }

  renderTicketList();
  const hash = location.hash.match(/ticket-(\d+)/);
  if (hash) {
    const id = Number(hash[1]);
    const ticket = TICKETS.find(t => t.id === id);
    if (ticket && tabs.length) {
      ticketListFilter = ACTIVE_STATUSES.includes(ticket.status) ? "active" : "closed";
      tabs.forEach(t => t.setAttribute("aria-selected", t.dataset.ticketFilter === ticketListFilter ? "true" : "false"));
      renderTicketList();
    }
    selectTicket(id);
  } else {
    renderTicketDetail(null);
  }
}

/* ---------- Create Ticket ---------- */
function initNewTicketForm() {
  const custSelect = document.getElementById("nt-customer");
  custSelect.innerHTML = CUSTOMERS.map(c => `<option value="${c.id}">${c.first_name} ${c.last_name}</option>`).join("");
  const techSelect = document.getElementById("nt-technician");
  techSelect.innerHTML = TECHNICIANS.map(t => `<option value="${t.id}">${t.first_name} ${t.last_name}</option>`).join("");

  document.getElementById("new-ticket-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const newId = Math.max(...TICKETS.map(t => t.id)) + 1;
    TICKETS.push({
      id: newId,
      customer_id: Number(custSelect.value),
      technician_id: Number(techSelect.value),
      date_created: new Date().toISOString().slice(0, 10),
      device_info: document.getElementById("nt-device").value,
      complaint: document.getElementById("nt-complaint").value,
      diagnosis_notes: "",
      status: "D",
      priority: document.getElementById("nt-priority").value,
      labor_cost: 0, total_cost: 0,
      reserved_parts: [],
    });
    location.href = `tickets.html#ticket-${newId}`;
  });
}

/* ---------- Customers: master-detail ---------- */
let selectedCustomerId = null;

function renderCustomerList() {
  const list = document.getElementById("customer-list");
  list.innerHTML = CUSTOMERS.map(c => `
    <li><button class="list-row" data-id="${c.id}" aria-current="${c.id === selectedCustomerId ? "true" : "false"}">
      <span class="row-title">${c.first_name} ${c.last_name}</span>
      <span class="row-sub">${c.email}</span>
    </button></li>
  `).join("");
  list.querySelectorAll(".list-row").forEach(btn => btn.addEventListener("click", () => selectCustomer(Number(btn.dataset.id))));
}

function selectCustomer(id) {
  selectedCustomerId = id;
  renderCustomerList();
  const c = findCustomer(id);
  const panel = document.getElementById("customer-detail");
  const theirTickets = TICKETS.filter(t => t.customer_id === id);
  panel.innerHTML = `
    <h2>${c.first_name} ${c.last_name}</h2>
    <div class="field-grid">
      <div class="field-row"><label for="c-first">First name</label><input id="c-first" value="${c.first_name}"></div>
      <div class="field-row"><label for="c-last">Last name</label><input id="c-last" value="${c.last_name}"></div>
    </div>
    <div class="field-row"><label for="c-email">Email</label><input id="c-email" type="email" value="${c.email}"></div>
    <div class="field-row"><label for="c-phone">Phone</label><input id="c-phone" value="${c.phone}"></div>
    <div class="field-row"><label for="c-address">Address</label><input id="c-address" value="${c.address}"></div>
    <button class="btn btn-primary" data-action="save">Save Changes</button>
    <p class="save-msg" role="status" aria-live="polite"></p>
    <section><h3>Tickets</h3>
      <ul class="linked-list">${theirTickets.map(t => `<li><a href="tickets.html#ticket-${t.id}">#${t.id} — ${t.device_info}</a> ${statusBadge(t.status)}</li>`).join("") || `<li class="empty-state">No tickets yet.</li>`}</ul>
    </section>
  `;
  panel.querySelector('[data-action="save"]').addEventListener("click", () => {
    c.first_name = document.getElementById("c-first").value;
    c.last_name = document.getElementById("c-last").value;
    c.email = document.getElementById("c-email").value;
    c.phone = document.getElementById("c-phone").value;
    c.address = document.getElementById("c-address").value;
    panel.querySelector(".save-msg").textContent = "Saved.";
    renderCustomerList();
  });
}

function initCustomersPage() {
  renderCustomerList();
  document.getElementById("add-customer-btn").addEventListener("click", () => {
    const newId = Math.max(...CUSTOMERS.map(c => c.id)) + 1;
    CUSTOMERS.push({ id: newId, first_name: "New", last_name: "Customer", email: "", phone: "", address: "", registration_date: new Date().toISOString().slice(0, 10) });
    selectCustomer(newId);
  });
}

/* ---------- Technicians: master-detail ---------- */
let selectedTechnicianId = null;

function renderTechnicianList() {
  const list = document.getElementById("technician-list");
  list.innerHTML = TECHNICIANS.map(t => `
    <li><button class="list-row" data-id="${t.id}" aria-current="${t.id === selectedTechnicianId ? "true" : "false"}">
      <span class="row-title">${t.first_name} ${t.last_name}</span>
      <span class="row-sub">${t.email}</span>
    </button></li>
  `).join("");
  list.querySelectorAll(".list-row").forEach(btn => btn.addEventListener("click", () => selectTechnician(Number(btn.dataset.id))));
}

function selectTechnician(id) {
  selectedTechnicianId = id;
  renderTechnicianList();
  const t = findTechnician(id);
  const panel = document.getElementById("technician-detail");
  const assigned = TICKETS.filter(tk => tk.technician_id === id && tk.status !== "C" && tk.status !== "X");
  panel.innerHTML = `
    <h2>${t.first_name} ${t.last_name}</h2>
    <div class="field-grid">
      <div class="field-row"><label for="t-first">First name</label><input id="t-first" value="${t.first_name}"></div>
      <div class="field-row"><label for="t-last">Last name</label><input id="t-last" value="${t.last_name}"></div>
    </div>
    <div class="field-row"><label for="t-email">Email</label><input id="t-email" type="email" value="${t.email}"></div>
    <div class="field-row"><label for="t-phone">Phone</label><input id="t-phone" value="${t.phone}"></div>
    <button class="btn btn-primary" data-action="save">Save Changes</button>
    <p class="save-msg" role="status" aria-live="polite"></p>
    <section><h3>Currently assigned tickets</h3>
      <ul class="linked-list">${assigned.map(tk => `<li><a href="tickets.html#ticket-${tk.id}">#${tk.id} — ${tk.device_info}</a> ${statusBadge(tk.status)}</li>`).join("") || `<li class="empty-state">No open tickets.</li>`}</ul>
    </section>
  `;
  panel.querySelector('[data-action="save"]').addEventListener("click", () => {
    t.first_name = document.getElementById("t-first").value;
    t.last_name = document.getElementById("t-last").value;
    t.email = document.getElementById("t-email").value;
    t.phone = document.getElementById("t-phone").value;
    panel.querySelector(".save-msg").textContent = "Saved.";
    renderTechnicianList();
  });
}

function initTechniciansPage() {
  renderTechnicianList();
  document.getElementById("add-technician-btn").addEventListener("click", () => {
    const newId = Math.max(...TECHNICIANS.map(t => t.id)) + 1;
    TECHNICIANS.push({ id: newId, first_name: "New", last_name: "Technician", email: "", phone: "" });
    selectTechnician(newId);
  });
}

/* ---------- Inventory: Stock / Reserved tabs ---------- */
function renderStockTab() {
  document.getElementById("stock-body").innerHTML = INVENTORY.map(p => `
    <tr><td>${p.product_name}</td><td>${p.description}</td><td>${p.current_stock}</td><td>${money(p.price)}</td></tr>
  `).join("");
}
function renderReservedTab() {
  const rows = [];
  TICKETS.filter(t => t.status !== "C" && t.status !== "X").forEach(t => {
    t.reserved_parts.forEach(rp => {
      const p = findProduct(rp.product_id);
      rows.push(`<tr><td>${p.product_name}</td><td>${rp.quantity}</td><td><a href="tickets.html#ticket-${t.id}">#${t.id} — ${t.device_info}</a></td></tr>`);
    });
  });
  document.getElementById("reserved-body").innerHTML = rows.join("") || `<tr><td colspan="3" class="empty-state">No parts currently reserved.</td></tr>`;
}
function initInventoryPage() {
  renderStockTab();
  renderReservedTab();
  const tabs = document.querySelectorAll("[data-tab]");
  tabs.forEach(tab => tab.addEventListener("click", () => {
    tabs.forEach(t => t.setAttribute("aria-selected", "false"));
    tab.setAttribute("aria-selected", "true");
    document.querySelectorAll(".tab-panel").forEach(p => p.hidden = true);
    document.getElementById(tab.dataset.tab).hidden = false;
  }));
}

/* ---------- Reserve Parts ---------- */
function initReservePartsPage() {
  const ticketSelect = document.getElementById("rp-ticket");
  const activeTickets = TICKETS.filter(t => ACTIVE_STATUSES.includes(t.status));
  ticketSelect.innerHTML = activeTickets.map(t => {
    const c = findCustomer(t.customer_id);
    return `<option value="${t.id}">#${t.id} — ${t.device_info} (${c.first_name} ${c.last_name})</option>`;
  }).join("") || `<option value="">No active tickets</option>`;

  const partSelect = document.getElementById("rp-part");
  function refreshPartOptions() {
    partSelect.innerHTML = INVENTORY.map(p => `<option value="${p.id}">${p.product_name} (in stock: ${p.current_stock})</option>`).join("");
  }
  refreshPartOptions();

  document.getElementById("reserve-parts-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = document.getElementById("reserve-msg");
    const ticket = TICKETS.find(t => t.id === Number(ticketSelect.value));
    const product = findProduct(Number(partSelect.value));
    const qty = Number(document.getElementById("rp-qty").value) || 0;

    if (!ticket) { msg.textContent = "Select a ticket first."; return; }
    if (product.current_stock < qty) {
      msg.textContent = `Not enough stock — only ${product.current_stock} × ${product.product_name} in stock. Buy more from Purchasing.`;
      return;
    }

    product.current_stock -= qty;
    const existing = ticket.reserved_parts.find(rp => rp.product_id === product.id);
    if (existing) existing.quantity += qty;
    else ticket.reserved_parts.push({ product_id: product.id, quantity: qty });

    msg.textContent = `Reserved ${qty} × ${product.product_name} for ticket #${ticket.id}.`;
    refreshPartOptions();
  });
}

/* ---------- Purchasing ---------- */
function initPurchasingPage() {
  const select = document.getElementById("buy-part");
  select.innerHTML = INVENTORY.map(p => `<option value="${p.id}">${p.product_name} (in stock: ${p.current_stock})</option>`).join("");
  document.getElementById("buy-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const p = findProduct(Number(select.value));
    const qty = Number(document.getElementById("buy-qty").value) || 0;
    p.current_stock += qty;
    document.getElementById("buy-msg").textContent = `Added ${qty} × ${p.product_name} to stock. New stock: ${p.current_stock}.`;
    select.innerHTML = INVENTORY.map(p => `<option value="${p.id}">${p.product_name} (in stock: ${p.current_stock})</option>`).join("");
  });
}
