---
app: SpendQuery
title: "SpendQuery: ask U.S. government spending anything, in plain English"
description: "How SpendQuery turns USAspending.gov's public records into sourced answers, a chart and the SQL behind every number."
role: Founder and builder
---

The U.S. government publishes every federal contract, grant and loan on USAspending.gov: tens of millions of records a year. The data is public, but it’s hard to use. You need to know agency codes, NAICS and PSC codes, fiscal-year rules, and how subsidiaries roll up to parent companies.

SpendQuery turns that data into answers. Ask “Who are the top IT contractors at the VA?”, “What’s coming up for re-bid in Virginia?” or “Where do I bid in Simi Valley?” You get a sourced answer, a chart, and the SQL behind every number.

## How AI is used: carefully, where it helps

**Natural language to a query plan, not to raw SQL.** An LLM turns the question into a structured QueryPlan in business terms: metrics, filters, years. Deterministic code (a resolver, a dbt semantic layer, a SQL guard, a read-only runner with time limits) turns the plan into SQL. The model never touches the database. Every answer shows its SQL and caveats, such as “amounts are obligations, not outlays.”

**SpendQuery Chat.** An agent loop with typed tools: spending, open notices, companies, size standards, contract vehicles, grants, subcontractors, SBIR and the FAR. A figure check strips any number the tools didn’t return, so the chat can’t invent statistics.

**AI agents for contractors.** The pursuit desk has agents for the work of winning a contract:

- one finds opportunities;
- one weighs bid / no-bid;
- one suggests teaming partners;
- one watches amendments;
- one drafts responses.

Each runs as a multi-step workflow with saved steps. Each workflow has an evaluation gate built from labelled cases, so a prompt or model change can’t quietly make it worse.

**Evals as a habit.**

- A golden set of 500+ questions runs against the planner and reached 99.4% correct.
- The chat has its own rule-based eval: which lookups it used, which words a good answer must and must not contain, and time.
- Both run on a schedule and catch regressions before users do.

## Built for AI assistants, not just people

**MCP server.** SpendQuery is a remote Model Context Protocol connector: 20 read-only tools and 4 prompts (bid/no-bid memo, market research, sources-sought reply). It works in Claude, ChatGPT and any MCP client.

**MCP Apps widgets.** In Claude and ChatGPT, results show as interactive tables and charts, not raw JSON: open notices, company profiles, re-bids, spending charts. Ask for FY2026 spending across California’s 52 congressional districts and Claude draws the map.

**AI-friendly web.** The site publishes:

- llms.txt and llms-full.txt;
- JSON-LD (Dataset, FAQPage, BreadcrumbList) on data pages;
- CSV alternates;
- server-rendered summaries, so AI crawlers and answer engines get facts, not a JavaScript shell.

## SEO as engineering

- Thousands of server-rendered pages for states, counties, districts, agencies, industries, contract vehicles, FAR sections and top-contractor rankings, each built from live data.
- Sitemaps whose lastmod is the day a page’s content actually changed, plus IndexNow pings for new pages and a rule against thin pages: a page joins the sitemap only once it has real content.
- Performance work driven by crawl data: kept pages, warm-ups after deploys, and fast 404s, so Googlebot sees pages in under 2 seconds.

## Data platform

**Pipeline.** DuckDB plus dbt in a medallion architecture (bronze, silver, gold). It holds 40M+ federal transactions (FY2023–2026), refreshed daily, with reconciliation tests against USAspending.

**Beyond federal awards:**

- state, county and city checkbooks;
- SAM.gov notices;
- Grants.gov, SBIR, FEMA, earmarks and the FAR;
- a directory of 600+ state, county and city bid portals.

**Operations.** A job runner swaps a fresh warehouse copy in only when every check passes, deploys are automated, and a Playwright live check runs after every release.

## What I learned

- Let AI plan and let code execute.
- Make every number traceable.
- Treat evals like tests.
- Design for the AI assistants your users already work in, not just your own UI.

**Stack:** Python/FastAPI, DuckDB, dbt, Next.js, MCP (Python SDK + ext-apps), Claude, AWS, Cloudflare.
