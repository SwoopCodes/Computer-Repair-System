/* Shared mock data for all wireframe prototypes.
   Load this file with <script src="../data.js"></script> before app.js in every theme. */

const STATUS_LABELS = { D: "Diagnosing", A: "Awaiting Approval", R: "Repairing", C: "Completed", X: "Declined" };
const PRIORITY_LABELS = { L: "Low", M: "Medium", H: "High", U: "Urgent" };

const CUSTOMERS = [
  { id: 1, first_name: "Maria", last_name: "Novak", email: "maria.novak@example.com", phone: "555-0101", address: "12 Birch St", registration_date: "2025-11-02" },
  { id: 2, first_name: "James", last_name: "Ortiz", email: "james.ortiz@example.com", phone: "555-0132", address: "48 Cedar Ave", registration_date: "2026-01-14" },
  { id: 3, first_name: "Aiko", last_name: "Tanaka", email: "aiko.tanaka@example.com", phone: "555-0170", address: "9 Maple Ct", registration_date: "2026-02-20" },
];

const TECHNICIANS = [
  { id: 1, first_name: "Sam", last_name: "Reyes", email: "sam.reyes@shop.com", phone: "555-0200" },
  { id: 2, first_name: "Priya", last_name: "Shah", email: "priya.shah@shop.com", phone: "555-0219" },
];

const INVENTORY = [
  { id: 1, product_name: "8GB DDR4 RAM", description: "Laptop SODIMM", current_stock: 14, price: 32.5 },
  { id: 2, product_name: "512GB NVMe SSD", description: "M.2 2280", current_stock: 3, price: 54.0 },
  { id: 3, product_name: "65W USB-C Charger", description: "Universal laptop charger", current_stock: 0, price: 21.0 },
  { id: 4, product_name: "Laptop Battery (generic)", description: "Fits most 14in models", current_stock: 6, price: 39.99 },
];

const TICKETS = [
  {
    id: 101, customer_id: 1, technician_id: 1, date_created: "2026-09-10",
    device_info: "Dell XPS 13", complaint: "Won't turn on",
    diagnosis_notes: "Dead battery, needs replacement.",
    status: "A", priority: "H",
    labor_cost: 40, total_cost: 79.99,
    reserved_parts: [{ product_id: 4, quantity: 1 }],
  },
  {
    id: 102, customer_id: 2, technician_id: 2, date_created: "2026-09-12",
    device_info: "HP Pavilion 15", complaint: "Very slow, freezes often",
    diagnosis_notes: "Failing HDD, recommend SSD upgrade + RAM.",
    status: "R", priority: "M",
    labor_cost: 60, total_cost: 146.5,
    reserved_parts: [{ product_id: 2, quantity: 1 }, { product_id: 1, quantity: 1 }],
  },
  {
    id: 103, customer_id: 3, technician_id: 1, date_created: "2026-09-13",
    device_info: "Lenovo ThinkPad T480", complaint: "Charger port loose, won't charge",
    diagnosis_notes: "Charger cable frayed, needs replacement.",
    status: "D", priority: "U",
    labor_cost: 0, total_cost: 0,
    reserved_parts: [],
  },
  {
    id: 104, customer_id: 1, technician_id: 2, date_created: "2026-09-05",
    device_info: "MacBook Air 2019", complaint: "Cracked screen",
    diagnosis_notes: "Screen replaced successfully.",
    status: "C", priority: "L",
    labor_cost: 80, total_cost: 210,
    reserved_parts: [],
  },
  {
    id: 105, customer_id: 2, technician_id: 1, date_created: "2026-09-08",
    device_info: "Acer Aspire 5", complaint: "Liquid spill, no power",
    diagnosis_notes: "Motherboard damage beyond economical repair.",
    status: "X", priority: "M",
    labor_cost: 25, total_cost: 25,
    reserved_parts: [],
  },
];

function findCustomer(id) { return CUSTOMERS.find(c => c.id === id); }
function findTechnician(id) { return TECHNICIANS.find(t => t.id === id); }
function findProduct(id) { return INVENTORY.find(p => p.id === id); }
