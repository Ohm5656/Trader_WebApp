import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { firebaseEnabled, auth, googleProvider } from "./firebase.js";
import { clearCloudJournal, listenToCloudJournal, saveProfile, saveTrade, seedCloudJournal, uploadTradeImages } from "./journal-store.js";

const bridge = {
  user: null, state: null, renderAll: null, syncSettings: null, toast: null, stopListening: null, syncTimer: null, seeded: false,
  connect({ state, renderAll, syncSettings, toast }) {
    this.state = state; this.renderAll = renderAll; this.syncSettings = syncSettings; this.toast = toast; renderSyncState();
    if (!firebaseEnabled) return;
    onAuthStateChanged(auth, (user) => { this.user = user; this.stopListening?.(); this.stopListening = null; this.seeded = false; renderSyncState(); if (user) this.stopListening = listenToCloudJournal(user.uid, (change) => this.applyCloudChange(change), (error) => this.toast(`Cloud sync error: ${error.message}`)); });
  },
  applyCloudChange(change) {
    if (change.type === "profile" && change.data) { Object.assign(this.state.settings, change.data.settings || {}); this.state.goal = Number(change.data.goal) || this.state.goal; localStorage.setItem("tradeboard-settings", JSON.stringify(this.state.settings)); localStorage.setItem("tradeboard-goal", String(this.state.goal)); this.syncSettings(); this.renderAll(); }
    if (change.type === "trades") { if (!change.data.length && !this.seeded) { this.seeded = true; seedCloudJournal(this.user.uid, this.state).catch((error) => this.toast(`Could not migrate local data: ${error.message}`)); return; } this.seeded = true; this.state.trades = change.data.sort((left, right) => left.date.localeCompare(right.date)); localStorage.setItem("tradeboard-trades", JSON.stringify(this.state.trades)); this.renderAll(); }
  },
  queueSync(state) { if (!firebaseEnabled || !this.user) return; window.clearTimeout(this.syncTimer); this.syncTimer = window.setTimeout(() => this.syncNow(state), 350); },
  async syncNow(state = this.state) { if (!firebaseEnabled) { this.toast("Add .env.local Firebase settings to enable cloud sync."); return; } if (!this.user) { this.toast("Sign in to sync this journal and upload images."); return; } try { await saveProfile(this.user.uid, { settings: state.settings, goal: state.goal }); await Promise.all(state.trades.map((trade) => saveTrade(this.user.uid, trade))); this.toast("Journal synced."); } catch (error) { this.toast(`Could not sync: ${error.message}`); } },
  async uploadImages(tradeDate, files) { if (!firebaseEnabled || !this.user) throw new Error("Sign in to sync before adding images."); return uploadTradeImages(this.user.uid, tradeDate, files, (done, total) => this.toast(`Uploading image ${done} of ${total}…`)); },
  async clearCloud(trades) { if (!firebaseEnabled || !this.user) return; try { await clearCloudJournal(this.user.uid, trades); } catch (error) { this.toast(`Cloud clear failed: ${error.message}`); throw error; } },
};

function renderSyncState() { const status = document.querySelector("#sync-status"); const button = document.querySelector("#auth-button"); if (!firebaseEnabled) { status.textContent = "Local-only journal"; button.textContent = "Configure Firebase"; return; } if (!bridge.user) { status.textContent = "Cloud sync available"; button.textContent = "Sign in to sync"; return; } status.textContent = "Cloud sync active"; button.textContent = "Sign out"; }
document.querySelector("#auth-button").addEventListener("click", async () => { if (!firebaseEnabled) { bridge.toast?.("Copy .env.example to .env.local and add the Firebase web config."); return; } try { if (bridge.user) await signOut(auth); else await signInWithPopup(auth, googleProvider); } catch (error) { bridge.toast?.(`Authentication failed: ${error.message}`); } });
window.tradeboardCloud = bridge;
await import("../app.js");
