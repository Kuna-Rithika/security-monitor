# Security Monitor System

An autonomous AI-powered Security Operations Center (SOC) that monitors real-time security alerts, filters false positives, and identifies genuine threats using AI.

## Problem Statement
Security teams receive 1,00,000+ alerts daily. Real threats get buried in noise. Humans miss critical attacks — leading to data breaches, financial loss, and system outages.

## Solution
An AI agent that reads all incoming alerts, classifies them into 7 attack categories, identifies real threats vs false positives, ranks them by severity, and recommends immediate actions — all in under 15 seconds.

## 7 Threat Categories
- Intrusion (Brute force, Port scanning)
- Malware (Ransomware, Cryptomining)
- Data Theft (Exfiltration, DNS Tunneling)
- Access Attacks (Privilege escalation, Credential stuffing)
- Network Attacks (DDoS, Lateral movement)
- Application Attacks (SQL Injection, XSS)
- Insider Threats (Rogue employees, Log tampering)

## Tech Stack
- Frontend: React.js, Recharts, Lucide Icons
- Backend: Node.js, Express.js
- AI Engine: Groq API (LLaMA 3.3 70B)

## How to Run

### Backend
cd backend
npm install
node index.js

### Frontend
cd frontend
npm install
npm start

## Features
- Live alert feed with animation
- AI analysis in under 15 seconds
- Donut chart — threats vs false positives
- Bar chart — alerts by attack category
- All real threats ranked by severity
- Plain English explanations for every threat
- AI-written summary with immediate action recommendations
