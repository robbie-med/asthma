const STORAGE_KEY = "asthma_action_plan_v1";

function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

function toNum(v){
  const n = Number(String(v || "").trim());
  return Number.isFinite(n) ? n : null;
}

function roundInt(n){
  return Math.round(n);
}

function setText(id, txt){
  const el = $(id);
  if (el) el.textContent = txt;
}

function setBadge(zone, detail){
  const b = $("#zoneBadge");
  const help = $("#zoneHelp");
  if (!b) return;

  b.className = "badge";
  if (!zone){
    b.classList.add("badge-neutral");
    b.textContent = "—";
    if (help) help.textContent = "Enter personal best + current to auto-calc.";
    return;
  }

  if (zone === "GREEN"){
    b.classList.add("badge-green");
    b.textContent = "Green";
  } else if (zone === "YELLOW"){
    b.classList.add("badge-yellow");
    b.textContent = "Yellow";
  } else {
    b.classList.add("badge-red");
    b.textContent = "Red";
  }

  if (help) help.textContent = detail || "";
}

function updateCuts(){
  const pbest = toNum($("#pbest")?.value);
  const greenCut = pbest ? roundInt(pbest * 0.80) : null;
  const yellowLow = pbest ? roundInt(pbest * 0.50) : null;
  const yellowHigh = pbest ? roundInt(pbest * 0.79) : null;
  const redCut = pbest ? roundInt(pbest * 0.50) : null;

  setText("#greenCut", greenCut ?? "—");
  setText("#yellowLow", yellowLow ?? "—");
  setText("#yellowHigh", yellowHigh ?? "—");
  setText("#redCut", redCut ?? "—");

  // Fill inline text spots
  $all("[data-fill='greenCutText']").forEach(el => el.textContent = greenCut ?? "—");
  $all("[data-fill='yellowLowText']").forEach(el => el.textContent = yellowLow ?? "—");
  $all("[data-fill='yellowHighText']").forEach(el => el.textContent = yellowHigh ?? "—");
  $all("[data-fill='redCutText']").forEach(el => el.textContent = redCut ?? "—");
}

function calcZone(){
  const pbest = toNum($("#pbest")?.value);
  const pcur = toNum($("#pcurrent")?.value);

  if (!pbest || !pcur){
    setBadge(null, "");
    return;
  }

  const pct = (pcur / pbest) * 100;

  if (pct >= 80){
    setBadge("GREEN", `${roundInt(pct)}% of personal best`);
  } else if (pct >= 50){
    setBadge("YELLOW", `${roundInt(pct)}% of personal best`);
  } else {
    setBadge("RED", `${roundInt(pct)}% of personal best`);
  }
}

function readAll(){
  const data = {};
  $all("[data-key]").forEach(el => {
    data[el.dataset.key] = el.value ?? "";
  });
  return data;
}

function writeAll(data){
  $all("[data-key]").forEach(el => {
    const k = el.dataset.key;
    if (Object.prototype.hasOwnProperty.call(data, k)){
      el.value = data[k];
    }
  });
}

function save(){
  const data = readAll();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try{
    const data = JSON.parse(raw);
    if (data && typeof data === "object"){
      writeAll(data);
    }
  }catch(e){}
}

function clearAll(){
  if (!confirm("Clear all fields?")) return;
  localStorage.removeItem(STORAGE_KEY);
  $all("[data-key]").forEach(el => el.value = "");
  updateCuts();
  calcZone();
  setBadge(null, "");
}

function wire(){
  // Load existing
  load();
  updateCuts();
  calcZone();

  // Auto-save on input
  $all("[data-key]").forEach(el => {
    el.addEventListener("input", () => {
      save();
      if (el.id === "pbest" || el.id === "pcurrent"){
        updateCuts();
        calcZone();
      }
    });
  });

  $("#btnSave")?.addEventListener("click", () => save());
  $("#btnClear")?.addEventListener("click", () => clearAll());
  $("#btnPrint")?.addEventListener("click", () => window.print());
}

document.addEventListener("DOMContentLoaded", wire);
