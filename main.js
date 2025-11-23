// Load stored values or defaults
let matchData = {
  teamA: localStorage.getItem("teamA") || "Ironbeard Warriors",
  teamB: localStorage.getItem("teamB") || "Stoneguard Rangers",
  matchTime: localStorage.getItem("matchTime") || new Date(Date.now()+86400000).toISOString(),
  betsA: parseInt(localStorage.getItem("betsA")) || 30000,
  betsB: parseInt(localStorage.getItem("betsB")) || 15000,
  betsDraw: parseInt(localStorage.getItem("betsDraw")) || 5000
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

// ---- Load UI ----
function loadUI() {
  if (document.getElementById("teamA")) {
    document.getElementById("teamA").textContent = matchData.teamA;
    document.getElementById("teamB").textContent = matchData.teamB;
    startCountdown();
    updatePrizePoolDisplay();
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

  document.getElementById("saveBtn").onclick = saveAdmin;
  document.getElementById("resetBtn").onclick = loadAdmin;
}

function saveAdmin() {
  matchData.teamA = document.getElementById("adminTeamA").value;
  matchData.teamB = document.getElementById("adminTeamB").value;
  matchData.matchTime = document.getElementById("adminMatchTime").value;
  matchData.betsA = parseInt(document.getElementById("adminBetsA").value) || 0;
  matchData.betsB = parseInt(document.getElementById("adminBetsB").value) || 0;
  matchData.betsDraw = parseInt(document.getElementById("adminBetsDraw").value) || 0;

  for (let k in matchData) {
    // store numbers as numeric strings or ISO
    localStorage.setItem(k, matchData[k]);
  }
  updatePrizePoolDisplay();
  alert("Saved.");
}

// ---- History ----
const historyData = [
  { match: "Ironbeard Warriors vs Stoneguard Rangers", winner: "Draw", prize: "12,500" },
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

window.onload = () => {
  loadUI();
  loadAdmin();
  loadHistory();
};
