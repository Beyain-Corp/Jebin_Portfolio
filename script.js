/* ==========================================================================
   JEBIN JOSEPH J. - ENTERPRISE IT INFRASTRUCTURE & SYSTEMS PORTFOLIO
   Interactive Client-side Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initActiveNavLink();
  initScrollSpy();
  initAnimatedCounters();
  initSkillsFilter();
  initInteractiveTerminal();
  initArticleReader();
  initResumeModal();
  initContactForm();
  initBackToTop();
});

/* --------------------------------------------------------------------------
   Multi-Page / Single-Page Active Navigation Link Helper
   -------------------------------------------------------------------------- */
function initActiveNavLink() {
  const hash = window.location.hash;
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
  if (hash) {
    navLinks.forEach(link => {
      if (link.getAttribute('href') === hash) {
        link.classList.add('active');
      } else if (link.getAttribute('href')?.startsWith('#')) {
        link.classList.remove('active');
      }
    });
  }
}

/* --------------------------------------------------------------------------
   2. Mobile Navigation Drawer
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileNav = document.getElementById('mobileNav');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (!mobileToggle || !mobileNav) return;

  mobileToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    mobileToggle.innerHTML = isOpen 
      ? '<i class="fa-solid fa-xmark"></i>' 
      : '<i class="fa-solid fa-bars"></i>';
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      mobileToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    });
  });
}

/* --------------------------------------------------------------------------
   3. Scroll Spy for Active Navigation Links
   -------------------------------------------------------------------------- */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
  if (!sections.length || !navLinks.length) return;

  function updateActiveLink() {
    const scrollPosition = window.scrollY + 140;

    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');

      if (scrollPosition >= top && scrollPosition < top + height) {
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          if (href === `#${id}`) {
            link.classList.add('active');
          } else if (href && href.startsWith('#')) {
            link.classList.remove('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();
}

/* --------------------------------------------------------------------------
   4. Animated Metric Counters
   -------------------------------------------------------------------------- */
function initAnimatedCounters() {
  const counterElements = document.querySelectorAll('.metric-number[data-target]');
  if (!counterElements.length) return;

  let hasAnimated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        counterElements.forEach(el => animateValue(el));
      }
    });
  }, { threshold: 0.3 });

  const metricsSection = document.getElementById('metrics');
  if (metricsSection) {
    observer.observe(metricsSection);
  }

  function animateValue(el) {
    const rawTarget = el.getAttribute('data-target');
    const isDecimal = rawTarget.includes('.');
    const target = parseFloat(rawTarget);
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const duration = 1800;
    const start = 0;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * ease;

      el.textContent = `${prefix}${isDecimal ? current.toFixed(1) : Math.floor(current)}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = `${prefix}${rawTarget}${suffix}`;
      }
    }

    requestAnimationFrame(step);
  }
}

/* --------------------------------------------------------------------------
   5. Technical Skills Arsenal Filter
   -------------------------------------------------------------------------- */
function initSkillsFilter() {
  const filterTabs = document.querySelectorAll('.filter-tab');
  const skillCards = document.querySelectorAll('.skill-card');

  if (!filterTabs.length || !skillCards.length) return;

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filterValue = tab.getAttribute('data-filter');

      skillCards.forEach(card => {
        const category = card.getAttribute('data-category');
        const matches = filterValue === 'all' || category === filterValue;

        if (matches) {
          card.classList.remove('is-hidden');
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(8px)';
          card.classList.add('is-hidden');
        }
      });
    });
  });
}

/* --------------------------------------------------------------------------
   6. Interactive SysAdmin Terminal Console
   -------------------------------------------------------------------------- */
function initInteractiveTerminal() {
  const input = document.getElementById('terminalInput');
  const output = document.getElementById('terminalOutput');
  const presetButtons = document.querySelectorAll('.preset-btn');

  if (!input || !output) return;

  const terminalData = {
    status: `
[CLUSTER STATUS REPORT]
--------------------------------------------------
Node Status         : 50+ Physical Nodes & VMs ONLINE
Cluster Uptime      : 99.9% High Availability
Failover Engine     : VMware vCenter HA / DRS Active
Identity Sync       : Microsoft Entra ID (Azure AD Connect Sync - HEALTHY)
Accounts Governed   : 1,000+ Active Directory Objects
MFA & Conditional   : Zero-Trust Strict Enforcement (Geofenced)
Disaster Recovery   : Commvault Enterprise Backup (RPO <1 hr, RTO <4 hrs)
Endpoint Security   : SentinelOne EDR/XDR Active & Hardened
GxP Compliance      : Audit Passed & Verified
--------------------------------------------------
System Status: ALL SYSTEMS FULLY OPERATIONAL
    `,
    whoami: `
[EXECUTIVE BIO]
Name       : Jebin Joseph J.
Degree     : B.E. in Electronics & Communication Engineering (E.C.E.)
Title      : IT Infrastructure Lead & Systems Manager
Domain     : Enterprise Virtualization, Cloud Identity & Disaster Recovery
Experience : 8+ Years Enterprise IT Infrastructure & Systems Leadership
Philosophy : "Learn • Innovate • Lead"
Values     : Drive Innovation | Deliver Excellence | Value People
LinkedIn   : https://www.linkedin.com/in/jebinjosephj
GitHub     : https://github.com/Beyain-Corp
Instagram  : https://www.instagram.com/jebin_j_joseph/
Location   : Chennai, Tamil Nadu, India
    `,
    skills: `
[CORE TECHNICAL ARSENAL]
- Virtualization  : VMware ESXi 7.x/8.x, vCenter, HA/DRS, Hyper-V, Windows/Linux Server Fleet
- Cloud Identity  : Microsoft Entra ID, Microsoft 365, Exchange Online, Hybrid Sync, MFA
- Storage & DR    : SAN/NAS (iSCSI, NFS, FC), Commvault Backup & Recovery, Replication
- Cyber Defense   : SentinelOne EDR/XDR, GPO Hardening, GxP Audit Readiness, Zero-Trust
- Networking      : AD DS, DNS, DHCP, Enterprise VPN, VLANs, Websense URL Filtering
- Automation/ITSM : Jenkins CI/CD, Shell Scripting, ITIL v4, Lansweeper, SCCM
    `,
    experience: `
[CAREER TRAJECTORY]
1. [2024 - Present] Orchid Pharma Ltd — IT Executive (Infrastructure & Operations)
   • 99.9% virtualization uptime, 1,000+ Entra ID accounts, GxP Commvault DR
2. [2022 - 2024]    Norwin Technologies — Technical Analyst (Cloud & Monitoring)
   • Multi-tenant AWS/Azure observability, SLA escalation mitigation, Tableau analytics
3. [2019 - 2022]    Orchid Pharma Ltd — Technical Support Engineer (Systems & Operations)
   • Enterprise server fleet, SCCM OS imaging, SAP MM support, trained 40+ staff
4. [2018 - 2019]    Cinehive Web Technologies — Digital Image & Systems Technician
5. [2017 - 2018]    Reliance Digital Retail Ltd — IT Consultant
    `,
    contact: `
[DIRECT COMMUNICATION CHANNELS]
• LinkedIn  : https://www.linkedin.com/in/jebinjosephj
• GitHub    : https://github.com/Beyain-Corp
• Instagram : https://www.instagram.com/jebin_j_joseph/
• Email     : jjebin05@gmail.com
• Phone     : +91-9043437743
• WhatsApp  : https://wa.me/+919043437743
• Location  : Perumbakkam, Chennai, Tamil Nadu, India
    `,
    linkedin: `
[LINKEDIN CONNECTION]
Connecting to Jebin Joseph J. on LinkedIn...
Profile URL : https://www.linkedin.com/in/jebinjosephj
Opening link in a new tab...
    `,
    github: `
[GITHUB PROFILE]
Connecting to Jebin Joseph J. on GitHub...
Repository / Org : https://github.com/Beyain-Corp
Opening link in a new tab...
    `,
    instagram: `
[INSTAGRAM PROFILE]
Connecting to Jebin Joseph J. on Instagram...
Profile URL : https://www.instagram.com/jebin_j_joseph/
Opening link in a new tab...
    `,
    resume: `
[RESUME ACTION]
Downloading Jebin Joseph J.'s official CV...
File: assets/docs/Jebin_Joseph_Resume.pdf
Triggering direct download in browser...
    `,
    articles: `
[ENGINEERING ARTICLES & TECHNICAL INSIGHTS]
1. Designing Multi-Site VMware ESXi 8.x HA & DRS Clusters for 99.9% Production Uptime
   • Category: Virtualization & Compute | Read: 6 min
   • Key Focus: DRS affinity, multi-NIC vMotion, SAN datastore heartbeats

2. Implementing Zero-Trust & Geofenced Conditional Access in Microsoft Entra ID
   • Category: Cloud Identity & Security | Read: 5 min
   • Key Focus: 1,000+ hybrid accounts, geofencing, phishing-resistant MFA

3. Disaster Recovery Architecture: Achieving Sub-Hour RPO & 4-Hour RTO with Commvault
   • Category: Storage & Disaster Recovery | Read: 7 min
   • Key Focus: GxP compliance, 21 CFR Part 11, automated immutable backups

4. Infrastructure Automation: Streamlining Systems Provisioning with Jenkins & Bash
   • Category: Automation & DevOps | Read: 4 min
   • Key Focus: CI/CD SysAdmin orchestration, baseline patching, zero-touch setup

* Click any "Read Full Article" button in the Technical Insights section above to open full writeups!
    `,
    banner: `
========================================================================
     _ _____ ____ ___ _   _     _  ___  ____  _____ ____  _   _     _ 
    | | ____| __ )_ _| \\ | |   | |/ _ \\/ ___|| ____|  _ \\| | | |   | |
 _  | |  _| |  _ \\| ||  \\| |   | | | | \\___ \\|  _| | |_) | |_| |   | |
| |_| | |___| |_) | || |\\  | |_| | |_| |___) | |___|  __/|  _  | |_| |
 \\___/|_____|____/___|_| \\_|\\___/ \\___/|____/|_____|_|   |_| |_| \\___/ .

  JEBIN JOSEPH J. — B.E. (E.C.E.)
  "Learn • Innovate • Lead"  |  Building Reliable, Secure & Scalable IT
========================================================================
    `,
    help: `
[AVAILABLE COMMANDS]
  status         - View live cluster metrics, uptime & DR status
  whoami         - View executive profile, degree & credentials
  skills         - List enterprise technical arsenal & platforms
  articles       - Display published technical engineering articles
  experience     - Display chronological career trajectory & milestones
  contact        - Display email, phone, WhatsApp & social channels
  linkedin       - Open official LinkedIn profile (linkedin.com/in/jebinjosephj)
  github         - Open official GitHub profile (github.com/Beyain-Corp)
  instagram      - Open official Instagram profile (instagram.com/jebin_j_joseph)
  resume         - Trigger resume PDF download
  banner         - Display the official ASCII slogan banner
  clear          - Clear terminal screen
    `
  };

  function executeCommand(rawCmd) {
    const cmd = rawCmd.trim().toLowerCase();
    
    // Echo command line
    const userLine = document.createElement('div');
    userLine.className = 'terminal-line';
    userLine.innerHTML = `<span class="terminal-prompt">sysadmin@jebin-node01:~$</span> <span class="terminal-cmd-highlight">${escapeHtml(rawCmd)}</span>`;
    output.appendChild(userLine);

    if (cmd === 'clear') {
      output.innerHTML = '';
      return;
    }

    const responseLine = document.createElement('div');
    responseLine.className = 'terminal-line';

    if (terminalData[cmd]) {
      responseLine.innerHTML = `<pre style="font-family: inherit; margin: 0.35rem 0; white-space: pre-wrap; color: #38bdf8;">${terminalData[cmd].trim()}</pre>`;
      if (cmd === 'resume') {
        const link = document.createElement('a');
        link.href = 'assets/docs/Jebin_Joseph_Resume.pdf';
        link.download = 'Jebin_Joseph_J_Resume.pdf';
        link.click();
      }
      if (cmd === 'linkedin') {
        window.open('https://www.linkedin.com/in/jebinjosephj', '_blank');
      }
      if (cmd === 'github') {
        window.open('https://github.com/Beyain-Corp', '_blank');
      }
      if (cmd === 'instagram') {
        window.open('https://www.instagram.com/jebin_j_joseph/', '_blank');
      }
    } else if (cmd === '') {
      // do nothing
      return;
    } else {
      responseLine.innerHTML = `<span style="color: #ef4444;">Command not recognized: "${escapeHtml(rawCmd)}". Type <strong style="color: #38bdf8;">help</strong> to see available commands.</span>`;
    }

    output.appendChild(responseLine);
    output.parentElement.scrollTop = output.parentElement.scrollHeight;
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const value = input.value;
      if (value.trim()) {
        executeCommand(value);
      }
      input.value = '';
    }
  });

  const terminalBody = document.getElementById('terminalBody');
  if (terminalBody) {
    terminalBody.addEventListener('click', () => {
      if (window.getSelection().toString().length === 0) {
        input.focus();
      }
    });
  }

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      if (cmd) {
        executeCommand(cmd);
      }
    });
  });
}

function escapeHtml(string) {
  return String(string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* --------------------------------------------------------------------------
   7. Technical Articles Database & Reader Modal
   -------------------------------------------------------------------------- */
const articlesDatabase = {
  'article-test-project': {
    title: 'Test Project',
    category: 'Idea & Architecture',
    readTime: '1 min read',
    date: 'November 2026',
    linkedinUrl: 'https://www.linkedin.com/in/jebinjosephj',
    content: `
      <p>This technical article is actively being authored in Notion and synced live to your portfolio.</p>
      <div class="article-callout">
        <strong>Live Notion Sync:</strong> You can draft paragraphs, architecture diagrams, callouts, and code blocks directly in your Notion workspace. They will automatically sync here!
      </div>
    `
  },
  'article-vmware-ha': {
    title: 'Designing Multi-Site VMware ESXi 8.x HA & DRS Clusters for 99.9% Production Uptime',
    category: 'Virtualization & Compute',
    readTime: '6 min read',
    date: 'October 2024',
    linkedinUrl: 'https://www.linkedin.com/in/jebinjosephj',
    content: `
      <p>
        In modern enterprise infrastructure—especially within high-stakes pharmaceutical manufacturing execution systems (MES), laboratory information management systems (LIMS), and ERP databases—unplanned hypervisor downtime can result in massive financial loss and compliance violations. Achieving and sustaining <strong>99.9% production availability</strong> demands a resilient, deterministic VMware vSphere clustering architecture.
      </p>

      <div class="article-callout">
        <strong>Core Engineering Takeaway:</strong> High Availability (HA) is not merely a checkbox setting in vCenter; it is an integrated ecosystem involving physical cabling redundancy, SAN multi-pathing policies, isolated vMotion networks, and carefully calculated admission control policies.
      </div>

      <h3>1. Hardware Uniformity & N+1 / N+2 Sizing</h3>
      <p>
        Building a dependable vSphere cluster starts at physical host provisioning. When architecting multi-host clusters, strive for homogeneous CPU microarchitectures (Intel Xeon Scalable or AMD EPYC) to minimize Enhanced vMotion Compatibility (EVC) overhead and avoid masking critical hypervisor vector extensions.
      </p>
      <ul>
        <li><strong>Host Sizing (N+1 vs N+2):</strong> Calculate memory and compute overhead so that any two physical ESXi blades can fail simultaneously during peak workload without triggering resource starvation or dropping critical VMs.</li>
        <li><strong>Memory Reservation Policy:</strong> Avoid overcommitting RAM on tier-1 transactional database VMs (such as SQL Server or SAP application servers). Reserve 100% of guest memory to eliminate ballooning and ESXi hypervisor swap contention.</li>
      </ul>

      <h3>2. vMotion Network Design on Redundant 10GbE SFP+ Fabrics</h3>
      <p>
        vMotion traffic spikes can quickly saturate standard 1GbE interfaces, resulting in prolonged migration stun times or failed live migrations during automated host evacuate procedures.
      </p>
      <ul>
        <li><strong>Multi-NIC vMotion:</strong> Provision at least two dedicated 10GbE uplinks per host assigned to separate physical switches. Configure multiple VMkernel ports tagged for vMotion, each bound to an independent active uplink to allow simultaneous round-robin migration streams.</li>
        <li><strong>Jumbo Frames (MTU 9000):</strong> Enable end-to-end Jumbo Frames across the vSphere Distributed Switch (vDS), physical top-of-rack switches, and storage targets to reduce CPU interrupt overhead during high-volume memory replication.</li>
      </ul>

      <h3>3. vSphere HA Heartbeat Architecture & Split-Brain Prevention</h3>
      <p>
        A frequent failure mode in naive cluster configurations is "split-brain"—where a transient management network partition causes an ESXi host to believe all other nodes are offline while VMs remain running.
      </p>
      <ul>
        <li><strong>Datastore Heartbeats:</strong> vSphere HA relies on datastore heartbeats to discern between a total host failure and an isolated management network link. Always designate at least <strong>two independent shared SAN/iSCSI datastores</strong> accessible by all cluster members as heartbeat targets.</li>
        <li><strong>Host Isolation Response:</strong> Configure the cluster isolation response to <em>"Power Off and Restart VMs"</em>. Leaving VMs running in an isolated state risks duplicate active instances attempting concurrent writes to shared storage when nodes reconnect.</li>
      </ul>

      <h3>4. Distributed Resource Scheduler (DRS) & Anti-Affinity Rules</h3>
      <p>
        VMware DRS continuously balances CPU and memory distribution across hosts, but uncontrolled migrations during transient load spikes can degrade latency.
      </p>
      <ul>
        <li><strong>DRS Automation Level:</strong> Set DRS to <em>Fully Automated</em> with a moderate migration threshold (Level 3). This avoids "flapping" VM migrations caused by momentary batch processing spikes while maintaining balanced cluster loads.</li>
        <li><strong>Anti-Affinity Rules:</strong> Explicitly enforce VM-VM Anti-Affinity rules for redundant infrastructure workloads—such as Primary and Secondary Active Directory Domain Controllers, redundant DNS servers, and clustered database instances. Redundant nodes must never be collocated on the same physical ESXi hypervisor.</li>
      </ul>

      <h3>5. Lifecycle Management (vLCM) & Non-Disruptive Maintenance</h3>
      <p>
        With vSphere Lifecycle Manager (vLCM), ESXi host updates, driver packages, and OEM vendor add-ons are managed declaratively using a single cluster image baseline. Utilizing maintenance mode orchestration, DRS systematically evacuates running VMs without dropping a single active network connection, enabling zero-downtime rolling hypervisor patching.
      </p>

      <div class="article-callout">
        <strong>Summary:</strong> By pairing redundant 10GbE vMotion fabrics, strict datastore heartbeating, VM anti-affinity rules, and declarative vLCM baseline management, enterprise infrastructure teams can confidently deliver continuous 99.9% availability across production server fleets.
      </div>
    `
  },
  'article-entra-id': {
    title: 'Implementing Zero-Trust & Geofenced Conditional Access in Microsoft Entra ID',
    category: 'Cloud Identity & Security',
    readTime: '5 min read',
    date: 'August 2024',
    linkedinUrl: 'https://www.linkedin.com/in/jebinjosephj',
    content: `
      <p>
        With enterprise workforces operating across corporate campuses, remote branch locations, and mobile endpoints, the traditional perimeter-based security model ("castle and moat") is obsolete. Managing cloud identity for <strong>1,000+ hybrid directory accounts</strong> demands transitioning to a modern <strong>Zero-Trust architecture</strong>: <em>"Never Trust, Always Verify."</em>
      </p>

      <div class="article-callout">
        <strong>Zero-Trust Core Principle:</strong> Assume breach. Every authentication request—regardless of whether it originates within the corporate intranet or from an external IP—must undergo explicit verification of identity, device health, location, and session risk.
      </div>

      <h3>1. Granular Geofencing & Named Locations</h3>
      <p>
        The first defense against automated credential stuffing and global brute-force attacks is strict geographic boundary enforcement using Microsoft Entra Named Locations:
      </p>
      <ul>
        <li><strong>Trusted Corporate Egress Locations:</strong> Define IPv4/IPv6 CIDR blocks representing corporate headquarters, branch plants, and enterprise VPN exit nodes as Trusted Named Locations.</li>
        <li><strong>Explicit Block Policy for High-Risk Countries:</strong> Enforce a top-level Conditional Access block rule denying sign-in attempts originating from countries where the organization maintains no business operations or active employees.</li>
        <li><strong>Anonymous Proxy & Tor Exit Detection:</strong> Integrate Entra ID Protection to identify and flag sign-ins passing through known anonymous VPNs or commercial proxy networks, immediately prompting for step-up verification or session revocation.</li>
      </ul>

      <h3>2. Phishing-Resistant Multi-Factor Authentication (MFA)</h3>
      <p>
        Legacy MFA methods like SMS and voice phone calls are highly susceptible to SIM-swapping and adversary-in-the-middle (AiTM) reverse-proxy phishing kits.
      </p>
      <ul>
        <li><strong>Microsoft Authenticator Number Matching:</strong> Enforce number matching and geographic context display across all tenant users. This completely eliminates MFA fatigue attacks where adversaries bombard users with approval push notifications.</li>
        <li><strong>FIDO2 Hardware Keys & Passkeys for Privileged Roles:</strong> Require phishing-resistant FIDO2 security keys (YubiKeys) or Windows Hello for Business for all Global Administrators, Exchange Administrators, and Privileged Role accounts.</li>
      </ul>

      <h3>3. Device Compliance & Hybrid Azure AD Join</h3>
      <p>
        Authenticating identity is only half the battle; the endpoint device requesting access must also be verified as healthy, managed, and compliant with enterprise security standards.
      </p>
      <ul>
        <li><strong>Hybrid Azure AD Join Gate:</strong> In hybrid enterprise networks with on-premises Active Directory Domain Services (AD DS), configure Entra Connect Sync with Hybrid Azure AD Join. Conditional Access policies require devices to be joined to the enterprise domain before accessing sensitive corporate M365 and SharePoint resources.</li>
        <li><strong>Intune Device Compliance Policies:</strong> Verify that endpoints have BitLocker disk encryption enabled, up-to-date antivirus definitions (SentinelOne / Defender for Endpoint), and unsupported OS builds blocked from completing cloud token issuance.</li>
      </ul>

      <h3>4. Emergency Break-Glass Account Governance</h3>
      <p>
        When configuring stringent Conditional Access policies, organizations must protect against accidental self-lockout scenarios caused by misconfigured rules, federation outages, or third-party MFA disruptions.
      </p>
      <ul>
        <li>Provision exactly two cloud-only emergency accounts (e.g., <code>breakglass-admin-01@domain.onmicrosoft.com</code>) assigned permanent Global Administrator roles.</li>
        <li>Generate 40+ character cryptographically random passphrases, stored physically in separate fireproof safes.</li>
        <li>Exclude these accounts from all Conditional Access policies, but configure high-severity Azure Monitor and email/SMS alerts to notify executive IT leadership the moment an emergency account generates a sign-in log.</li>
      </ul>

      <div class="article-callout">
        <strong>Summary:</strong> By enforcing geofenced named locations, number-matched MFA, Hybrid Azure AD device compliance, and strict break-glass governance, organizations achieve robust Zero-Trust identity posture across all enterprise systems.
      </div>
    `
  },
  'article-commvault-dr': {
    title: 'Disaster Recovery Architecture: Achieving Sub-Hour RPO & 4-Hour RTO with Commvault in GxP Environments',
    category: 'Storage & Disaster Recovery',
    readTime: '7 min read',
    date: 'June 2024',
    linkedinUrl: 'https://www.linkedin.com/in/jebinjosephj',
    content: `
      <p>
        In highly regulated pharmaceutical manufacturing and enterprise health facilities, data backup and business continuity planning (BCP) are not merely defensive IT measures—they are <strong>legally mandated regulatory obligations</strong> governed by FDA 21 CFR Part 11, EU Annex 11, and good manufacturing practice (GxP) compliance guidelines.
      </p>

      <div class="article-callout">
        <strong>Regulatory Baseline:</strong> In a GxP environment, if production data, batch records, or quality control test results are lost or cannot be proven intact with immutable audit trails, entire manufacturing batches face destruction. Reliability is mission-critical.
      </div>

      <h3>1. Defining Rigorous Recovery Metrics: RPO vs RTO</h3>
      <p>
        An enterprise disaster recovery strategy must begin with clear, mathematically validated service level agreements agreed upon by business leadership and systems engineering:
      </p>
      <ul>
        <li><strong>Recovery Point Objective (RPO &lt; 1 Hour):</strong> The maximum tolerable period of transactional data loss. Achieved via continuous storage-level snapshots and hourly transactional log backups for mission-critical SQL and SAP ERP databases.</li>
        <li><strong>Recovery Time Objective (RTO &lt; 4 Hours):</strong> The total elapsed time from disaster declaration to full system operational restoration at an alternate recovery site or standby ESXi cluster.</li>
      </ul>

      <h3>2. Commvault MediaAgent Grid & Deduplication Architecture</h3>
      <p>
        Ingesting terabytes of backup data across a 24/7 manufacturing facility without degrading network throughput requires a distributed storage architecture:
      </p>
      <ul>
        <li><strong>Distributed MediaAgents:</strong> Localized MediaAgent servers placed adjacent to physical SAN fabrics handle data compression, encryption, and deduplication at the source or media layer, preventing network bottlenecking across core switches.</li>
        <li><strong>Global Deduplication Storage Pools:</strong> By maintaining a unified deduplication database (DDB) on high-speed NVMe flash, Commvault eliminates redundant block transfers across identical virtual machine OS images and file shares, reducing storage consumption by up to 75%.</li>
      </ul>

      <h3>3. Immutable Storage, WORM & Air-Gapped Ransomware Defense</h3>
      <p>
        Modern ransomware variants actively target backup repositories first, seeking to delete shadow copies and encrypt recovery catalogs before locking primary production storage.
      </p>
      <ul>
        <li><strong>WORM (Write Once, Read Many) Storage Locking:</strong> Backup snapshots are written to hardened Linux target repositories with immutable file locking enabled. Even an administrator account cannot delete or overwrite these recovery sets until the retention timer has elapsed.</li>
        <li><strong>Air-Gapped Off-Site Replication:</strong> Critical backup copies are asynchronously replicated to an off-site secondary facility via an isolated management network connection, ensuring full survivability against site-wide power loss, physical calamity, or network compromises.</li>
      </ul>

      <h3>4. GxP Audit Readiness & Validated Non-Disruptive DR Drills</h3>
      <p>
        A disaster recovery plan that has never been tested in practice is merely a theoretical document.
      </p>
      <ul>
        <li><strong>Automated Sandbox Restorations:</strong> Utilizing Commvault Live Sync and automated sandbox restore workflows, VMs and databases are restored into an isolated VLAN testbed on a monthly schedule. Automated scripts verify database consistency checks (DBCC CHECKDB) and service startup times without touching live production.</li>
        <li><strong>Audit Trail Generation:</strong> Commvault generates automated cryptographically verifiable compliance reports recording backup timestamps, media integrity hash comparisons, and restoration audit logs ready for FDA or regulatory auditor submission.</li>
      </ul>

      <div class="article-callout">
        <strong>Summary:</strong> Achieving sub-hour RPO and 4-hour RTO in GxP environments requires a disciplined combination of distributed MediaAgents, immutable WORM storage locks, continuous transactional log shipping, and automated non-disruptive disaster drills.
      </div>
    `
  },
  'article-jenkins-automation': {
    title: 'Infrastructure Automation: Streamlining Systems Provisioning with Jenkins & Bash Scripting',
    category: 'Automation & DevOps',
    readTime: '4 min read',
    date: 'April 2024',
    linkedinUrl: 'https://www.linkedin.com/in/jebinjosephj',
    content: `
      <p>
        Traditional system administration is frequently bogged down by repetitive manual workflows: building virtual machines by hand, clicking through wizard dialogs, manually applying security patches, and typing repetitive configuration commands. Applying <strong>DevOps automation principles</strong> to internal enterprise systems transforms error-prone manual runbooks into deterministic, self-documenting pipelines.
      </p>

      <div class="article-callout">
        <strong>The SysAdmin Automation Mantra:</strong> If a system configuration task or deployment must be performed more than twice, write a script. If it must be performed across multiple nodes or team members, wire it into a Jenkins pipeline.
      </div>

      <h3>1. Orchestrating SysAdmin Workflows with Parameterized Jenkins Pipelines</h3>
      <p>
        While Jenkins is traditionally associated with software compilation and web app deployment, it serves as an exceptional automation orchestrator for enterprise IT infrastructure:
      </p>
      <ul>
        <li><strong>Self-Service Parameterized Jobs:</strong> Systems engineers can select target node names, OS flavors (Windows Server 2022, Ubuntu 22.04 LTS), network VLAN IDs, and initial CPU/RAM allocations directly from a web UI with built-in role-based access control.</li>
        <li><strong>Auditability & Role-Based Tracing:</strong> Jenkins records exactly who triggered each provisioning job, what parameters were supplied, and retains the full execution console output for compliance logs.</li>
      </ul>

      <h3>2. Writing Resilient, Idempotent Shell Scripts</h3>
      <p>
        The foundation of reliable infrastructure automation is writing scripts that can run repeatedly without causing unintended side effects (idempotency):
      </p>
      <ul>
        <li><strong>Strict Bash Execution Flags:</strong> Always start Bash automation scripts with <code>set -euo pipefail</code>. This immediately terminates execution if any command fails, prevents unassigned variable bugs, and ensures piped command failures are properly surfaced.</li>
        <li><strong>Pre-Flight Environment Checks:</strong> Scripts must verify prerequisites—such as available disk space, network gateway reachability, and DNS resolution—before initiating package installations or partition resizing.</li>
        <li><strong>Modular Configuration Handlers:</strong> Separate logic into distinct functions for hostname assignment, NTP synchronization, firewall rules, and security agent enrollment (SentinelOne, Lansweeper, monitoring agents).</li>
      </ul>

      <h3>3. Automated Fleet Hardening & Baseline Drift Detection</h3>
      <p>
        Beyond initial server provisioning, automated pipelines play a pivotal role in ensuring that running production systems do not deviate from enterprise security standards:
      </p>
      <ul>
        <li><strong>Scheduled CIS Benchmark Scans:</strong> Jenkins triggers automated SSH/WinRM scans checking for unauthorized local administrators, disabled host firewalls, or insecure legacy protocol ciphers (such as SMBv1 or TLS 1.0/1.1).</li>
        <li><strong>Automated Remediation Hooks:</strong> When minor configuration drift is detected, remediation scripts automatically re-apply standard hardened configuration templates and notify the SysAdmin team via webhook alerts.</li>
      </ul>

      <h3>4. Measurable Operational Impact</h3>
      <p>
        By replacing manual workstation and server setup procedures with automated Jenkins pipeline execution:
      </p>
      <ul>
        <li><strong>Provisioning Turnaround:</strong> Reduced server commissioning time from <strong>4 hours down to under 12 minutes</strong> per instance.</li>
        <li><strong>Zero Human Error:</strong> Eliminated forgotten firewall rules, mismatched DNS PTR records, or missed security baseline agent installations across the enterprise fleet.</li>
      </ul>

      <div class="article-callout">
        <strong>Summary:</strong> Infrastructure automation with Jenkins and robust Bash/PowerShell scripting elevates the SysAdmin role from repetitive fire-fighting to high-leverage architectural engineering.
      </div>
    `
  }
};

function initArticleReader() {
  const modal = document.getElementById('articleModal');
  const closeModalBtn = document.getElementById('closeArticleModal');
  const modalFooterCloseBtn = document.getElementById('articleModalCloseBtn');
  const modalCategory = document.getElementById('articleModalCategory');
  const modalReadTime = document.getElementById('articleModalReadTime');
  const modalTitle = document.getElementById('articleModalTitle');
  const modalDate = document.getElementById('articleModalDate');
  const modalContent = document.getElementById('articleModalContent');
  const modalLinkedInBtn = document.getElementById('articleModalLinkedInBtn');
  const modalBody = document.getElementById('articleModalBody');
  const articlesGrid = document.querySelector('.articles-grid');

  if (!modal) return;

  function openArticle(articleId) {
    const article = articlesDatabase[articleId];
    if (!article) return;

    if (modalCategory) modalCategory.textContent = article.category;
    if (modalReadTime) modalReadTime.textContent = article.readTime;
    if (modalTitle) modalTitle.textContent = article.title;
    if (modalDate) modalDate.textContent = article.date;
    if (modalContent) modalContent.innerHTML = article.content;
    if (modalLinkedInBtn && article.linkedinUrl) {
      modalLinkedInBtn.href = article.linkedinUrl;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (modalBody) {
      modalBody.scrollTop = 0;
    }
  }

  function closeArticle() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function attachArticleListeners() {
    const openArticleBtns = document.querySelectorAll('.js-open-article');
    openArticleBtns.forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const articleId = btn.getAttribute('data-article-id');
        if (articleId) {
          openArticle(articleId);
        }
      };
    });
  }

  // Initial listener attachment for pre-rendered HTML cards
  attachArticleListeners();

  // Load dynamic articles if assets/data/articles.json is present (synced from Notion)
  fetch('assets/data/articles.json')
    .then(res => {
      if (!res.ok) throw new Error('Data file not available');
      return res.json();
    })
    .then(articles => {
      if (!Array.isArray(articles) || articles.length === 0) return;

      // Update in-memory database
      articles.forEach(art => {
        articlesDatabase[art.id] = art;
      });

      // Render fresh cards if articlesGrid exists
      if (articlesGrid) {
        articlesGrid.innerHTML = articles.map(art => `
          <article class="article-card">
            <div class="article-badge-row">
              <span class="article-category">${escapeHtml(art.category)}</span>
              <span class="article-read-time"><i class="fa-regular fa-clock"></i> ${escapeHtml(art.readTime)}</span>
            </div>
            <h3 class="article-title">${escapeHtml(art.title)}</h3>
            <p class="article-summary">${escapeHtml(art.summary || '')}</p>
            <div class="article-tags">
              ${(art.tags || []).map(t => `<span class="article-tag">${escapeHtml(t)}</span>`).join('')}
            </div>
            <div class="article-footer">
              <span class="article-date"><i class="fa-regular fa-calendar"></i> ${escapeHtml(art.date)}</span>
              <button class="btn-read-article js-open-article" data-article-id="${escapeHtml(art.id)}">
                <span>Read Insight</span>
                <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </article>
        `).join('');

        // Re-attach listeners to dynamic DOM elements
        attachArticleListeners();
      }
    })
    .catch(() => {
      // Gracefully maintain pre-rendered HTML and embedded fallback database
    });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeArticle);
  }

  if (modalFooterCloseBtn) {
    modalFooterCloseBtn.addEventListener('click', closeArticle);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeArticle();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeArticle();
    }
  });
}

/* --------------------------------------------------------------------------
   8. Resume Viewer Modal
   -------------------------------------------------------------------------- */
function initResumeModal() {
  const openModalBtns = document.querySelectorAll('.js-open-resume-modal');
  const modal = document.getElementById('resumeModal');
  const closeModalBtn = document.getElementById('closeResumeModal');
  const modalIframe = document.getElementById('resumeIframe');

  if (!modal) return;

  openModalBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (modalIframe && !modalIframe.getAttribute('src')) {
        modalIframe.setAttribute('src', 'assets/docs/Jebin_Joseph_Resume.pdf');
      }
    });
  });

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

/* --------------------------------------------------------------------------
   8. Contact Form Dispatcher
   -------------------------------------------------------------------------- */
function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  const whatsappSendBtn = document.getElementById('whatsappSendBtn');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('formName').value;
      const email = document.getElementById('formEmail').value;
      const subject = document.getElementById('formSubject').value;
      const message = document.getElementById('formMessage').value;

      const mailtoLink = `mailto:jjebin05@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        `Hi Jebin,\n\nMy name is ${name} (${email}).\n\n${message}`
      )}`;

      window.location.href = mailtoLink;
    });
  }

  if (whatsappSendBtn) {
    whatsappSendBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const name = document.getElementById('formName').value || 'Visitor';
      const message = document.getElementById('formMessage').value || 'I came across your portfolio and would like to connect.';

      const text = `Hello Jebin! My name is ${name}. ${message}`;
      const url = `https://wa.me/919043437743?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    });
  }
}

/* --------------------------------------------------------------------------
   9. Back to Top Button
   -------------------------------------------------------------------------- */
function initBackToTop() {
  const backToTopBtn = document.getElementById('backToTopBtn');
  if (!backToTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  }, { passive: true });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

