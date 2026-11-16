---
title: "CRM Architecture for MCA & Direct Funding Operations"
seoTitle: "CRM Architecture for MCA Operations | Richard McKellar"
description: "How Richard McKellar designs Salesforce and custom CRM pipelines for MCA funders and ISOs — from syndication tracking and renewals to automated deal routing."
date: "June 10, 2026"
dateModified: "November 16, 2026"
category: "funding"
readTime: "6 min read"
author: "Richard McKellar"
tags:
  - "Richard McKellar"
  - "CRM Architecture"
  - "MCA Operations"
  - "My Commercial Funding"
  - "ISO Channel"
keywords:
  - "MCA CRM setup buildout"
  - "Richard McKellar MCA CRM"
  - "commercial lending Salesforce HubSpot"
  - "ISO commission tracking CRM"
---

A commercial funding brokerage or direct lender needs more than access to capital. Once deal flow picks up across multiple ISOs, sales reps, and syndication partners, the CRM becomes the financial spine of the entire business. When companies try to stretch generic sales pipelines or disconnected spreadsheets to run Merchant Cash Advance (MCA) and revenue-based financing (RBF) operations, things fall apart quickly: deals get double-submitted, renewal windows get missed, commission splits turn into manual headaches, and underwriters spend half their day chasing missing documents.

Across 15+ years in alternative business lending—from helping lead platform growth at Whetstone Holdings (Everest Funding, Vader Funding, Granite Mountain Funding) with over $100M+ personally funded to directing revenue operations today as CRO of My Commercial Funding—I have seen that clean CRM architecture directly determines unit economics and team speed. You can read more about that background on my [profile page](/richard-mckellar) and [ventures overview](/ventures).

## Why Out-of-the-Box CRMs Break in Alternative Lending

Standard B2B SaaS CRMs assume a simple linear deal: Lead → Discovery → Proposal → Closed Won. Commercial funding does not work like that. Every funded file carries interconnected moving parts:

- **One merchant, multiple submissions and renewals:** Returning borrowers should trigger automatic early-payoff and reload tracking—never look like a cold new lead.
- **ISO & Partner Attribution:** Submissions arrive from dozens of external brokerages with varying tier splits, clawback windows, and protection rules.
- **Underwriting Stipulation Loops:** Deals pause waiting on updated bank statements, merchant verification interviews, landlord checks, or UCC lookups.
- **Syndication & Ledger Splits:** Direct funders have to track funded amount, factor rate, RTR (right to receive), holdbacks, and participant shares cleanly down to the dollar.

If those objects live outside your CRM, reps fly blind and back-office staff spend hours reconciling CSV exports every Friday afternoon.

## Core Data Model for a High-Velocity Lending CRM

When building out Salesforce, HubSpot, or a custom funding CRM, I organize objects around four practical realities so reps, underwriters, and finance teams operate off the same source of truth:

### 1. Parent Account vs. Submission Deal Objects
Separating the **Merchant Entity** (EIN, legal name, DBA, owners, SIC/NAICS) from individual **Funding Applications** lets you see complete funding history, prior balances, NSF flags, and renewal timing immediately without cluttering active underwriting stages.

### 2. Automated ISO Intake & Duplicate Protection
When a broker emails a deal packet or submits via portal, automated parsing should check normalized EIN, legal name, and phone numbers against active protection windows right away. Good [AI intake triage](/blog/workflow-audits) catches duplicates in seconds instead of letting two reps burn goodwill quoting the same merchant.

### 3. Underwriting Staging & Clear Stipulation Tracking
Underwriters move faster when missing stips are explicit structured checklist fields—not buried in free-text notes. Connecting underwriting stage changes back to rep notifications and broker status emails eliminates constant "any update on this file?" calls.

### 4. Commission, Renewal & Portfolio Triggers
The highest-margin volume for most funding shops comes from renewals and repeat relationships. Tracking funded pay-down percentage inside the CRM allows automated renewal alerts at clear milestones (such as 50% or 60% paid in) while keeping commission splits auditable from Day One.

## Layering AI Safely Onto a Clean System of Record

Teams often ask whether they need to rip out Salesforce or rebuild their CRM from scratch to use AI. The answer is almost always **no**. Once your core CRM objects and underwriting states are cleanly structured, deploying targeted [Fractional FDE](/fractional-fde) automations—such as bank statement ingestion, deal-summary generation, and automated ISO status updates—gives reps immediate leverage inside the exact screens they already work in. See how that looks in practice across our [operational case studies](/case-studies).
