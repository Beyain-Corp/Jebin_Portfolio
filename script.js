/* ==========================================================================
   JEBIN JOSEPH J. - ENTERPRISE IT INFRASTRUCTURE & SYSTEMS PORTFOLIO
   Interactive Client-side Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initMobileNav();
  initActiveNavLink();
  initScrollSpy();
  initAnimatedCounters();
  initSkillsFilter();
  initInteractiveTerminal();
  initArticleReader();
  initArticleCategoryFilter();
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
  const lastLoginEl = document.getElementById('terminalLastLoginLine');
  const liveClockEl = document.getElementById('terminalLiveClock');

  if (!input || !output) return;

  // Format real-time Last Login timestamp in IST (Chennai, India)
  function getISTDateTime(d = new Date()) {
    const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' }).format(d);
    const month = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', month: 'short' }).format(d);
    const day = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', day: 'numeric' }).format(d);
    const time = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(d);
    return `${weekday} ${month} ${day} ${time}`;
  }

  // Set Last Login line to current time in IST (Chennai)
  if (lastLoginEl) {
    lastLoginEl.textContent = `Last login: ${getISTDateTime()} on ttys004 (IST - Chennai)`;
  }

  // Live ticking clock in terminal header (IST - Chennai)
  function updateLiveClock() {
    if (!liveClockEl) return;
    const now = new Date();
    const timeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(now);
    liveClockEl.innerHTML = `<i class="fa-regular fa-clock"></i> <span>${timeStr} IST (Chennai)</span>`;
  }
  updateLiveClock();
  setInterval(updateLiveClock, 1000);

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
    time: () => {
      const now = new Date();
      const fullDate = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'medium'
      }).format(now);
      return `
[CLUSTER CLOCK & TIME SERVICES]
--------------------------------------------------
Current Time  : ${fullDate}
Timezone      : Indian Standard Time (IST - Asia/Kolkata)
Location      : Chennai, Tamil Nadu, India (UTC+05:30)
NTP Sync      : time.google.com / pool.ntp.org (Synced)
Precision     : Stratum 1 Reference Clock (Jitter < 0.2ms)
Status        : 100% HEALTHY & SYNCHRONIZED
--------------------------------------------------
      `;
    },
    date: () => {
      const now = new Date();
      const fullDate = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'medium'
      }).format(now);
      return `
[CLUSTER CLOCK & TIME SERVICES]
--------------------------------------------------
Current Time  : ${fullDate}
Timezone      : Indian Standard Time (IST - Asia/Kolkata)
Location      : Chennai, Tamil Nadu, India (UTC+05:30)
NTP Sync      : time.google.com / pool.ntp.org (Synced)
Precision     : Stratum 1 Reference Clock (Jitter < 0.2ms)
Status        : 100% HEALTHY & SYNCHRONIZED
--------------------------------------------------
      `;
    },
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
  time / date    - Display live IST (Chennai) cluster clock & NTP status
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
      output.innerHTML = `
        <div class="terminal-line" style="color: #94a3b8;" id="terminalLastLoginLine">
          Last login: ${getISTDateTime()} on ttys004 (IST - Chennai)
        </div>
        <div class="terminal-line" style="color: #38bdf8;">
          Jebin Joseph J. Enterprise Systems Environment initialized. Type 'help' for commands.
        </div>
        <div class="terminal-line" style="color: #94a3b8;">
          Type <strong style="color: #38bdf8;">help</strong> or click one of the quick presets below to query node status, skills, or download resume.
        </div>
      `;
      return;
    }

    const responseLine = document.createElement('div');
    responseLine.className = 'terminal-line';

    const rawContent = terminalData[cmd];
    const content = typeof rawContent === 'function' ? rawContent() : rawContent;

    if (content) {
      responseLine.innerHTML = `<pre style="font-family: inherit; margin: 0.35rem 0; white-space: pre-wrap; color: #38bdf8;">${content.trim()}</pre>`;
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
  'article-project24': {
    title: 'Project24',
    category: 'Info-Test',
    readTime: '5mins',
    date: 'Nov 2026',
    content: '<p>This is myself Jebin. You can find me near Perumbakkam.</p>'
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
  const modalBody = document.getElementById('articleModalBody');
  const articlesGrid = document.querySelector('.articles-grid');

  if (!modal) return;

  function openArticle(articleId) {
    const article = articlesDatabase[articleId];
    if (!article) return;

    if (modalCategory) modalCategory.textContent = article.category || 'Article';
    if (modalReadTime) modalReadTime.textContent = article.readTime || '3 min read';
    if (modalTitle) modalTitle.textContent = article.title || 'Untitled Article';
    if (modalDate) modalDate.textContent = article.date || '';
    if (modalContent) modalContent.innerHTML = article.content || '<p>Content being authored in Notion.</p>';

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
      if (!Array.isArray(articles)) return;

      // Update in-memory database
      articles.forEach(art => {
        articlesDatabase[art.id] = art;
      });

      // Render fresh cards if articlesGrid exists
      if (articlesGrid) {
        if (articles.length === 0) {
          articlesGrid.innerHTML = `
            <div class="empty-notion-state" style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1.5rem; background: var(--bg-surface); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">
              <i class="fa-solid fa-feather-pointed" style="font-size: 2.2rem; color: var(--accent-cyan); margin-bottom: 1rem;"></i>
              <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">No Notion Articles Published Yet</h3>
              <p style="font-size: 0.92rem; color: var(--text-muted); max-width: 500px; margin: 0 auto;">Articles and technical notes published in your Notion workspace will automatically sync here.</p>
            </div>
          `;
        } else {
          articlesGrid.innerHTML = articles.map(art => `
            <article class="article-card" data-category="${escapeHtml(art.category)}">
              ${art.coverImage ? `
              <div class="article-card-cover">
                <img src="${escapeHtml(art.coverImage)}" alt="${escapeHtml(art.title)}" loading="lazy" decoding="async">
              </div>` : ''}
              <div class="article-card-inner">
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
              </div>
            </article>
          `).join('');

          // Re-attach listeners to dynamic DOM elements
          attachArticleListeners();
          initArticleCategoryFilter();
        }
      }
    })
    .catch(() => {
      // Gracefully maintain pre-rendered HTML and embedded fallback database
    });

  // Global 1-Click Code Block Copy Handler
  document.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.btn-copy-code');
    if (copyBtn) {
      const codeBlock = copyBtn.closest('.article-code-block');
      const codeEl = codeBlock ? codeBlock.querySelector('code') : null;
      if (codeEl) {
        navigator.clipboard.writeText(codeEl.innerText).then(() => {
          const originalHtml = copyBtn.innerHTML;
          copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
          copyBtn.style.background = 'var(--accent-emerald)';
          copyBtn.style.color = '#ffffff';
          setTimeout(() => {
            copyBtn.innerHTML = originalHtml;
            copyBtn.style.background = '';
            copyBtn.style.color = '';
          }, 2000);
        }).catch(err => {
          console.error('Clipboard copy error:', err);
        });
      }
    }
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
   7b. Dynamic Category Filter for Articles
   -------------------------------------------------------------------------- */
function initArticleCategoryFilter() {
  const filterBar = document.getElementById('articlesFilterBar');
  const cards = document.querySelectorAll('.article-card');
  if (!filterBar || cards.length === 0) return;

  const categories = new Set();
  cards.forEach(card => {
    const cat = card.getAttribute('data-category');
    if (cat && cat.trim()) categories.add(cat.trim());
  });

  if (categories.size === 0) {
    filterBar.innerHTML = '';
    return;
  }

  let filterHtml = `<button class="article-filter-btn active" data-filter="all">All Articles (${cards.length})</button>`;
  categories.forEach(cat => {
    const count = Array.from(cards).filter(c => (c.getAttribute('data-category') || '').trim() === cat).length;
    filterHtml += `<button class="article-filter-btn" data-filter="${escapeHtml(cat)}">${escapeHtml(cat)} (${count})</button>`;
  });
  filterBar.innerHTML = filterHtml;

  const buttons = filterBar.querySelectorAll('.article-filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetCategory = btn.getAttribute('data-filter');

      cards.forEach(card => {
        const cardCat = (card.getAttribute('data-category') || '').trim();
        if (targetCategory === 'all' || cardCat === targetCategory) {
          card.classList.remove('is-hidden');
        } else {
          card.classList.add('is-hidden');
        }
      });
    });
  });
}

/* --------------------------------------------------------------------------
   7c. Global Dark / Light Theme Engine
   -------------------------------------------------------------------------- */
function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  if (!toggleBtn) return;

  function getPreferredTheme() {
    const stored = localStorage.getItem('jebin-theme');
    if (stored) return stored;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeIcon) {
        themeIcon.className = 'fa-solid fa-sun';
      }
      toggleBtn.setAttribute('title', 'Switch to Light Mode');
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeIcon) {
        themeIcon.className = 'fa-solid fa-moon';
      }
      toggleBtn.setAttribute('title', 'Switch to Dark Mode');
    }
  }

  // Initial theme application
  applyTheme(getPreferredTheme());

  // Click toggle
  toggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('jebin-theme', newTheme);
  });

  // OS listener
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('jebin-theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
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

