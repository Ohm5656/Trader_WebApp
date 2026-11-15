const demoTrades = [
  { date: "2026-11-09", pnl: 68.28, count: 1, tag: "A+ trend day", note: "Stayed patient for the opening setup." },
  { date: "2026-11-10", pnl: 95.65, count: 1, tag: "Pullback", note: "Followed the plan and managed risk." },
  { date: "2026-11-11", pnl: 51.42, count: 1, tag: "Breakout", note: "Took profits at the first target." },
  { date: "2026-11-13", pnl: -20, count: 1, tag: "Reversal", note: "Stopped out. The setup was early." },
  { date: "2025-08-18", pnl: -276.85, count: 2, tag: "Review", note: "Historical example." },
];

const state = {
  page: "calendar", view: "month", cursor: new Date("2026-11-01T12:00:00"),
  settings: { showCounts: true, weekends: true, privacy: false },
  trades: []
};
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function initialise() {
  try { state.trades = JSON.parse(localStorage.getItem("tradeboard-trades")) || structuredClone(demoTrades); } catch { state.trades = structuredClone(demoTrades); }
  try { Object.assign(state.settings, JSON.parse(localStorage.getItem("tradeboard-settings")) || {}); } catch { /* use defaults */ }
  bindEvents(); syncSettings(); renderAll();
}
function persist() { localStorage.setItem("tradeboard-trades", JSON.stringify(state.trades)); localStorage.setItem("tradeboard-settings", JSON.stringify(state.settings)); }
function toKey(date) { return date.toISOString().slice(0, 10); }
function money(value, sign = true) { const abs = Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); return `${sign ? (value >= 0 ? "+" : "-") : ""}$${abs}`; }
function monthTrades(date = state.cursor) { return state.trades.filter((trade) => { const d = new Date(`${trade.date}T12:00:00`); return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth(); }); }
function sum(trades) { return trades.reduce((total, trade) => total + Number(trade.pnl), 0); }
function getTrade(key) { return state.trades.find((trade) => trade.date === key); }
function dateAt(year, month, day) { return new Date(year, month, day, 12); }
function renderAll() { renderSummary(); renderCalendar(); renderAnalytics(); document.body.classList.toggle("privacy", state.settings.privacy); }
function renderSummary() {
  const entries = monthTrades(); const total = sum(entries); const best = entries.reduce((top, item) => Math.max(top, item.pnl), 0);
  $("#month-total").textContent = money(total); $("#month-total").classList.toggle("negative", total < 0);
  $("#month-trades").textContent = `${entries.length} trading ${entries.length === 1 ? "day" : "days"}`;
  $("#best-day").textContent = money(best); $("#goal-progress").style.width = `${Math.min(Math.max(total / 1000 * 100, 0), 100)}%`;
}
function renderCalendar() {
  $$(".view-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === state.view));
  const node = $("#calendar-content");
  if (state.view === "month") { $("#period-title").textContent = `${monthNames[state.cursor.getMonth()]} ${state.cursor.getFullYear()}`; node.innerHTML = monthView(); }
  if (state.view === "week") { $("#period-title").textContent = weekTitle(); node.innerHTML = weekView(); }
  if (state.view === "year") { $("#period-title").textContent = state.cursor.getFullYear(); node.innerHTML = yearView(); }
  if (state.view === "all") { $("#period-title").textContent = "All trading history"; node.innerHTML = allTimeView(); }
}
function monthView() {
  const year = state.cursor.getFullYear(), month = state.cursor.getMonth(), first = dateAt(year, month, 1), lastDay = dateAt(year, month + 1, 0).getDate();
  const startDay = state.settings.weekends ? first.getDay() : (first.getDay() + 6) % 7;
  const totalColumns = state.settings.weekends ? 7 : 5;
  const weekdays = (state.settings.weekends ? daysShort : daysShort.slice(1)).map((day) => `<span>${day}</span>`).join("");
  let cells = "";
  for (let i = 0; i < startDay; i++) cells += `<div class="calendar-day empty"></div>`;
  for (let day = 1; day <= lastDay; day++) {
    const date = dateAt(year, month, day), key = toKey(date), trade = getTrade(key), isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (!state.settings.weekends && isWeekend) continue;
    const status = trade ? (trade.pnl >= 0 ? "win" : "loss") : "";
    const selected = key === "2026-11-15" ? "selected" : "";
    cells += `<button class="calendar-day ${status} ${selected}" data-trade-date="${key}" aria-label="${key}${trade ? `, ${money(trade.pnl)}` : ", no trade"}"><span class="day-number">${day}</span>${trade ? `<strong class="day-pnl">${money(trade.pnl)}</strong><small class="day-meta">${state.settings.showCounts ? `${trade.count} ${trade.count === 1 ? "trade" : "trades"}` : trade.tag}</small>` : `<strong class="day-pnl">—</strong>`}</button>`;
  }
  return `<div class="calendar-weekdays" style="grid-template-columns:repeat(${totalColumns},minmax(0,1fr))">${weekdays}</div><div class="month-grid" style="grid-template-columns:repeat(${totalColumns},minmax(0,1fr))">${cells}</div>`;
}
function startOfWeek(date) { const d = new Date(date); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dateAt(d.getFullYear(), d.getMonth(), d.getDate()); }
function weekTitle() { const start = startOfWeek(state.cursor), end = new Date(start); end.setDate(end.getDate() + 4); return `${monthNames[start.getMonth()].slice(0, 3)} ${start.getDate()} – ${monthNames[end.getMonth()].slice(0, 3)} ${end.getDate()}, ${end.getFullYear()}`; }
function weekView() { const start = startOfWeek(state.cursor); let rows = ""; for (let i = 0; i < 5; i++) { const date = new Date(start); date.setDate(start.getDate() + i); const key = toKey(date), trade = getTrade(key); rows += `<button class="week-row" data-trade-date="${key}"><span class="week-date">${date.getDate()}<small>${daysShort[date.getDay()]}</small></span>${trade ? `<strong class="week-pnl ${trade.pnl < 0 ? "negative" : ""}">${money(trade.pnl)}</strong><span class="week-note">${trade.tag || "Journal entry"}</span><span class="week-trades">${state.settings.showCounts ? `${trade.count} trade${trade.count !== 1 ? "s" : ""}` : "View note"}</span>` : `<strong class="week-pnl">—</strong><span class="week-note">No trade logged</span><span class="week-trades">—</span>`}</button>`; } return `<div class="week-list">${rows}</div>`; }
function yearView() { const year = state.cursor.getFullYear(); return `<div class="year-grid">${monthNames.map((name, month) => { const entries = state.trades.filter((trade) => { const date = new Date(`${trade.date}T12:00:00`); return date.getFullYear() === year && date.getMonth() === month; }); const boxes = Array.from({ length: 25 }, (_, index) => { const t = entries[index % Math.max(entries.length, 1)]; return `<i class="${t ? (t.pnl >= 0 ? "has-trade" : "has-loss") : ""}"></i>`; }).join(""); return `<article class="mini-month"><h3>${name.slice(0, 3)}</h3><div class="mini-squares">${boxes}</div><strong class="${sum(entries) < 0 ? "negative" : ""}">${entries.length ? money(sum(entries)) : "$0.00"}</strong></article>`; }).join("")}</div>`; }
function allTimeView() { const years = [...new Set(state.trades.map((trade) => new Date(`${trade.date}T12:00:00`).getFullYear()))].sort((a, b) => b - a); return `<div class="all-list">${years.map((year) => { const total = sum(state.trades.filter((trade) => new Date(`${trade.date}T12:00:00`).getFullYear() === year)); return `<article class="all-row ${total < 0 ? "negative" : ""}"><span>${year}</span><span>${money(total)}</span></article>`; }).join("")}</div>`; }
function renderAnalytics() { const entries = $("#analytics-range").value === "all" ? state.trades : monthTrades(); const wins = entries.filter((item) => item.pnl > 0), losses = entries.filter((item) => item.pnl < 0); const winRate = entries.length ? Math.round(wins.length / entries.length * 100) : 0; const grossProfit = sum(wins), grossLoss = Math.abs(sum(losses)); const factor = grossLoss ? (grossProfit / grossLoss).toFixed(2) : "—"; const expectancy = entries.length ? sum(entries) / entries.length : 0;
  $("#analytics-content").innerHTML = `<div class="analytics-grid"><article class="analytics-card"><p class="eyebrow">NET P&amp;L</p><p class="metric-number ${sum(entries) < 0 ? "negative" : "positive"}">${money(sum(entries))}</p><p class="metric-description">Across ${entries.length} journal entries</p></article><article class="analytics-card"><p class="eyebrow">EXPECTANCY</p><p class="metric-number ${expectancy < 0 ? "negative" : "positive"}">${money(expectancy)}</p><p class="metric-description">Average result per trading day</p></article><article class="analytics-card large"><h2>Win rate</h2><p class="metric-description">A quick view of profitable versus losing days.</p><div class="donut-wrap"><div class="donut" style="background:conic-gradient(var(--accent) 0deg ${winRate * 3.6}deg,var(--loss) ${winRate * 3.6}deg 360deg)"><div class="donut-center">${winRate}%<small>win rate</small></div></div><div class="legend"><span><i></i> ${wins.length} profitable days</span><span><i class="red"></i> ${losses.length} losing days</span><span>Profit factor <b>${factor}</b></span></div></div></article><article class="analytics-card large"><h2>Daily P&amp;L</h2><p class="metric-description">Your most recent journal entries.</p><div class="bar-chart">${entries.slice(-8).map((entry) => `<i class="bar ${entry.pnl < 0 ? "loss-bar" : ""}" style="--h:${Math.max(20, Math.min(Math.abs(entry.pnl) / 110 * 100, 100))}%"><span>${new Date(`${entry.date}T12:00:00`).getDate()}</span></i>`).join("") || "<p>No data yet.</p>"}</div></article></div>`;
}
function showPage(page) { state.page = page; $$(".page").forEach((section) => section.classList.toggle("active-page", section.id === `${page}-page`)); $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.page === page)); }
function changePeriod(offset) { if (state.view === "all") return; const d = new Date(state.cursor); if (state.view === "year") d.setFullYear(d.getFullYear() + offset); else if (state.view === "week") d.setDate(d.getDate() + offset * 7); else d.setMonth(d.getMonth() + offset); state.cursor = d; renderAll(); }
function toast(message) { const box = $("#toast"); box.textContent = message; box.classList.add("show-toast"); setTimeout(() => box.classList.remove("show-toast"), 2600); }
function showTrade(trade) { if (!trade) { toast("No entry logged for this day yet."); return; } toast(`${money(trade.pnl)} · ${trade.tag || "Journal entry"}${trade.note ? ` — ${trade.note}` : ""}`); }
function syncSettings() { $("#trade-count-toggle").checked = state.settings.showCounts; $("#weekends-toggle").checked = state.settings.weekends; $("#privacy-toggle").checked = state.settings.privacy; }
function exportJournal() { const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), trades: state.trades }, null, 2)], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "tradeboard-journal.json"; link.click(); URL.revokeObjectURL(link.href); toast("Journal export is ready."); }
function bindEvents() {
  $$("[data-page]").forEach((button) => button.addEventListener("click", () => showPage(button.dataset.page)));
  $$(".view-tab").forEach((button) => button.addEventListener("click", () => { state.view = button.dataset.view; renderCalendar(); }));
  $("#previous-period").addEventListener("click", () => changePeriod(-1)); $("#next-period").addEventListener("click", () => changePeriod(1));
  $("#calendar-content").addEventListener("click", (event) => { const item = event.target.closest("[data-trade-date]"); if (item) showTrade(getTrade(item.dataset.tradeDate)); });
  $("#open-trade-modal").addEventListener("click", openModal); $("#mobile-add").addEventListener("click", openModal);
  $("#trade-form").addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const date = form.get("date"); state.trades = state.trades.filter((item) => item.date !== date); state.trades.push({ date, pnl: Number(form.get("pnl")), count: Number(form.get("count")), tag: form.get("tag").trim(), note: form.get("note").trim() }); state.trades.sort((a, b) => a.date.localeCompare(b.date)); persist(); $("#trade-modal").close(); state.cursor = new Date(`${date}T12:00:00`); renderAll(); toast("Trading day saved."); });
  $("#analytics-range").addEventListener("change", renderAnalytics); $("#export-json").addEventListener("click", exportJournal); $("#reset-demo").addEventListener("click", () => { state.trades = structuredClone(demoTrades); persist(); renderAll(); toast("Demo journal restored."); });
  $("#trade-count-toggle").addEventListener("change", (event) => { state.settings.showCounts = event.target.checked; persist(); renderCalendar(); }); $("#weekends-toggle").addEventListener("change", (event) => { state.settings.weekends = event.target.checked; persist(); renderCalendar(); }); $("#privacy-toggle").addEventListener("change", (event) => { state.settings.privacy = event.target.checked; persist(); renderAll(); });
  $("#theme-button").addEventListener("click", () => { document.body.classList.toggle("soft-theme"); toast("Focus theme toggled."); });
}
function openModal() { const input = $("#trade-date"); input.value = toKey(state.cursor); $("#trade-modal").showModal(); }
initialise();
