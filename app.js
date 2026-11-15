const demoTrades = [
  { date: "2026-11-09", pnl: 68.28, count: 1, tag: "A+ trend day", note: "Stayed patient for the opening setup." },
  { date: "2026-11-10", pnl: 95.65, count: 1, tag: "Pullback", note: "Followed the plan and managed risk." },
  { date: "2026-11-11", pnl: 51.42, count: 1, tag: "Breakout", note: "Took profits at the first target." },
  { date: "2026-11-13", pnl: -20, count: 1, tag: "Reversal", note: "Stopped out. The setup was early." },
  { date: "2025-08-18", pnl: -276.85, count: 2, tag: "Review", note: "Historical example." },
];

const state = {
  page: "calendar", view: "month", analyticsScope: "month", cursor: new Date("2026-11-01T12:00:00"),
  settings: { showCounts: true, weekends: true, privacy: false }, trades: [], goal: 1000,
};
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function initialise() {
  try { state.trades = JSON.parse(localStorage.getItem("tradeboard-trades")) || structuredClone(demoTrades); } catch { state.trades = structuredClone(demoTrades); }
  try { Object.assign(state.settings, JSON.parse(localStorage.getItem("tradeboard-settings")) || {}); } catch { /* default settings */ }
  try { state.goal = Number(localStorage.getItem("tradeboard-goal")) || 1000; } catch { /* default goal */ }
  bindEvents(); syncSettings(); renderAll();
}
function persist() {
  localStorage.setItem("tradeboard-trades", JSON.stringify(state.trades));
  localStorage.setItem("tradeboard-settings", JSON.stringify(state.settings));
  localStorage.setItem("tradeboard-goal", String(state.goal));
}
function toKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function dateAt(year, month, day) { return new Date(year, month, day, 12); }
function sum(trades) { return trades.reduce((total, trade) => total + Number(trade.pnl), 0); }
function money(value, includePlus = false) { const number = Number(value); const sign = includePlus && number >= 0 ? "+" : number < 0 ? "-" : ""; return `${sign}$${Math.abs(number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function getTrade(key) { return state.trades.find((trade) => trade.date === key); }
function monthTrades(date = state.cursor) { return state.trades.filter((trade) => { const d = new Date(`${trade.date}T12:00:00`); return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth(); }); }
function yearTrades(year = state.cursor.getFullYear()) { return state.trades.filter((trade) => new Date(`${trade.date}T12:00:00`).getFullYear() === year); }
function visibleEntries() { if (state.view === "all") return state.trades; if (state.view === "year") return yearTrades(); if (state.view === "week") { const start = startOfWeek(state.cursor); const end = new Date(start); end.setDate(end.getDate() + 6); return state.trades.filter((trade) => { const date = new Date(`${trade.date}T12:00:00`); return date >= start && date <= end; }); } return monthTrades(); }

function renderAll() { renderCalendar(); renderAnalytics(); document.body.classList.toggle("privacy", state.settings.privacy); }
function renderCalendar() {
  const entries = visibleEntries(); const total = sum(entries); const isAll = state.view === "all";
  const title = state.view === "week" ? weekTitle() : state.view === "month" ? `${monthNames[state.cursor.getMonth()]} ${state.cursor.getFullYear()}` : state.view === "year" ? String(state.cursor.getFullYear()) : "All trading history";
  $("#period-title").textContent = title;
  $("#month-total").textContent = money(total);
  $("#month-total").classList.toggle("negative", total < 0);
  $("#month-trades").textContent = `${entries.length} trading ${entries.length === 1 ? "day" : "days"}`;
  $("#goal-label").textContent = state.view === "year" ? "Yearly goal" : "Monthly goal";
  $("#goal-current").textContent = money(total);
  $("#goal-target").textContent = money(state.view === "year" ? state.goal * 12 : state.goal);
  const goal = state.view === "year" ? state.goal * 12 : state.goal;
  $("#goal-progress").style.width = `${Math.max(0, Math.min(100, total / goal * 100))}%`;
  $("#calendar-page").classList.toggle("is-week", state.view === "week");
  $("#calendar-page").classList.toggle("is-all", isAll);
  $$(".view-tab").forEach((tab) => { const active = tab.dataset.view === state.view; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", String(active)); });
  $("#calendar-content").innerHTML = state.view === "month" ? monthView() : state.view === "week" ? weekView() : state.view === "year" ? yearView() : allTimeView();
}
function monthView() {
  const year = state.cursor.getFullYear(); const month = state.cursor.getMonth(); const first = dateAt(year, month, 1); const lastDay = dateAt(year, month + 1, 0).getDate();
  const days = state.settings.weekends ? daysShort.slice(1).concat("Sun") : daysShort.slice(1, 6);
  const columnCount = days.length; const mondayIndex = (first.getDay() + 6) % 7; let cells = "";
  for (let i = 0; i < mondayIndex; i += 1) cells += '<div class="calendar-day blank"></div>';
  for (let day = 1; day <= lastDay; day += 1) {
    const date = dateAt(year, month, day); const key = toKey(date); const trade = getTrade(key); const weekend = date.getDay() === 0 || date.getDay() === 6;
    if (!state.settings.weekends && weekend) continue;
    const status = trade ? (trade.pnl >= 0 ? "win" : "loss") : ""; const selected = key === "2026-11-15" ? "selected" : "";
    cells += `<button class="calendar-day ${status} ${selected}" data-trade-date="${key}" aria-label="${key}${trade ? ` ${money(trade.pnl)}` : " no trade"}"><span>${day}</span>${trade ? `<strong>${money(trade.pnl, true)}</strong><small>${state.settings.showCounts ? `${trade.count} ${trade.count === 1 ? "trade" : "trades"}` : trade.tag}</small>` : "<b>—</b>"}</button>`;
  }
  return `<div class="calendar-weekdays columns-${columnCount}">${days.map((day) => `<span>${day}</span>`).join("")}</div><div class="month-grid columns-${columnCount}">${cells}</div>`;
}
function startOfWeek(date) { const copy = new Date(date); copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7)); return dateAt(copy.getFullYear(), copy.getMonth(), copy.getDate()); }
function weekTitle() { const start = startOfWeek(state.cursor); const end = new Date(start); end.setDate(end.getDate() + 6); return `${monthNames[start.getMonth()].slice(0, 3)} ${start.getDate()} – ${monthNames[end.getMonth()].slice(0, 3)} ${end.getDate()}, ${end.getFullYear()}`; }
function weekView() { const start = startOfWeek(state.cursor); return `<div class="week-list">${Array.from({ length: 7 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); const key = toKey(date); const trade = getTrade(key); const direction = trade ? (trade.pnl >= 0 ? "↗" : "↘") : "—"; return `<button class="week-row ${trade?.pnl < 0 ? "loss-row" : ""}" data-trade-date="${key}"><span class="week-date">${date.getDate()}<small>${daysShort[date.getDay()]}</small></span><strong>${trade ? money(trade.pnl, true) : "–"}</strong><span class="week-trade-count">${trade && state.settings.showCounts ? `${trade.count} ${trade.count === 1 ? "trade" : "trades"}` : ""}</span><b class="week-direction">${direction}</b></button>`; }).join("")}</div>`; }
function miniSquares(entries) { const byDate = new Map(entries.map((entry) => [entry.date, entry])); const squares = []; for (let index = 0; index < 35; index += 1) { const entry = byDate.get([...byDate.keys()][index]); squares.push(`<i class="${entry ? (entry.pnl >= 0 ? "gain" : "loss") : ""}"></i>`); } return squares.join(""); }
function yearView() { const year = state.cursor.getFullYear(); return `<div class="year-grid">${monthNames.map((name, month) => { const entries = state.trades.filter((trade) => { const date = new Date(`${trade.date}T12:00:00`); return date.getFullYear() === year && date.getMonth() === month; }); const total = sum(entries); return `<button class="mini-month" data-month="${month}" aria-label="View ${name}"><span>${name.slice(0, 3)}</span><div class="mini-squares">${miniSquares(entries)}</div><strong class="${total < 0 ? "negative" : ""}">${money(total)}</strong></button>`; }).join("")}</div>`; }
function allTimeView() { const years = [...new Set(state.trades.map((trade) => new Date(`${trade.date}T12:00:00`).getFullYear()))].sort((a, b) => b - a); const total = sum(state.trades); const best = Math.max(...state.trades.map((trade) => trade.pnl)); const worst = Math.min(...state.trades.map((trade) => trade.pnl)); return `<div class="all-time-content"><div class="all-list">${years.map((year) => { const totalForYear = sum(yearTrades(year)); return `<button class="all-row ${totalForYear < 0 ? "negative" : ""}" data-year="${year}"><span>${year}</span><b>${money(totalForYear)}</b></button>`; }).join("")}</div><article class="quick-stats"><h2>Quick stats</h2><dl><div><dt>Daily average P&amp;L</dt><dd class="${total < 0 ? "negative" : ""}">${money(total / state.trades.length)}</dd></div><div><dt>Highest profit</dt><dd>${money(best)}</dd></div><div><dt>Highest loss</dt><dd class="negative">${money(worst)}</dd></div><div><dt>Trading days</dt><dd>${state.trades.length}</dd></div></dl><button data-page="analytics">See detailed analytics →</button></article></div>`; }

function renderAnalytics() {
  const entries = state.analyticsScope === "all" ? state.trades : monthTrades(); const wins = entries.filter((entry) => entry.pnl > 0); const losses = entries.filter((entry) => entry.pnl < 0); const grossProfit = sum(wins); const grossLoss = Math.abs(sum(losses)); const rate = entries.length ? Math.round(wins.length / entries.length * 100) : 0; const factor = grossLoss ? (grossProfit / grossLoss).toFixed(2) : "—"; const net = sum(entries);
  $("#analytics-range").innerHTML = `${state.analyticsScope === "all" ? "All time" : "This month"} <span>⌄</span>`;
  $("#analytics-content").innerHTML = `<section class="profit-card"><div class="profit-heading"><div><h1>Profit and Loss</h1><p>Total profit: <b>${money(grossProfit)}</b></p><p>Total loss: <em>${money(-grossLoss)}</em></p></div><button type="button" id="toggle-analytics-details">Details⌄</button></div><div class="donut-layout"><div class="donut" style="--share:${rate * 3.6}deg"><div><strong>${rate}%</strong><small>profitable</small></div></div><div class="donut-legend"><span><i></i>Profit <b>${money(grossProfit)}</b></span><span><i class="red"></i>Loss <b>${money(-grossLoss)}</b></span><span>Profit factor <b>${factor}</b></span></div></div><div class="analytics-details" id="analytics-details"><div><span>Net P&amp;L</span><b class="${net < 0 ? "negative" : ""}">${money(net)}</b></div><div><span>Expectancy</span><b class="${net < 0 ? "negative" : ""}">${money(entries.length ? net / entries.length : 0)}</b></div><div><span>Trading days</span><b>${entries.length}</b></div></div></section>`;
}
function showPage(page) { state.page = page; $$(".page").forEach((section) => section.classList.toggle("active-page", section.id === `${page}-page`)); $$('[data-page]').forEach((item) => item.classList.toggle("active", item.dataset.page === page)); }
function changePeriod(offset) { if (state.view === "all") return; const next = new Date(state.cursor); if (state.view === "week") next.setDate(next.getDate() + offset * 7); else if (state.view === "year") next.setFullYear(next.getFullYear() + offset); else next.setMonth(next.getMonth() + offset); state.cursor = next; renderAll(); }
function toast(message) { const box = $("#toast"); box.textContent = message; box.classList.add("show"); setTimeout(() => box.classList.remove("show"), 2600); }
function syncSettings() { $("#trade-count-toggle").checked = state.settings.showCounts; $("#privacy-toggle").checked = state.settings.privacy; $("#weekends-toggle-button b").textContent = state.settings.weekends ? "ON" : "OFF"; }
function openModal() { $("#trade-date").value = toKey(state.cursor); $("#trade-modal").showModal(); }
function exportJournal() { const body = JSON.stringify({ exportedAt: new Date().toISOString(), trades: state.trades }, null, 2); const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([body], { type: "application/json" })); link.download = "tradeboard-journal.json"; link.click(); URL.revokeObjectURL(link.href); toast("Journal export is ready."); }
function bindEvents() {
  $$('[data-page]').forEach((button) => button.addEventListener("click", () => showPage(button.dataset.page)));
  $$(".view-tab").forEach((button) => button.addEventListener("click", () => { state.view = button.dataset.view; renderCalendar(); }));
  $("#previous-period").addEventListener("click", () => changePeriod(-1)); $("#next-period").addEventListener("click", () => changePeriod(1));
  $("#calendar-content").addEventListener("click", (event) => { const entry = event.target.closest("[data-trade-date]"); const month = event.target.closest("[data-month]"); const year = event.target.closest("[data-year]"); if (entry) { const trade = getTrade(entry.dataset.tradeDate); toast(trade ? `${money(trade.pnl, true)} · ${trade.tag || "Journal entry"}` : "No entry logged for this day."); } if (month) { state.cursor = dateAt(state.cursor.getFullYear(), Number(month.dataset.month), 1); state.view = "month"; renderCalendar(); } if (year) { state.cursor = dateAt(Number(year.dataset.year), 0, 1); state.view = "year"; renderCalendar(); } });
  $("#open-trade-modal").addEventListener("click", openModal); $("#trade-form").addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const date = String(form.get("date")); state.trades = state.trades.filter((trade) => trade.date !== date); state.trades.push({ date, pnl: Number(form.get("pnl")), count: Number(form.get("count")), tag: String(form.get("tag")).trim(), note: String(form.get("note")).trim() }); state.trades.sort((a, b) => a.date.localeCompare(b.date)); state.cursor = new Date(`${date}T12:00:00`); persist(); $("#trade-modal").close(); renderAll(); toast("Trading day saved."); });
  $("#analytics-range").addEventListener("click", () => { state.analyticsScope = state.analyticsScope === "all" ? "month" : "all"; renderAnalytics(); });
  $("#analytics-content").addEventListener("click", (event) => { if (event.target.closest("#toggle-analytics-details")) $("#analytics-details").classList.toggle("open"); });
  $("#weekends-toggle-button").addEventListener("click", () => { state.settings.weekends = !state.settings.weekends; persist(); syncSettings(); renderCalendar(); });
  $("#trade-count-toggle").addEventListener("change", (event) => { state.settings.showCounts = event.target.checked; persist(); renderCalendar(); });
  $("#privacy-toggle").addEventListener("change", (event) => { state.settings.privacy = event.target.checked; persist(); renderAll(); });
  $("#export-json").addEventListener("click", exportJournal); $("#export-rail").addEventListener("click", exportJournal);
  $("#reset-demo").addEventListener("click", () => { state.trades = structuredClone(demoTrades); persist(); renderAll(); toast("Demo journal restored."); });
  $("#clear-local-data").addEventListener("click", () => { if (window.confirm("Clear locally stored Tradeboard entries?")) { state.trades = []; persist(); renderAll(); toast("Local journal cleared."); } });
  $("#edit-goal").addEventListener("click", () => { const next = window.prompt("Set your monthly goal", String(state.goal)); if (next !== null && Number(next) > 0) { state.goal = Number(next); persist(); renderCalendar(); toast("Monthly goal updated."); } });
}

initialise();
