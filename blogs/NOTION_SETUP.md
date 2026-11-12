# Notion as Headless CMS Setup Guide
**Jebin Joseph J. — Portfolio Engineering Insights Pipeline**

This guide explains how to connect your Notion workspace directly to your portfolio so that whenever you write or edit an article in Notion, it automatically synchronizes to your website's **Engineering Articles & Insights** section.

---

## 🏗️ How the Pipeline Works

```
┌─────────────────────────┐
│   Write in Notion       │
│  (Database & Editor)    │
└────────────┬────────────┘
             │  Triggers via GitHub Action (or 1-click manual trigger)
             ▼
┌─────────────────────────┐
│  scripts/sync-notion.js │  Fetches blocks, headings, callouts & code
└────────────┬────────────┘
             │  Compiles clean HTML
             ▼
┌─────────────────────────┐
│ assets/data/articles.json│ Static JSON file in portfolio repo
└────────────┬────────────┘
             │  Instant load & interactive reader modal
             ▼
┌─────────────────────────┐
│ Live Portfolio Website  │ (index.html#articles)
└─────────────────────────┘
```

---

## 🚀 5-Step Setup Walkthrough

### Step 1: Create a Notion Integration
1. Go to **[notion.so/my-integrations](https://www.notion.so/my-integrations)** and sign in to your Notion account.
2. Click **"+ New integration"**.
3. Name it: `Jebin Portfolio Sync`.
4. Select your workspace and ensure **Read content** permission is checked.
5. Click **Submit**.
6. Copy the **Internal Integration Secret** (it starts with `secret_...`). This is your `NOTION_API_KEY`.

---

### Step 2: Create Your Articles Database in Notion
1. In your Notion workspace, create a new **Full Page Database** (call it `Engineering Articles`).
2. Add the following columns (properties):

| Property Name | Property Type | Description |
| :--- | :--- | :--- |
| **Title** | Title (Default) | The title of your article |
| **Category** | Select | e.g. `Virtualization`, `Cloud Identity`, `Storage & DR`, `Automation` |
| **Summary** | Text | 1–2 sentences summarizing the article on the portfolio card |
| **Tags** | Multi-select | e.g. `VMware`, `Entra ID`, `Commvault`, `Jenkins` |
| **ReadTime** | Text | e.g. `5 min read` |
| **Date** | Date | Publish date (e.g. October 2026) |
| **Published** | Checkbox | Check this box when you are ready to publish on the website |
| **LinkedInUrl** | URL | (Optional) Link to your published LinkedIn post/article |
| **Slug** | Text | (Optional) Custom URL ID, e.g. `article-vmware-ha` |

---

### Step 3: Connect the Database to Your Integration
By default, Notion integrations cannot see any page until you explicitly give them access:
1. Open your `Engineering Articles` database in Notion.
2. Click the **`•••`** menu in the top right corner.
3. Scroll down and click **"Connect to"** (or **"Add connections"**).
4. Select your integration: `Jebin Portfolio Sync`.
5. Click **Confirm**.

---

### Step 4: Copy Your Database ID
Look at the URL of your Notion database in the browser:
```
https://www.notion.so/myworkspace/a8aec43384f447ed84390e8e42c2e089?v=...
                                  └──────────────┬──────────────┘
                                      This 32-character string
                                      is your NOTION_DATABASE_ID
```
Copy the 32-character string before the `?v=`.

---

### Step 5: Test Locally (Optional)
Run this command in your terminal to test syncing your Notion database directly to your portfolio:

```bash
NOTION_API_KEY="secret_your_secret_here" NOTION_DATABASE_ID="your_database_id_here" node scripts/sync-notion.js
```

You should see:
```text
[INFO] Connecting to Notion Database...
[SUCCESS] Found 4 records in Notion.
 -> Fetching content for: "Architecting Zero-Downtime VMware ESXi 8.x..."
[DONE] Successfully synced articles from Notion! Saved to assets/data/articles.json
```

---

## ⚡ Automated Sync with GitHub Actions

Whenever you publish or edit in Notion, GitHub can sync your portfolio automatically:

1. In your GitHub repository, navigate to **Settings** > **Secrets and variables** > **Actions**.
2. Click **New repository secret**:
   - Name: `NOTION_API_KEY`
   - Value: `secret_your_integration_secret`
3. Click **New repository secret** again:
   - Name: `NOTION_DATABASE_ID`
   - Value: `your_32_character_database_id`
4. **Triggering a Sync:**
   - Go to the **Actions** tab in GitHub.
   - Click **"Sync Notion Articles to Portfolio"** on the left menu.
   - Click **"Run workflow"** > **"Run workflow"**.
   - Within 30 seconds, your site will have your latest Notion articles live!
   - *Note: The workflow also runs on a schedule every 6 hours automatically.*

---

## 💡 Supported Notion Blocks

The sync script automatically translates native Notion blocks into your portfolio's Light Theme styling:
- **Headings (H1, H2, H3)** &rarr; Rendered as styled section headers.
- **Bulleted & Numbered Lists** &rarr; Rendered as clean, readable lists.
- **Callouts** &rarr; Rendered as cyan highlight boxes (`.article-callout`).
- **Code Blocks** &rarr; Formatted with syntax styling and JetBrains Mono monospace font.
- **Rich Text Formatting** &rarr; Bold, italics, strikethrough, inline code, and hyperlinks.

