const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Groq = require('groq-sdk');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/analyze', async (req, res) => {
  const { alerts } = req.body;

  const alertText = alerts.map((a, i) =>
    `Alert ${i + 1}: [${a.severity}] ${a.type} - ${a.message} | Source IP: ${a.ip} | Time: ${a.time} | Country: ${a.country}`
  ).join('\n');

  const prompt = `You are a senior cybersecurity analyst working in a Security Operations Center (SOC). Analyze these security alerts and identify real threats vs false positives.

ALERTS:
${alertText}

For EACH alert respond in this exact format:
Alert [number] | [REAL THREAT / FALSE POSITIVE] | [CRITICAL/HIGH/MEDIUM/LOW] | [one sentence plain English explanation] | Action: [what to do]

After all alerts, write:
=== SUMMARY ===
Total Alerts: [number]
Real Threats: [number]
False Positives: [number]
Most Critical: [describe the single most dangerous threat]
Immediate Action: [what the security team should do right now]`;

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    });

    res.json({ analysis: completion.choices[0].message.content });
  } catch (err) {
    console.error('Groq error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/alerts', (req, res) => {
  res.json({ alerts: generateMockAlerts() });
});

function randomIP() {
  const pools = [
    `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
    `10.0.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
    `${Math.floor(Math.random()*220)+10}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
  ];
  return pools[Math.floor(Math.random() * pools.length)];
}

function randomTime() {
  return new Date(Date.now() - Math.random() * 7200000).toLocaleTimeString();
}

function generateMockAlerts() {
  const alertTemplates = [
    { type: 'Brute Force', severity: 'CRITICAL', message: '1,247 failed login attempts in 3 minutes from same IP', country: 'Russia' },
    { type: 'SQL Injection', severity: 'CRITICAL', message: 'SQL injection payload detected in /api/login endpoint', country: 'China' },
    { type: 'Data Exfiltration', severity: 'CRITICAL', message: '4.7GB of customer data uploaded to unknown external server', country: 'North Korea' },
    { type: 'Privilege Escalation', severity: 'CRITICAL', message: 'Standard user account gained root/admin access unexpectedly', country: 'Internal' },
    { type: 'Ransomware Pattern', severity: 'CRITICAL', message: 'Mass file encryption detected across shared drives', country: 'Ukraine' },
    { type: 'Zero Day Exploit', severity: 'CRITICAL', message: 'Unknown exploit pattern targeting Apache server vulnerability', country: 'Iran' },
    { type: 'Admin Panel Access', severity: 'HIGH', message: 'Admin dashboard accessed at 3:47AM from foreign IP', country: 'Brazil' },
    { type: 'Port Scan', severity: 'HIGH', message: 'Full TCP port scan across all 65535 ports detected', country: 'Romania' },
    { type: 'Lateral Movement', severity: 'HIGH', message: 'User accessing unusual internal systems not part of role', country: 'Internal' },
    { type: 'Credential Stuffing', severity: 'HIGH', message: '890 accounts tested with leaked credential database', country: 'Vietnam' },
    { type: 'Malware C2', severity: 'HIGH', message: 'Outbound connection to known malware command and control server', country: 'Belarus' },
    { type: 'DNS Tunneling', severity: 'HIGH', message: 'Unusual DNS query volume suggesting data exfiltration via DNS', country: 'Internal' },
    { type: 'Config Change', severity: 'MEDIUM', message: 'Firewall rules modified outside of approved change window', country: 'Internal' },
    { type: 'Suspicious Script', severity: 'MEDIUM', message: 'PowerShell script executed with obfuscated base64 commands', country: 'Internal' },
    { type: 'Unusual Login Time', severity: 'MEDIUM', message: 'Employee account logged in at 2AM on a Sunday', country: 'India' },
    { type: 'Large File Transfer', severity: 'MEDIUM', message: '800MB file transferred to personal Google Drive account', country: 'Internal' },
    { type: 'Failed MFA', severity: 'MEDIUM', message: '15 failed multi-factor authentication attempts on CEO account', country: 'Turkey' },
    { type: 'Unauthorized API', severity: 'MEDIUM', message: 'API endpoint accessed without valid authentication token', country: 'Indonesia' },
    { type: 'SSL Certificate', severity: 'MEDIUM', message: 'Expired SSL certificate detected on payment gateway', country: 'Internal' },
    { type: 'Geo Anomaly', severity: 'MEDIUM', message: 'User logged in from India and USA within 45 minutes', country: 'India' },
    { type: 'Failed Login', severity: 'LOW', message: 'Single failed login attempt, user mistyped password', country: 'Internal' },
    { type: 'Failed Login', severity: 'LOW', message: 'User locked out after 3 failed attempts, reset requested', country: 'Internal' },
    { type: 'High Traffic', severity: 'LOW', message: 'Traffic spike during lunch hours, consistent with normal usage', country: 'Internal' },
    { type: 'Ping Flood', severity: 'LOW', message: 'ICMP ping flood from internal network, likely a test', country: 'Internal' },
    { type: 'SSL Error', severity: 'LOW', message: 'SSL handshake failure, likely misconfigured client browser', country: 'Internal' },
    { type: 'Port Probe', severity: 'LOW', message: 'Single port probe on port 22, likely automated scanner', country: 'Germany' },
    { type: 'Failed Login', severity: 'LOW', message: 'New employee failed login before account was activated', country: 'Internal' },
    { type: 'Timeout Error', severity: 'LOW', message: 'Database connection timeout during peak hours', country: 'Internal' },
    { type: 'Bot Traffic', severity: 'LOW', message: 'Googlebot crawling public pages, normal SEO activity', country: 'USA' },
    { type: 'Failed Login', severity: 'LOW', message: 'Mobile app user failed login after app update', country: 'Internal' },
    { type: 'XSS Attempt', severity: 'CRITICAL', message: 'Cross-site scripting payload injected in comment field', country: 'Pakistan' },
    { type: 'Account Takeover', severity: 'CRITICAL', message: 'Successful login from new device after password reset', country: 'Nigeria' },
    { type: 'DDoS Attack', severity: 'CRITICAL', message: '2.3 million requests per second targeting main API server', country: 'Botnet' },
    { type: 'Insider Threat', severity: 'HIGH', message: 'Employee downloading bulk customer records before resignation', country: 'Internal' },
    { type: 'Supply Chain', severity: 'HIGH', message: 'Third party vendor API making unusual data requests', country: 'India' },
    { type: 'Cryptomining', severity: 'HIGH', message: 'Server CPU at 98% with known cryptomining process detected', country: 'Internal' },
    { type: 'Phishing Link', severity: 'MEDIUM', message: 'Employee clicked suspicious link in email from spoofed domain', country: 'Internal' },
    { type: 'Weak Password', severity: 'MEDIUM', message: 'Admin account using password that appears in breach database', country: 'Internal' },
    { type: 'Open Redirect', severity: 'MEDIUM', message: 'Open redirect vulnerability being probed on login page', country: 'Netherlands' },
    { type: 'Rate Limit Hit', severity: 'LOW', message: 'API rate limit triggered by mobile app during sync', country: 'Internal' },
    { type: 'Cookie Error', severity: 'LOW', message: 'Session cookie expired, user redirected to login', country: 'Internal' },
    { type: 'File Upload', severity: 'MEDIUM', message: 'Executable file uploaded disguised as PDF document', country: 'Egypt' },
    { type: 'Memory Dump', severity: 'HIGH', message: 'Process memory dump initiated on authentication server', country: 'Internal' },
    { type: 'Backdoor Access', severity: 'CRITICAL', message: 'Connection attempt on known backdoor port 4444', country: 'China' },
    { type: 'Token Replay', severity: 'HIGH', message: 'Expired authentication token being reused from different IP', country: 'Mexico' },
    { type: 'Log Tampering', severity: 'CRITICAL', message: 'Security logs being deleted or modified on production server', country: 'Internal' },
    { type: 'Network Scan', severity: 'MEDIUM', message: 'Internal network being mapped from guest WiFi segment', country: 'Internal' },
    { type: 'Failed Login', severity: 'LOW', message: 'Customer support agent failed login before shift started', country: 'Internal' },
    { type: 'Patch Missing', severity: 'MEDIUM', message: 'Critical security patch not applied for 47 days on server', country: 'Internal' },
    { type: 'Anomalous Access', severity: 'HIGH', message: 'Service account accessing files outside its normal scope', country: 'Internal' },
  ];

  return alertTemplates.map((a, i) => ({
    id: i + 1,
    ...a,
    ip: randomIP(),
    time: randomTime(),
  }));
}

const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => {
  res.json({ 
    status: '✅ Security Monitor API is running',
    endpoints: ['/api/alerts', '/api/analyze']
  });
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
