const $ = (s) => document.querySelector(s);
let scanId = null;

function addLog(text, cls) {
  const d = document.createElement("div");
  d.className = "line " + (cls || "");
  d.textContent = text;
  $("#log").appendChild(d);
  $("#log").scrollTop = $("#log").scrollHeight;
}

function scoreColor(n) { return n < 50 ? "var(--crit)" : n < 80 ? "var(--med)" : "var(--ok)"; }

function setScore(stage, n) {
  const el = stage === "before" ? $("#sBefore") : $("#sAfter");
  el.textContent = n;
  el.style.color = scoreColor(n);
  if (stage === "after") { $("#arrow").hidden = false; $("#afterBox").hidden = false; }
}

function addCard(sev, name, text) {
  const d = document.createElement("div");
  d.className = "card " + sev;
  const b = document.createElement("span");
  b.className = "badge " + sev;
  b.textContent = sev;
  const t = document.createElement("b");
  t.textContent = name;
  const p = document.createElement("div");
  p.textContent = text;
  d.append(b, t, p);
  $("#cards").appendChild(d);
}

function busy(on) { $("#run").disabled = on; if (on) $("#patch").disabled = true; }

function stream(url) {
  busy(true);
  const es = new EventSource(url);
  const stop = () => { es.close(); $("#run").disabled = false; };
  es.onmessage = (m) => {
    const e = JSON.parse(m.data);
    if (e.type === "phase") { $("#phase").textContent = e.text; addLog("> " + e.text, "sys"); }
    if (e.type === "attack") addLog("[" + e.stage + "] " + e.attack + " #" + e.variant + "  " + (e.success ? "BROKE" : "held") + "  - " + e.evidence, e.success ? "bad" : "ok");
    if (e.type === "score") setScore(e.stage, e.score);
    if (e.type === "explain") addCard(e.severity, e.name, e.text);
    if (e.type === "patch") {
      const box = $("#patchInfo");
      box.hidden = false;
      box.innerHTML = "<b>Patch applied</b><ul></ul>";
      e.changes.forEach((c) => { const li = document.createElement("li"); li.textContent = c; box.querySelector("ul").appendChild(li); });
    }
    if (e.type === "error") { $("#phase").textContent = e.text; addLog("! " + e.text, "bad"); stop(); }
    if (e.type === "done") {
      if (e.stage === "scan") { scanId = e.id; $("#patch").disabled = !e.canPatch; $("#phase").textContent = e.canPatch ? "Scan done. Click Patch and re-test." : "Nothing broke this time."; }
      else $("#phase").textContent = "Done. Score " + e.before + " to " + e.after + ".";
      stop();
    }
  };
  es.onerror = () => { addLog("! connection closed", "bad"); stop(); };
}

$("#run").onclick = () => {
  $("#log").innerHTML = ""; $("#cards").innerHTML = "";
  $("#patchInfo").hidden = true; $("#arrow").hidden = true; $("#afterBox").hidden = true;
  $("#sBefore").textContent = "--"; $("#sBefore").style.color = "";
  stream("/api/scan");
};
$("#patch").onclick = () => { if (scanId) stream("/api/patch?id=" + encodeURIComponent(scanId)); };
