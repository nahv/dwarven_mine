// Default in-memory data (used if embedded data or localStorage missing)
let matchData = {
  teamA: "Team A",
  teamB: "Team B",
  matchTime: new Date(Date.now()+86400000).toISOString(),
  betsA: 0,
  betsB: 0,
  betsDraw: 0,
  logoA: "assets/logo.png",
  logoB: "assets/logo.png",
  logoDraw: "assets/balance.png" // draw logo (balance) default; keep asset in repo or set to existing
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
  const logoDEl = document.getElementById("logoDraw");

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
  if (logoDEl) {
    logoDEl.src = matchData.logoDraw || "assets/balance.png";
    logoDEl.alt = "Draw (Balance) logo";
  }

  startCountdown();
  updatePrizePoolDisplay();
}

// ---- Load data (prefer embedded INITIAL_MATCH_DATA) ----
function applyEmbeddedOrLocalData() {
  // embedded in generated index.html by admin.js
  if (window.INITIAL_MATCH_DATA) {
    const cfg = window.INITIAL_MATCH_DATA;
    matchData.teamA = cfg.teamA || matchData.teamA;
    matchData.teamB = cfg.teamB || matchData.teamB;
    matchData.matchTime = cfg.matchTime || matchData.matchTime;
    matchData.betsA = Number(cfg.betsA || 0);
    matchData.betsB = Number(cfg.betsB || 0);
    matchData.betsDraw = Number(cfg.betsDraw || 0);
    matchData.logoA = cfg.logoA || matchData.logoA;
    matchData.logoB = cfg.logoB || matchData.logoB;
    matchData.logoDraw = cfg.logoDraw || matchData.logoDraw;
    return;
  }

  // fallback to localStorage if present
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
      matchData.logoDraw = localStorage.getItem("logoDraw") || matchData.logoDraw;
    }
  } catch (e) { /* ignore */ }
}

// ---- History (unchanged) ----
const historyData = [
  { match: "—", winner: "", prize: "" },
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
window.onload = () => {
  applyEmbeddedOrLocalData();
  loadUI();
  loadHistory();
};
