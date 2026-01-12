(function () {
  var STORAGE_KEY = "asthma_action_plan_v1";

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function toNum(v) {
    var n = Number(String(v || "").trim());
    return isFinite(n) ? n : null;
  }

  function roundInt(n) { return Math.round(n); }

  function setText(sel, txt) {
    var el = $(sel);
    if (el) el.textContent = txt;
  }

  function setBadge(zone, detail) {
    var b = $("#zoneBadge");
    var help = $("#zoneHelp");
    if (!b) return;

    b.className = "badge";
    if (!zone) {
      b.classList.add("badge-neutral");
      b.textContent = "—";
      if (help) help.textContent = "Enter personal best + current to auto-calc.";
      return;
    }

    if (zone === "GREEN") {
      b.classList.add("badge-green");
      b.textContent = "Green";
    } else if (zone === "YELLOW") {
      b.classList.add("badge-yellow");
      b.textContent = "Yellow";
    } else {
      b.classList.add("badge-red");
      b.textContent = "Red";
    }

    if (help) help.textContent = detail || "";
  }

  function updateCuts() {
    var pbestEl = $("#pbest");
    var pbest = pbestEl ? toNum(pbestEl.value) : null;

    var greenCut = pbest ? roundInt(pbest * 0.80) : null;
    var yellowLow = pbest ? roundInt(pbest * 0.50) : null;
    var yellowHigh = pbest ? roundInt(pbest * 0.79) : null;
    var redCut = pbest ? roundInt(pbest * 0.50) : null;

    setText("#greenCut", greenCut !== null ? greenCut : "—");
    setText("#yellowLow", yellowLow !== null ? yellowLow : "—");
    setText("#yellowHigh", yellowHigh !== null ? yellowHigh : "—");
    setText("#redCut", redCut !== null ? redCut : "—");

    $all("[data-fill='greenCutText']").forEach(function (el) {
      el.textContent = greenCut !== null ? greenCut : "—";
    });
    $all("[data-fill='yellowLowText']").forEach(function (el) {
      el.textContent = yellowLow !== null ? yellowLow : "—";
    });
    $all("[data-fill='yellowHighText']").forEach(function (el) {
      el.textContent = yellowHigh !== null ? yellowHigh : "—";
    });
    $all("[data-fill='redCutText']").forEach(function (el) {
      el.textContent = redCut !== null ? redCut : "—";
    });
  }

  function calcZone() {
    var pbestEl = $("#pbest");
    var pcurEl = $("#pcurrent");
    var pbest = pbestEl ? toNum(pbestEl.value) : null;
    var pcur = pcurEl ? toNum(pcurEl.value) : null;

    if (!pbest || !pcur) {
      setBadge(null, "");
      return;
    }

    var pct = (pcur / pbest) * 100;

    if (pct >= 80) setBadge("GREEN", roundInt(pct) + "% of personal best");
    else if (pct >= 50) setBadge("YELLOW", roundInt(pct) + "% of personal best");
    else setBadge("RED", roundInt(pct) + "% of personal best");
  }

  function readAll() {
    var data = {};
    $all("[data-key]").forEach(function (el) {
      data[el.getAttribute("data-key")] = el.value || "";
    });
    return data;
  }

  function writeAll(data) {
    $all("[data-key]").forEach(function (el) {
      var k = el.getAttribute("data-key");
      if (Object.prototype.hasOwnProperty.call(data, k)) {
        el.value = data[k];
      }
    });
  }

  function save() {
    try {
      var data = readAll();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      showFatal("Save failed (localStorage blocked). Try a different browser or disable private mode.");
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data && typeof data === "object") writeAll(data);
    } catch (e) {
      // ignore
    }
  }

  function clearAll() {
    var ok = window.confirm("Clear all fields?");
    if (!ok) return;

    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}

    $all("[data-key]").forEach(function (el) { el.value = ""; });
    updateCuts();
    calcZone();
    setBadge(null, "");
  }

  function doPrint() {
    // Some iOS setups are picky; this keeps it strictly user-initiated.
    window.print();
  }

  function showFatal(msg) {
    var header = $(".page-header");
    if (!header) return;
    var existing = $("#jsErrorBanner");
    if (existing) existing.remove();

    var div = document.createElement("div");
    div.id = "jsErrorBanner";
    div.style.marginTop = "10px";
    div.style.padding = "10px 12px";
    div.style.border = "1px solid #b3261e";
    div.style.borderRadius = "10px";
    div.style.background = "#fff";
    div.style.color = "#b3261e";
    div.style.fontWeight = "600";
    div.textContent = msg;
    header.appendChild(div);
  }

  function wire() {
    // Sanity check: if these are missing, IDs don’t match HTML.
    if (!$("#btnPrint") || !$("#btnClear") || !$("#btnSave")) {
      showFatal("JS loaded, but buttons not found. Check IDs in index.html match btnPrint/btnClear/btnSave.");
      return;
    }

    load();
    updateCuts();
    calcZone();

    $all("[data-key]").forEach(function (el) {
      el.addEventListener("input", function () {
        save();
        if (el.id === "pbest" || el.id === "pcurrent") {
          updateCuts();
          calcZone();
        }
      });
    });

    $("#btnSave").addEventListener("click", save);
    $("#btnClear").addEventListener("click", clearAll);
    $("#btnPrint").addEventListener("click", doPrint);
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      wire();
    } catch (e) {
      showFatal("JavaScript crashed: " + (e && e.message ? e.message : String(e)));
    }
  });
})();
