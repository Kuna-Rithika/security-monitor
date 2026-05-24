import { useState, useEffect } from "react";
import axios from "axios";
import { ShieldAlert, ShieldCheck, AlertTriangle, RefreshCw, Loader, Zap, Globe, Clock, BarChart2, ArrowLeft } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import "./App.css";

const SEV_CONFIG = {
  CRITICAL: { color: "#ff3939", bg: "#ff4d4d18" },
  HIGH:     { color: "#ff8c00", bg: "#ff8c0018" },
  MEDIUM:   { color: "#ffd700", bg: "#ffd70018" },
  LOW:      { color: "#00c9a7", bg: "#00c9a718" },
};

const CATEGORY_COLORS = {
  "Intrusion":    "#ff4d4d",
  "Malware":      "#ff8c00",
  "Data theft":   "#ffd700",
  "Access":       "#a78bfa",
  "Network":      "#378ADD",
  "Application":  "#00c9a7",
  "Insider":      "#f472b6",
};

function categorizAlert(type) {
  if (["Brute Force","Port Scan","Port Probe","Network Scan"].includes(type)) return "Intrusion";
  if (["Ransomware Pattern","Cryptomining","Malware C2","Zero Day Exploit"].includes(type)) return "Malware";
  if (["Data Exfiltration","Large File Transfer","DNS Tunneling","Memory Dump"].includes(type)) return "Data theft";
  if (["Privilege Escalation","Credential Stuffing","Failed MFA","Account Takeover","Token Replay","Anomalous Access"].includes(type)) return "Access";
  if (["DDoS Attack","Lateral Movement","Backdoor Access","Ping Flood"].includes(type)) return "Network";
  if (["SQL Injection","XSS Attempt","Open Redirect","Unauthorized API","File Upload"].includes(type)) return "Application";
  if (["Insider Threat","Log Tampering","Suspicious Script","Unusual Login Time"].includes(type)) return "Insider";
  return "Other";
}

const SEV_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default function App() {
  const [page, setPage] = useState("monitor");
  const [alerts, setAlerts] = useState([]);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [visibleAlerts, setVisibleAlerts] = useState([]);
  const [alertsPerSec, setAlertsPerSec] = useState(0);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    if (alerts.length === 0) return;
    setVisibleAlerts([]);
    let i = 0;
    const interval = setInterval(() => {
      if (i < alerts.length) {
        setVisibleAlerts(prev => [...prev, alerts[i]]);
        setAlertsPerSec(Math.floor(Math.random() * 40 + 10));
        i++;
      } else clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, [alerts]);

  const fetchAlerts = async () => {
    setScanning(true);
    setAnalysis("");
    setVisibleAlerts([]);
    setPage("monitor");
    const res = await axios.get("http://localhost:5000/api/alerts");
    setAlerts(res.data.alerts);
    setScanning(false);
  };

  const analyzeAlerts = async () => {
    if (!alerts.length) return;
    setLoading(true);
    setAnalysis("");
    const res = await axios.post("http://localhost:5000/api/analyze", { alerts });
    setAnalysis(res.data.analysis);
    setLoading(false);
    setPage("report");
  };

  const counts = {
    CRITICAL: alerts.filter(a => a?.severity === "CRITICAL").length,
    HIGH:     alerts.filter(a => a?.severity === "HIGH").length,
    MEDIUM:   alerts.filter(a => a?.severity === "MEDIUM").length,
    LOW:      alerts.filter(a => a?.severity === "LOW").length,
  };

  const filtered = filter === "ALL" ? visibleAlerts : visibleAlerts.filter(a => a?.severity === filter);

  // Parse AI analysis into structured lines
  const parseAnalysis = (text) => {
    if (!text) return { threatLines: [], summary: "" };
    const parts = text.split("=== SUMMARY ===");
    const rawLines = parts[0].trim().split("\n").filter(Boolean);
    const threatLines = rawLines
      .filter(l => l.includes("REAL THREAT"))
      .map(l => {
        const sev = l.includes("CRITICAL") ? "CRITICAL" : l.includes("HIGH") ? "HIGH" : l.includes("MEDIUM") ? "MEDIUM" : "LOW";
        return { text: l, sev };
      })
      .sort((a, b) => SEV_ORDER[a.sev] - SEV_ORDER[b.sev]);
    return { threatLines, summary: parts[1]?.trim() || "" };
  };

  const { threatLines, summary } = parseAnalysis(analysis);

  // Chart data
  const realCount = threatLines.length;
  const safeCount = alerts.length - realCount;
  const donutData = [
    { name: "Real threats", value: realCount },
    { name: "False positives", value: safeCount },
  ];

  const catMap = {};
  alerts.forEach(a => {
    const cat = categorizAlert(a.type);
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const barData = Object.entries(catMap).map(([cat, count]) => ({ cat, count })).sort((a, b) => b.count - a.count);

  return (
    <div className="app">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-left">
          <ShieldAlert size={26} color="#ff4d4d" />
          <div>
            <h1>Security Operations Center</h1>
            <p>AI-powered real-time threat detection & prioritization</p>
          </div>
        </div>
        <div className="topbar-right">
          {alerts.length > 0 && (
            <div className="live-badge">
              <span className="pulse-dot" />
              LIVE &nbsp;·&nbsp; {alertsPerSec} alerts/sec
            </div>
          )}
          <button onClick={fetchAlerts} disabled={scanning} className="btn-secondary">
            <RefreshCw size={15} /> {scanning ? "Scanning..." : "Scan System"}
          </button>
          <button onClick={analyzeAlerts} disabled={loading || !alerts.length} className="btn-primary">
            <Zap size={15} /> {loading ? "Analyzing..." : "Analyze with AI"}
          </button>
          {analysis && (
            <>
              <button onClick={() => setPage("monitor")} className={`tab-btn ${page === "monitor" ? "active" : ""}`}>
                Monitor
              </button>
              <button onClick={() => setPage("report")} className={`tab-btn ${page === "report" ? "active" : ""}`}>
                <BarChart2 size={14} /> Report
              </button>
            </>
          )}
        </div>
      </div>

      {/* STAT CARDS */}
      {alerts.length > 0 && (
        <div className="stat-row">
          {[["CRITICAL","#ff4d4d"],["HIGH","#ff8c00"],["MEDIUM","#ffd700"],["LOW","#00c9a7"]].map(([sev, color]) => (
            <div key={sev} className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
              <span className="stat-num" style={{ color }}>{counts[sev]}</span>
              <span className="stat-label">{sev}</span>
              <div className="stat-bar-bg">
                <div className="stat-bar-fg" style={{ width: `${(counts[sev] / alerts.length) * 100}%`, background: color }} />
              </div>
            </div>
          ))}
          <div className="stat-card" style={{ borderTop: "3px solid #7b8cde" }}>
            <span className="stat-num" style={{ color: "#7b8cde" }}>{alerts.length}</span>
            <span className="stat-label">TOTAL</span>
            <div className="stat-bar-bg"><div className="stat-bar-fg" style={{ width: "100%", background: "#7b8cde" }} /></div>
          </div>
        </div>
      )}

      {/* ── PAGE: MONITOR ── */}
      {page === "monitor" && (
        <div className="main-grid">
          <div className="panel alerts-panel">
            <div className="panel-header">
              <div className="panel-title"><AlertTriangle size={16} color="#ff8c00" /> Live alert feed</div>
              <div className="filter-tabs">
                {["ALL","CRITICAL","HIGH","MEDIUM","LOW"].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`filter-tab ${filter === f ? "active" : ""}`}
                    style={filter === f && f !== "ALL" ? { borderColor: SEV_CONFIG[f]?.color, color: SEV_CONFIG[f]?.color } : {}}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {alerts.length === 0 && (
              <div className="empty-state">
                <ShieldAlert size={44} color="#333" />
                <p>Click "Scan System" to start monitoring</p>
              </div>
            )}
            <div className="alert-list">
              {filtered.filter(a => a && a.severity).map(a => (
                <div key={a.id} className="alert-row"
                  style={{ borderLeft: `3px solid ${SEV_CONFIG[a.severity]?.color}`, background: SEV_CONFIG[a.severity]?.bg }}>
                  <div className="alert-row-top">
                    <span className="alert-type">{a.type}</span>
                    <span className="sev-pill" style={{ color: SEV_CONFIG[a.severity]?.color, background: SEV_CONFIG[a.severity]?.bg }}>
                      {a.severity}
                    </span>
                  </div>
                  <p className="alert-msg">{a.message}</p>
                  <div className="alert-meta">
                    <span><Globe size={11} /> {a.country}</span>
                    <span>IP: {a.ip}</span>
                    <span><Clock size={11} /> {a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel analysis-panel">
            <div className="panel-header">
              <div className="panel-title"><ShieldCheck size={16} color="#00c9a7" /> AI threat analysis</div>
            </div>
            {!analysis && !loading && (
              <div className="empty-state">
                <ShieldCheck size={44} color="#333" />
                <p>{alerts.length ? 'Click "Analyze with AI" to detect real threats' : "Scan system first"}</p>
              </div>
            )}
            {loading && (
              <div className="empty-state">
                <Loader size={36} className="spin" color="#7b8cde" />
                <p>AI analyzing {alerts.length} security alerts...</p>
                <p className="sub-hint">Filtering false positives · Prioritizing threats</p>
              </div>
            )}
            {analysis && (
              <div className="empty-state">
                <ShieldCheck size={44} color="#00c9a7" />
                <p style={{ color: "#00c9a7", fontWeight: 600 }}>Analysis complete!</p>
                <p className="sub-hint">{realCount} real threats found out of {alerts.length} alerts</p>
                <button onClick={() => setPage("report")} className="btn-primary" style={{ marginTop: 12 }}>
                  <BarChart2 size={15} /> View Full Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PAGE: REPORT ── */}
      {page === "report" && analysis && (
        <div className="report-page">

          {/* Charts row */}
          <div className="charts-row">
            <div className="panel chart-panel">
              <div className="panel-header">
                <div className="panel-title">Threat vs false positive breakdown</div>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      <Cell fill="#ff4d4d" />
                      <Cell fill="#00c9a7" />
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0f1629", border: "1px solid #1e2d4a", color: "#c9d1e9", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-legend">
                  <span style={{ color: "#ff4d4d" }}>● Real threats: {realCount}</span>
                  <span style={{ color: "#00c9a7" }}>● False positives: {safeCount}</span>
                </div>
              </div>
            </div>

            <div className="panel chart-panel">
              <div className="panel-header">
                <div className="panel-title">Alerts by attack category</div>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="cat" tick={{ fill: "#4a6080", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#4a6080", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#0f1629", border: "1px solid #1e2d4a", color: "#c9d1e9", fontSize: 12 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[entry.cat] || "#7b8cde"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Real threats ranked */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-header">
              <div className="panel-title">
                <AlertTriangle size={16} color="#ff4d4d" />
                Real threats ranked by severity — {realCount} found
              </div>
            </div>
            <div className="threat-list">
              {threatLines.length === 0 && (
                <div className="empty-state"><ShieldCheck size={36} color="#00c9a7" /><p style={{ color: "#00c9a7" }}>No real threats detected</p></div>
              )}
              {threatLines.map((t, i) => (
                <div key={i} className="threat-row"
                  style={{ borderLeft: `4px solid ${SEV_CONFIG[t.sev]?.color}`, background: SEV_CONFIG[t.sev]?.bg }}>
                  <div className="threat-rank" style={{ color: SEV_CONFIG[t.sev]?.color }}>#{i + 1}</div>
                  <div className="threat-content">
                    <span className="sev-pill" style={{ color: SEV_CONFIG[t.sev]?.color, background: SEV_CONFIG[t.sev]?.bg, marginBottom: 4, display: "inline-block" }}>
                      ⚠ {t.sev}
                    </span>
                    <p className="line-text">{t.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Summary */}
          {summary && (
            <div className="panel summary-panel">
              <div className="panel-header">
                <div className="panel-title"><ShieldCheck size={16} color="#7b8cde" /> AI recommendations & summary</div>
              </div>
              <pre className="summary-text" style={{ padding: 16 }}>{summary}</pre>
            </div>
          )}
        </div>
      )}

      {loading && page === "report" && (
        <div className="empty-state" style={{ padding: "80px 0" }}>
          <Loader size={40} className="spin" color="#7b8cde" />
          <p>AI is analyzing {alerts.length} alerts...</p>
          <p className="sub-hint">This takes about 10–15 seconds</p>
        </div>
      )}
    </div>
  );
}