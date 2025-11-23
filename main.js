// Default in-memory data (used if fetch fails)
let matchData = {
  teamA: localStorage.getItem("teamA") || "Ironbeard Warriors",
  teamB: localStorage.getItem("teamB") || "Stoneguard Rangers",
  matchTime: localStorage.getItem("matchTime") || new Date(Date.now()+86400000).toISOString(),
  betsA: parseInt(localStorage.getItem("betsA")) || 30000,
  betsB: parseInt(localStorage.getItem("betsB")) || 15000,
  betsDraw: parseInt(localStorage.getItem("betsDraw")) || 5000,
  logoA: localStorage.getItem("logoA") || "assets/logo.png",
  logoB: localStorage.getItem("logoB") || "assets/logo.png"
};

// House commission percentage
const HOUSE_PERCENT = 0.15;

// ---- THEME TOGGLE ----
function toggleTheme() {
  const body = document.body;
  if (body.classList.contains("theme-dark"))
    body.classList.replace("theme-dark", "theme-light");
  else
    body.classList.replace("theme-light", "theme-dark");
}

// ---- COUNTDOWN ----
function startCountdown() {
  const el = document.getElementById("countdown");
  if (!el) return;

  function update() {
    let diff = new Date(matchData.matchTime) - new Date();
    if (diff <= 0) {
      el.textContent = "Match Started!";
      return;
    }
    let d = Math.floor(diff / (1000*60*60*24));
    let h = Math.floor((diff/1000/60/60)%24);
    let m = Math.floor((diff/1000/60)%60);
    let s = Math.floor((diff/1000)%60);
    el.textContent = `${d}d ${h}h ${m}m ${s}s`;
  }
  update();
  setInterval(update, 1000);
}

// ---- POOL & PAYOUTS ----
function computePools() {
  const totalPool = Number(matchData.betsA || 0) + Number(matchData.betsB || 0) + Number(matchData.betsDraw || 0);
  const houseCut = Math.floor(totalPool * HOUSE_PERCENT);
  const prizePool = totalPool - houseCut;
  return { totalPool, houseCut, prizePool };
}

// Safe payout calculation: returns 0 when there are no bets on winning outcome
function calculatePayout(playerBet, totalBetsOnWinningOutcome, prizePool) {
  if (!playerBet || playerBet <= 0) return 0;
  if (!totalBetsOnWinningOutcome || totalBetsOnWinningOutcome <= 0) return 0;
  return (playerBet / totalBetsOnWinningOutcome) * prizePool;
}

// ---- Update UI Totals ----
function updatePrizePoolDisplay() {
  const totals = computePools();
  const betsAEl = document.getElementById("betsA");
  const betsBEl = document.getElementById("betsB");
  const betsDEl = document.getElementById("betsDraw");
  const totalPoolEl = document.getElementById("totalPool");
  const houseEl = document.getElementById("houseCut");
  const prizeEl = document.getElementById("prizePool");
  const labelA = document.getElementById("labelA");
  const labelB = document.getElementById("labelB");

  if (labelA) labelA.textContent = matchData.teamA;
  if (labelB) labelB.textContent = matchData.teamB;

  if (betsAEl) betsAEl.textContent = Number(matchData.betsA || 0).toLocaleString();
  if (betsBEl) betsBEl.textContent = Number(matchData.betsB || 0).toLocaleString();
  if (betsDEl) betsDEl.textContent = Number(matchData.betsDraw || 0).toLocaleString();

  if (totalPoolEl) totalPoolEl.textContent = totals.totalPool.toLocaleString();
  if (houseEl) houseEl.textContent = totals.houseCut.toLocaleString();
  if (prizeEl) prizeEl.textContent = totals.prizePool.toLocaleString();
}

// Example helper: compute a sample payout for a hypothetical bet (used for demos/examples)
function samplePayoutExample(playerBet, outcomeKey) {
  const totals = computePools();
  const outcomeTotals = {
    A: Number(matchData.betsA || 0),
    B: Number(matchData.betsB || 0),
    D: Number(matchData.betsDraw || 0)
  };
  const totalOnOutcome = outcomeTotals[outcomeKey];
  return calculatePayout(playerBet, totalOnOutcome, totals.prizePool);
}

// ---- UI loader (ensures logos + text update) ----
function loadUI() {
  const tA = document.getElementById("teamA");
  const tB = document.getElementById("teamB");
  const logoAEl = document.getElementById("logoA");
  const logoBEl = document.getElementById("logoB");

  if (tA) tA.textContent = matchData.teamA;
  if (tB) tB.textContent = matchData.teamB;

  if (logoAEl) {
    logoAEl.src = matchData.logoA || "assets/logo.png";
    logoAEl.alt = matchData.teamA + " logo";
  }
  if (logoBEl) {
    logoBEl.src = matchData.logoB || "assets/logo.png";
    logoBEl.alt = matchData.teamB + " logo";
  }

  startCountdown();
  updatePrizePoolDisplay();
}

// ---- Load config.json from server (primary) ----
async function loadConfigFromServer() {
  try {
    const res = await fetch('/config.json', { cache: "no-store" });
    if (!res.ok) throw new Error('no config.json served');
    const cfg = await res.json();
    // Validate minimal shape and apply
    if (cfg && (cfg.teamA || cfg.teamB)) {
      matchData.teamA = cfg.teamA || matchData.teamA;
      matchData.teamB = cfg.teamB || matchData.teamB;
      matchData.matchTime = cfg.matchTime || matchData.matchTime;
      matchData.betsA = Number(cfg.betsA || 0);
      matchData.betsB = Number(cfg.betsB || 0);
      matchData.betsDraw = Number(cfg.betsDraw || 0);
      matchData.logoA = cfg.logoA || matchData.logoA;
      matchData.logoB = cfg.logoB || matchData.logoB;
    }
    // hide fetch warning if present
    const warn = document.getElementById("fetchWarning");
    if (warn) { warn.style.display = "none"; warn.textContent = ""; }
    return true;
  } catch (e) {
    // If opening via file:// this will fail. Show warning if element exists.
    const warn = document.getElementById("fetchWarning");
    if (warn) {
      warn.style.display = "block";
      warn.innerHTML = "Warning: Could not fetch /config.json (using local values). Serve the site over HTTP (e.g. `python -m http.server`) or use GitHub Pages to allow fetch.";
    }
    // fallback: try localStorage if present (for offline admin)
    try {
      const lsTeamA = localStorage.getItem("teamA");
      if (lsTeamA) {
        matchData.teamA = localStorage.getItem("teamA");
        matchData.teamB = localStorage.getItem("teamB");
        matchData.matchTime = localStorage.getItem("matchTime");
        matchData.betsA = parseInt(localStorage.getItem("betsA")) || matchData.betsA;
        matchData.betsB = parseInt(localStorage.getItem("betsB")) || matchData.betsB;
        matchData.betsDraw = parseInt(localStorage.getItem("betsDraw")) || matchData.betsDraw;
        matchData.logoA = localStorage.getItem("logoA") || matchData.logoA;
        matchData.logoB = localStorage.getItem("logoB") || matchData.logoB;
      }
    } catch(e2){ /* ignore */ }
    return false;
  }
}

// ---- Admin ----
function loadAdmin() {
  let A = document.getElementById("adminTeamA");
  if (!A) return;

  A.value = matchData.teamA;
  document.getElementById("adminTeamB").value = matchData.teamB;
  document.getElementById("adminMatchTime").value = matchData.matchTime.slice(0,16);
  document.getElementById("adminBetsA").value = matchData.betsA;
  document.getElementById("adminBetsB").value = matchData.betsB;
  document.getElementById("adminBetsDraw").value = matchData.betsDraw;
  // new logo fields
  const la = document.getElementById("adminLogoA");
  const lb = document.getElementById("adminLogoB");
  if (la) la.value = matchData.logoA || "";
  if (lb) lb.value = matchData.logoB || "";

  document.getElementById("saveBtn").onclick = saveAdmin;
  document.getElementById("resetBtn").onclick = () => {
    loadConfigFromServer().then(()=> loadAdmin());
  };
}

// Prepare a plain object for config.json
function buildConfigObject() {
  return {
    teamA: matchData.teamA,
    teamB: matchData.teamB,
    matchTime: matchData.matchTime,
    betsA: Number(matchData.betsA) || 0,
    betsB: Number(matchData.betsB) || 0,
    betsDraw: Number(matchData.betsDraw) || 0,
    logoA: matchData.logoA || "",
    logoB: matchData.logoB || ""
  };
}

// Download helper (unchanged)
function downloadConfigFile(cfgObj) {
  const blob = new Blob([JSON.stringify(cfgObj, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'config.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function saveAdmin() {
  // read fields into matchData
  matchData.teamA = document.getElementById("adminTeamA").value;
  matchData.teamB = document.getElementById("adminTeamB").value;
  matchData.matchTime = document.getElementById("adminMatchTime").value;
  matchData.betsA = parseInt(document.getElementById("adminBetsA").value) || 0;
  matchData.betsB = parseInt(document.getElementById("adminBetsB").value) || 0;
  matchData.betsDraw = parseInt(document.getElementById("adminBetsDraw").value) || 0;
  // read logo fields
  const la = document.getElementById("adminLogoA");
  const lb = document.getElementById("adminLogoB");
  matchData.logoA = la ? la.value.trim() || matchData.logoA : matchData.logoA;
  matchData.logoB = lb ? lb.value.trim() || matchData.logoB : matchData.logoB;

  // persist fallback locally (optional)
  try {
    localStorage.setItem("teamA", matchData.teamA);
    localStorage.setItem("teamB", matchData.teamB);
    localStorage.setItem("matchTime", matchData.matchTime);
    localStorage.setItem("betsA", String(matchData.betsA));
    localStorage.setItem("betsB", String(matchData.betsB));
    localStorage.setItem("betsDraw", String(matchData.betsDraw));
    localStorage.setItem("logoA", matchData.logoA);
    localStorage.setItem("logoB", matchData.logoB);
  } catch(e){ /* ignore localStorage errors */ }

  // Build config object and trigger download for manual commit
  const cfgObj = buildConfigObject();
  downloadConfigFile(cfgObj);
  updatePrizePoolDisplay();
  alert("Config prepared for download as config.json. Replace your repo's config.json with this file and push to update the site.");
}

// ---- History ----
const historyData = [
  { match: "Barcelona vs Chelsea", winner: "", prize: "" },
];

function loadHistory() {
  let table = document.getElementById("historyTable");
  if (!table) return;

  table.innerHTML = `
    <tr><th>Match</th><th>Winner</th><th>Prize</th></tr>
  `;
  historyData.forEach(r => {
    table.innerHTML += `
      <tr>
        <td>${r.match}</td>
        <td>${r.winner || ''}</td>
        <td>${r.prize ? r.prize + ' gold' : ''}</td>
      </tr>`;
  });
}

// ---- App init ----
window.onload = async () => {
  await loadConfigFromServer(); // primary source; falls back to localStorage
  loadUI();
  loadAdmin();
  loadHistory();
};
