# Managing Technical Articles & Engineering Insights
**Jebin Joseph J. — Portfolio Content Management Guide**

This guide outlines how to manage, publish, and showcase technical articles on your single-page portfolio, maximizing both direct recruiter engagement and LinkedIn network reach.

---

## Architecture Overview

Your portfolio uses a **Hybrid Publishing System**:
1. **In-Portfolio Interactive Reader Modal:** Visitors and hiring managers can read full technical articles directly on your portfolio (`#articles`) without leaving the page.
2. **LinkedIn Cross-Platform Syndication:** Each card features direct buttons linking readers to discuss, like, and share the article on your official [LinkedIn Profile](https://www.linkedin.com/in/jebinjosephj).
3. **Interactive SysAdmin Console:** The terminal at the bottom of the page includes an `articles` command displaying a quick summary of your published thought leadership.

---

## How to Add a New Article (3 Simple Steps)

### Step 1: Add the Article Content to `script.js`
Open `script.js` and locate the `articlesDatabase` object (around line 405). Add a new key for your article:

```javascript
'article-my-new-topic': {
  title: 'Your Compelling Engineering Title',
  category: 'Virtualization & Compute', // or Cloud Identity, Storage & DR, Automation
  readTime: '5 min read',
  date: 'November 2024',
  linkedinUrl: 'https://www.linkedin.com/in/jebinjosephj', // Link to your published LinkedIn post/article
  content: `
    <p>Opening paragraph introducing the engineering problem, enterprise scale, or business criticality.</p>
    
    <div class="article-callout">
      <strong>Core Engineering Takeaway:</strong> Key architectural principle or lesson learned.
    </div>

    <h3>1. Architectural Overview</h3>
    <p>Detailed explanation of your infrastructure design, topology, or methodology.</p>
    <ul>
      <li><strong>Point 1:</strong> Specific technical parameter or configuration.</li>
      <li><strong>Point 2:</strong> Best practice or operational safeguard.</li>
    </ul>

    <h3>2. Implementation & Metrics</h3>
    <p>Measurable outcomes (e.g. 99.9% uptime, 75% storage savings, 12-minute provisioning).</p>
  `
}
```

---

### Step 2: Add the Article Card in `index.html`
Open `index.html` and find the `<div class="articles-grid">` section (around line 1100). Duplicate one of the existing article cards and update the details:

```html
<!-- New Article Card -->
<article class="article-card">
  <div class="article-badge-row">
    <span class="article-category">Your Category</span>
    <span class="article-read-time"><i class="fa-regular fa-clock"></i> 5 min read</span>
  </div>
  <h3 class="article-title">Your Compelling Engineering Title</h3>
  <p class="article-summary">
    A concise 2-sentence summary highlighting the challenge, enterprise scope, and operational impact.
  </p>
  <div class="article-tags">
    <span class="article-tag">Tech1</span>
    <span class="article-tag">Tech2</span>
    <span class="article-tag">Tech3</span>
  </div>
  <div class="article-footer">
    <span class="article-date"><i class="fa-regular fa-calendar"></i> Nov 2024</span>
    <div style="display: flex; gap: 0.5rem;">
      <!-- Opens the on-site reader modal -->
      <button class="btn-read-article js-open-article" data-article-id="article-my-new-topic">
        <i class="fa-solid fa-book-open"></i> Read Full Article
      </button>
      <!-- Direct link to LinkedIn post -->
      <a href="https://www.linkedin.com/in/jebinjosephj" target="_blank" rel="noopener noreferrer" class="btn-read-article btn-card-link" title="Discuss on LinkedIn">
        <i class="fa-brands fa-linkedin"></i>
      </a>
    </div>
  </div>
</article>
```

---

### Step 3: Update Terminal `articles` Command (Optional)
In `script.js`, search for `articles:` inside `terminalData`. Add your new article to the ASCII list so visitors querying the terminal console can discover it.

---

## Best Practices for Authoring Articles

1. **Lead with Enterprise Numbers & Scale:**
   - Mention real metrics: *"1,000+ Active Directory objects"*, *"99.9% virtualization uptime"*, *"RPO < 1 hour"*, *"sub-12 minute deployment"*.
2. **Structure with Clear Headings (`<h3>`) and Bullet Points:**
   - Hiring managers and recruiters skim technical writeups. Use bold key terms so your core competence stands out immediately.
3. **Use the `.article-callout` Block for Key Lessons:**
   - Emphasize safety guidelines, compliance requirements (e.g. GxP, FDA 21 CFR Part 11), or architectural trade-offs.
4. **Distribute on LinkedIn:**
   - When you publish an article on LinkedIn, publish it under **"Write an article"** on your personal profile.
   - Add relevant hashtags: `#VMware #SysAdmin #CloudIdentity #DisasterRecovery #DevOps #ITLeadership`.
   - Update `linkedinUrl` in your portfolio so visitors can connect directly with the post.

---

## Suggested Topics for Future Articles

Based on your verified 8+ years of IT infrastructure leadership:
- **Storage Area Networks (SAN) Multipathing:** Comparing Round Robin vs Least Queue Depth policies across Dell EMC / HPE Nimble iSCSI fabrics.
- **Enterprise Endpoint Hardening:** Rolling out SentinelOne EDR/XDR across 1,000+ endpoints with Zero-Trust compliance.
- **Active Directory Forest Recovery:** Automated non-authoritative vs authoritative restoration procedures during ransomware simulations.
- **SAP ERP & Manufacturing Systems High Availability:** Designing clustered failover topologies with zero transactional data loss.
- **GxP Computerized Systems Validation (CSV):** Maintaining audit-ready infrastructure change control logs for pharmaceutical regulatory inspections.

