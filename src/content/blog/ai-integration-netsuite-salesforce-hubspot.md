---
title: "Deploying AI Into Existing Systems: A Field Guide for NetSuite, Salesforce, and HubSpot"
description: "Richard McKellar explains how Fractional FDE deploys AI agents into NetSuite, Salesforce, HubSpot, and custom stacks — without migrations or rip-and-replace."
date: "July 29, 2026"
category: "ai"
readTime: "6 min read"
author: "Richard McKellar"
---

The biggest misconception in AI adoption is that you need to rip out your existing systems and start over. You don't. The highest-ROI AI deployments happen on top of the tools you already use — NetSuite, Salesforce, HubSpot, custom REST APIs, and everything in between.

Here's how a Fractional FDE actually integrates AI into production systems.

## The Principle: Build on What You Run

Every business has a tech stack that's messy, imperfect, and deeply embedded in daily operations. That's not a bug — it's the reality of running a business. The FDE approach accepts this and works with it:

- **No migrations.** We don't move you off NetSuite or Salesforce.
- **No rip-and-replace.** We don't replace your CRM with a "better" one.
- **No greenfield builds.** We integrate with what exists, using APIs, webhooks, and connectors.

The result: AI agents that run alongside your existing workflows, not instead of them.

## System-by-System Integration Patterns

### Salesforce

Salesforce is the most common CRM in mid-market companies, and it's also the most API-friendly for AI integration.

**What works:**
- **Lead triage agent** — parses inbound leads from web forms, email, and phone. Scores by fit, routes to the right rep, auto-creates Opportunity records.
- **Activity logging agent** — monitors email and calendar, auto-logs interactions, updates deal stages based on activity patterns.
- **Pipeline forecasting agent** — analyzes deal progression, flags at-risk opportunities, generates weekly pipeline reports.

**How it connects:** Salesforce REST API + Webhooks. Agents read/write directly to objects. No middleware needed for simple integrations; Node.js or Python services for complex logic.

### NetSuite

NetSuite is the backbone for funding shops, manufacturers, and distributors. It's more complex to integrate but extremely powerful once connected.

**What works:**
- **Invoice processing agent** — extracts data from incoming invoices, creates vendor bills, matches to POs.
- **Cash flow monitoring agent** — tracks daily positions, flags unusual patterns, alerts on covenant thresholds.
- **Reporting agent** — pulls financial data on schedule, generates executive summaries, distributes to stakeholders.

**How it connects:** NetSuite SuiteScript 2.0 for server-side automation, RESTlet endpoints for external API access, SuiteTalk SOAP for older integrations. Agents call these endpoints directly.

### HubSpot

HubSpot is the go-to for marketing-heavy businesses. Its API is clean and well-documented.

**What works:**
- **Contact enrichment agent** — enriches new contacts with company data, industry, and social profiles.
- **Content performance agent** — monitors blog/email/campaign performance, generates weekly insights.
- **Service ticket triage agent** — categorizes incoming support tickets, routes by priority and type.

**How it connects:** HubSpot REST API. Webhooks for real-time triggers. Simple to set up, fast to deploy.

### Custom Stacks

Many businesses run on custom-built systems with REST or GraphQL APIs. The integration pattern is the same: identify the API endpoints, understand the data model, and build agents that read/write through those endpoints.

**What works:**
- **Any workflow that involves data entry between systems** — agent reads from System A, processes, writes to System B.
- **Any workflow that involves monitoring** — agent watches for changes, triggers actions based on rules.
- **Any workflow that involves analysis** — agent pulls data, runs analysis, generates reports or alerts.

## The Deployment Pattern

Regardless of the system, the deployment follows the same phases:

1. **Shadow mode** — agents observe existing workflows, suggest actions, humans approve everything
2. **Supervised mode** — agents handle low-risk actions automatically, escalate high-risk ones
3. **Production mode** — full automation with guardrails, exception handling, and audit trails

This graduated approach means you never lose control. The agent earns autonomy through demonstrated reliability.

## Getting Started

The $999 AI Audit covers one workflow in one system. We pick your highest-impact integration opportunity, map it end-to-end, and deliver a deployment plan with clear success metrics.

[Book a scoping call](https://calendar.mckellar.dev/richard/30min) and let's find your first integration.
