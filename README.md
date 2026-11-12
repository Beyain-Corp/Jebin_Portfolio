# Jebin Joseph J. - Enterprise IT Infrastructure Portfolio

A modern, high-performance, responsive portfolio website created for **Jebin Joseph J., B.E. (E.C.E.)**, highlighting 8+ years of enterprise IT leadership in virtualization, hybrid cloud identity, multi-tier storage, and mission-critical disaster recovery.

---

## 🌟 Key Features

1. **Executive Aesthetics & Light Theme**:
   - Clean, high-contrast, modern professional light design with electric cyan, royal blue, and emerald health-status accents.
   - Polished typography, subtle matrix grid background, ambient glow flares, and fully responsive layout for desktop, tablet, and mobile.

2. **Metrics & Impact Dashboard**:
   - Animated KPI counters tracking **8+ Years** Enterprise IT Experience, **99.9%** Cluster Uptime, **1,000+** Entra ID User Accounts Governed, **< 1h / < 4h** RPO/RTO SLAs, **98%+** SLA Resolution Rate, and **30%** Overhead Reduction.

3. **Core Competency Pillars (6 Pillars)**:
   - **Virtualization & Systems** (VMware ESXi 7.x/8.x, vCenter, HA/DRS, Windows/Linux server fleet).
   - **Cloud & Identity Governance** (Microsoft Entra ID, Microsoft 365, Exchange Online, Azure AD Connect, Conditional Access, Zero-Trust MFA).
   - **Enterprise Storage & BCP** (SAN/NAS iSCSI/NFS/FC, Commvault Backup & Recovery, Live DR Restoration Drills).
   - **Security & Compliance** (SentinelOne EDR/XDR, GPO Hardening, GxP Pharma Regulatory Compliance, Vulnerability Mitigation).
   - **Networking & Core Services** (AD DS, DNS, DHCP, Enterprise VPN, VLAN Segmentation, Websense URL Filtering).
   - **ITSM, Automation & DevOps** (ITIL v4 Framework, Incident & Change Management, RCA, Jenkins CI/CD, Shell Scripting, Lansweeper, SCCM).

4. **Technical Insights & Engineering Articles (Notion Headless CMS)**:
   - Dedicated articles showcase (`#articles`) featuring comprehensive engineering writeups.
   - **Automated Notion Sync Pipeline (Option C)**: Write articles in Notion; an automated GitHub Action syncs them to `assets/data/articles.json` with zero code required.
   - Interactive in-page modal reader (`#articleModal`) for seamless on-site reading.
   - Cross-platform syndication to LinkedIn Articles with direct discussion links.

5. **Enterprise Architecture & Case Studies**:
   - Highlighting real-world deployments:
     - Multi-Site VMware High Availability Cluster (50+ VMs & physical nodes).
     - Zero-Trust Hybrid Identity & Geofenced Conditional Access (1,000+ accounts).
     - GxP-Compliant Enterprise Commvault DR Pipeline.
     - Automated Maintenance & CI/CD via Jenkins & Shell scripting.

6. **Interactive SysAdmin Terminal Widget**:
   - Interactive command console (`sysadmin@jebin-node01:~$`) supporting commands: `status`, `whoami`, `skills`, `articles`, `experience`, `contact`, `linkedin`, `github`, `instagram`, `resume`, `banner`, `help`, and `clear`.
   - One-click preset command chips for quick querying on touch devices.

7. **Interactive Skills Arsenal Filter**:
   - Filterable skills matrix categorizing technologies by Virtualization & OS, Cloud & Identity, Storage & DR, Security & Networking, and Automation & ITSM.

8. **Direct Connectivity & Contact Dispatch**:
   - LinkedIn Profile (`https://www.linkedin.com/in/jebinjosephj`).
   - GitHub Profile (`https://github.com/Beyain-Corp`).
   - Instagram Profile (`https://www.instagram.com/jebin_j_joseph/`).
   - Direct Email link (`jjebin05@gmail.com`).
   - Direct Phone calling (`+91 90434 37743`).
   - WhatsApp quick launcher (`+91 90434 37743`) with floating quick-action button.
   - Interactive contact form with auto-drafting for email and WhatsApp dispatch.

9. **Resume Viewer & Downloader**:
   - In-page preview modal with embedded PDF viewer.
   - Direct download link pointing to `assets/docs/Jebin_Joseph_Resume.pdf`.

---

## 📁 Unified Single-Page Architecture

The portfolio is structured as a cohesive, high-performance Single Page Application (SPA) where every domain flows logically with smooth scroll navigation and dynamic scrollspy highlighting:

```
├── .github/
│   └── workflows/
│       └── sync-notion.yml     # Automated GitHub Action to fetch Notion articles every 6h
├── index.html                  # Unified Single-Page Application (Hero, Metrics, About, Architecture, Experience, Skills, Articles, Console, Contact)
├── styles.css                  # Complete modern CSS design system & responsive styling (Light Theme)
├── script.js                   # Interactive client engine (terminal, counters, filter, modal, scrollspy, article reader)
├── package.json                # Project scripts (npm run sync:notion, npm run serve)
├── README.md                   # Project overview & documentation
├── blogs/
│   ├── NOTION_SETUP.md         # Step-by-step guide to connect your Notion database
│   └── README.md               # Authoring & content management guide for articles & LinkedIn syndication
├── scripts/
│   └── sync-notion.js          # Node.js sync engine converting Notion blocks to clean HTML
├── about.html                  # Seamless redirect to index.html#about
├── architecture.html           # Seamless redirect to index.html#architecture
├── pillars.html                # Seamless redirect to index.html#architecture
├── experience.html             # Seamless redirect to index.html#experience
├── skills.html                 # Seamless redirect to index.html#skills
├── articles.html               # Seamless redirect to index.html#articles
├── console.html                # Seamless redirect to index.html#terminal
├── contact.html                # Seamless redirect to index.html#contact
├── assets/
│   ├── data/
│   │   └── articles.json       # Synced static JSON database of published articles
│   ├── docs/
│   │   └── Jebin_Joseph_Resume.pdf # Optimized CV for web view & download
│   └── img/
│       ├── profile.png         # Jebin Joseph J. high-res portrait photo
│       ├── linkedin-cover.png  # LinkedIn executive banner with branding motto
│       └── banner.png          # Header banner
└── Inventory/                  # Original source documents and images
    ├── Jebin Joseph J.pdf
    ├── Jebin Joseph J.png
    ├── LinkedIn Cover.png
    └── Banner.png
```

---

## 🚀 How to Run Locally

You can open the website immediately in any web browser: (https://beyain-corp.github.io/Jebin_Portfolio/)

### Option 1: Direct File
Double-click `index.html` or open it directly in Google Chrome, Safari, or Microsoft Edge:
```bash
open index.html
```

### Option 2: Local HTTP Server (Python)
```bash
python3 -m http.server 8080
```
Then visit [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🌐 Free 1-Click Deployment Options

### GitHub Pages:
1. Initialize a git repository and commit the files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of portfolio website"
   git branch -M main
   git remote add origin https://github.com/<your-username>/portfolio.git
   git push -u origin main
   ```
2. In your GitHub repository, go to **Settings** > **Pages** > select branch `main` (root) > click **Save**. Your site will be live instantly!

### Vercel / Netlify:
- Drag and drop this folder directly into [app.netlify.com/drop](https://app.netlify.com/drop) or import from GitHub on Vercel. Zero configuration needed!

# Jebin_Portfolio
