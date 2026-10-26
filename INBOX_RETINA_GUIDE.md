# Inbox Retina — Complete Operating Guide & Multi-Email Architecture

**Inbox Retina** is a Mailtrack-parity email tracking, link intelligence, and sales telemetry platform deployed across two independent domains:

| Environment | Dashboard URL | Short Links & QR Manager | Outlook Add-in Manifest | Redis Key Namespace |
| :--- | :--- | :--- | :--- | :--- |
| **mckellar.dev** | `https://www.mckellar.dev/email-logs` | `https://www.mckellar.dev/links` | `https://www.mckellar.dev/outlook/manifest.xml` | `mckellar:retina:*` |
| **mycommercialfunding.com** | `https://mycommercialfunding.com/email-logs` | `https://mycommercialfunding.com/links` | `https://mycommercialfunding.com/outlook/manifest.xml` | `retina:*` |

---

## 1. How Different Email Addresses Are Handled

Inbox Retina is built from the ground up to handle **multiple users**, **multiple sending email addresses (aliases/mailboxes) per user**, and **multiple recipients** cleanly.

### A. User Accounts vs. Master Password Authentication
When you open `/email-logs`, you can authenticate in two ways:
1. **Email + Password Account (Recommended for Multi-Email Users)**
   - **Sign Up**: Click **Sign Up**, enter your primary email address (e.g., `richard@mckellar.dev`) and a password (`6+` characters).
   - **Log In**: Enter your primary email and password.
   - Behind the scenes (`POST /api/retina/auth`), Inbox Retina stores a `UserAccount` record in the `retina:users` Redis hash:
     ```json
     {
       "email": "richard@mckellar.dev",
       "password": "...",
       "createdAt": "2026-10-26T20:00:00.000Z",
       "connectedEmails": [
         "richard@mckellar.dev",
         "richard@mycommercialfunding.com",
         "therealmckellar@gmail.com"
       ]
     }
     ```
2. **Master Password Mode (Admin All-Access)**
   - If you leave the email field blank (or enter any email) and sign in using the master password (`RETINA_PASSWORD`, default `Funding2026!`), you are authenticated with full administrative access.
   - If you log in with **no email** and the master password, the dashboard displays **all** tracked emails across every sender on that domain.

---

### B. Connecting Multiple Sending Email Addresses to One Account
You likely send emails from more than one address (e.g., `richard@mckellar.dev`, `info@mckellar.dev`, a `@gmail.com` address, or multiple Outlook mailboxes). You do **not** need separate logins for each address:

1. Log into the dashboard with your primary email account.
2. In the top header bar, click **`+ Connect Email`** next to the email selector badge.
3. Type the additional email address you send from (e.g., `sales@mckellar.dev` or `richard@gmail.com`) and click **Connect**.
4. That address is permanently added to your account's `connectedEmails` list in Redis.

#### What happens once multiple emails are connected?
- **Unified Activity Feed & Track Sheet**: Whenever the dashboard requests `/api/retina/logs` or `/api/retina/feed`, it sends both your active email (`x-retina-sender`) and your full list of connected addresses (`x-retina-connected-emails`). The backend fetches `retina:sent:<email>` and `retina:feed:<email>` for **every connected address in parallel**, deduplicates by `uid`, and merges them into one chronological view.
- **Active Sender Switcher**: Use the dropdown in the top header bar to switch which connected email address is currently active when using **Quick Compose**, **Create Track**, the **Gmail Bookmarklet**, or the **Signature Ghost Pixel**.

---

### C. How Each Sending Method Tags the Sender Email Address

Every tracked email stores a `senderEmail` field so Inbox Retina knows which mailbox sent it:

| Sending Channel | How `senderEmail` Is Determined |
| :--- | :--- |
| **Outlook Add-in (Desktop, Web, Mac)** | Automatically reads `Office.context.mailbox.userProfile.emailAddress` from the active Outlook mailbox at the moment you click **Send**. If you have 4 different email accounts in Outlook, each email is automatically tagged with the exact mailbox you sent it from—no manual switching required. |
| **Quick Compose (Dashboard)** | Uses the email address currently selected in the top header dropdown (`x-retina-sender`). The outbound email sets `Reply-To` to that address so replies go straight back to your inbox. |
| **Create Track (Single-Email Pixel)** | Embeds `&sender=<selectedEmail>` into both the sent-registration call and the `<img src="...">` tracking pixel URL. |
| **Gmail Smart Bookmarklet** | Embeds the currently selected email address from the dashboard header into the bookmarklet code. When clicked inside a Gmail compose window, it registers the email under that `senderEmail`. |
| **Signature Ghost Pixel** | Uses `src=signature` and a `SIG-...` UID. Opens are logged passively in the Track Sheet under your address without triggering email or push alert spam. |

---

### D. How Real-Time Open & Click Alerts Route by Email Address
When a recipient opens your email (`/api/pixel`) or clicks a tracked link (`/api/l`):
1. Inbox Retina looks up the original sent email record by `uid` (`getSentEmailByUid(uid)`).
2. It reads `sentEmail.senderEmail` (the exact address that sent the email).
3. Email alerts (`🔔 FIRST OPEN`, `👀 REOPENED`, `🔥 HOT PROSPECT SPIKE`, `⚡ EMAIL REVIVED`, `🔗 LINK CLICKED`, and `⏰ FOLLOW-UP REMINDER`) are delivered directly to **`sentEmail.senderEmail`** (and to your `ntfy` push topic if configured).
4. If an older or ad-hoc pixel has no `senderEmail` attached, alerts fall back to `RETINA_ALERT_EMAIL` / `richard@mckellar.dev`.

---

### E. How Recipient Email Addresses & Self-Opens Are Handled
- **Single or Multiple Recipients**:
  - In **Create Track** or **Quick Compose**, you enter the recipient's email (and optional name).
  - In **Outlook**, if an email is addressed to multiple `To:` recipients, the add-in joins all recipient addresses (`alice@client.com, bob@client.com`) on the tracking record.
- **Automatic Self-Open Protection (3 Layers)**:
  1. **Sender IP Matching**: When an email is registered as sent, Inbox Retina records `senderIp`. If the tracking pixel is loaded from the same `senderIp`, it serves the 1×1 GIF silently without logging a false open.
  2. **60-Second Compose/Sent Preview Window**: Any pixel load occurring within `60 seconds` of the email being registered as sent is ignored (prevents Gmail/Outlook compose and Sent-folder rendering from counting as an open).
  3. **5-Minute Same-IP Deduplication & Gmail Proxy Handling**: Repeated pixel loads from the same IP within 5 minutes are deduplicated so a single read doesn't inflate open counts.

---

## 2. How to Work Inbox Retina (Tab-by-Tab Guide)

### Tab 1: Activity Feed (`⚡ Activity Feed`)
- **What it does**: Live chronological stream of every event across your connected email addresses (`Sent`, `First Open`, `Reopened`, `Hot Prospect Spike`, `Revived`, `Link Click`).
- **Live Polling, Toasts & Audio**:
  - Toggle **Live Updates** in the header to poll every 15 seconds.
  - When a new open or click arrives while the tab is open, a **Retina Toast** slides in at the bottom-right and plays a Web Audio crystal chime (toggleable via the speaker icon in the header).
- **Filter**: Filter the stream by `All Activity`, `Opens Only`, `Link Clicks`, `Hot Spikes`, or `Sent`.

### Tab 2: Quick Compose (`✉️ Quick Compose`)
- **What it does**: Send a tracked email directly from the browser without opening Outlook or Gmail.
- **How to use**:
  1. Select which of your connected email addresses you want as the sender/reply-to in the top header dropdown.
  2. Enter the `To:` recipient email, `Subject`, and `Message`.
  3. Any `https://...` URLs in your message are **automatically wrapped** into tracked redirect links (`/l.php?uid=...&url=...`), and the 1×1 tracking pixel is appended automatically.

### Tab 3: Create Track (`🎯 Create Track`)
- **What it does**: Generates a 1×1 tracking pixel for a single high-priority email when you want to paste the pixel manually into any email client.
- **How to use**:
  1. Enter the **Recipient Email**, optional **Recipient Name**, and **Subject Line**.
  2. *(Optional)* Select a **Follow-Up Reminder** (`24h`, `48h`, `72h`, or `168h`). If the recipient has not opened the email by that deadline, Inbox Retina automatically sends you a `⏰ FOLLOW-UP REMINDER` alert (and auto-cancels the reminder the moment they open it).
  3. Click **Generate Tracking Pixel**. This immediately registers the email as Sent (`✓`) in your Track Sheet.
  4. Click **Copy Rich HTML (For Gmail / Outlook)** and paste (`Ctrl+V` / `Cmd+V`) at the bottom of your email body before sending.

### Tab 4: Track Sheet (`✓✓ Track Sheet`)
- **What it does**: Your master Mailtrack-style table of every tracked email and its full open/click history.
- **Reading the Badges**:
  - `✓` **(Grey single check)**: Email sent and registered, not yet opened.
  - `✓✓` **(Green double check)**: Email opened (`1x`, `2x`, etc.).
  - `✓✓ 🔥` **(Orange/Red badge)**: Hot prospect spike (`3+` opens).
  - `🔗` **(Purple link badge)**: Recipient clicked a link inside the email.
  - `⏰` **(Amber clock badge)**: Pending unopened follow-up rule is active.
- **Inspecting Telemetry**:
  - Click **View History** on any row to expand the full list of individual opens and link clicks (with timestamp, city/region/country, device, OS, browser/email client, and IP).
  - Click any individual open or click event to open the **Event Intelligence Modal** with full forensic metadata.
- **Search, Filter & Export**:
  - Filter by `All`, `Opened`, `Unopened`, `Clicked`, `Hot (3+ Opens)`, or `Signature Opens`.
  - Click **Export CSV** to download your current filtered view as a spreadsheet.

### Tab 5: Analytics (`📊 Analytics`)
- **What it does**: Aggregates your tracking data into actionable sales intelligence:
  - **Overall Open Rate, Click-Through Rate, and Average Time-to-First-Open**
  - **Response Velocity Distribution** (`< 5 min`, `5–30 min`, `30–60 min`, `1–6 hrs`, `6–24 hrs`, `> 24 hrs`)
  - **24-Hour Best-Time-to-Send Heatmap**
  - **Device Split** (Desktop vs. Mobile/iPhone vs. Tablet)
  - **Top Email Clients & Operating Systems** (Gmail Image Proxy, Microsoft Outlook, Apple Mail, iOS, Windows, macOS)

### Tab 6: Signature & Gmail (`🔖 Signature & Gmail`)
Contains two zero-friction tools for Gmail and webmail users:
1. **Gmail 1-Click Smart Bookmarklet**:
   - Drag the **`🎯 Track with Retina`** button to your browser's Bookmarks Bar.
   - When composing an email in Gmail, click the bookmarklet once before hitting Send: it automatically reads the `To:` recipient and `Subject` from the Gmail DOM, wraps links inside your draft, injects the invisible tracking pixel, and registers the email under your active `senderEmail`.
2. **Signature Ghost Pixel**:
   - Generates a permanent invisible pixel you can paste once into your Gmail/Outlook signature.
   - Passive opens from your signature are tagged `src=signature` so they never spam your email/push alerts and can be filtered separately in the Track Sheet.

### Tab 7: Outlook Setup (`📬 Outlook Setup`)
- Step-by-step instructions to sideload `https://www.mckellar.dev/outlook/manifest.xml` (or `https://mycommercialfunding.com/outlook/manifest.xml`) into **Outlook on the Web**, **New Outlook for Windows**, and **Classic Outlook Desktop (Windows & Mac)**.
- Once installed:
  - **Every email you send from any mailbox in Outlook is tracked automatically** (`SendMode="SoftBlock"` launch event).
  - **Compose Taskpane (`Retina Tracker`)**: Lets you toggle tracking ON/OFF if you ever want to send an untracked message.
  - **Read Taskpane (`Retina Status`)**: Open any message in your **Sent Items** folder and click **Retina Status** to see live open count, click count, first/last open timestamps, and recent locations right inside Outlook.

### Tab 8: Clicks Report (`🔗 Clicks Report`)
- Aggregates every link clicked inside your tracked emails by destination URL, showing total clicks, unique recipients who clicked, last clicked timestamp, and a one-click CSV export.

---

## 3. Branded Short Links & QR Code Manager (`/links`)

Navigate to `/links` (or click **Short Links & QR** in the `/email-logs` header) to manage branded short links:
1. **Create a Short Link**:
   - Enter a **Slug** (e.g., `deck` -> `https://mckellar.dev/l/deck`), a **Destination URL**, and a friendly **Link Name**.
2. **Download QR Code**:
   - Every short link automatically generates a high-contrast QR code that you can preview or download as a PNG for pitch decks, business cards, or print collateral.
3. **Click Telemetry**:
   - Every visit to `/l/:slug` logs timestamp, IP address, geolocation (city, region, country), device, OS, browser, and HTTP referrer.

---

## 4. Migrating / Backfilling Legacy Emails

If you ever have historical sent or feed records that were created before multi-email indexing was enabled, you can run the built-in migration endpoint (`POST /api/retina/migrate` with header `x-retina-password: <master_password>`), which scans `retina:sent` and `retina:feed` and backfills per-sender lists (`retina:sent:<senderEmail>` and `retina:feed:<senderEmail>`).
