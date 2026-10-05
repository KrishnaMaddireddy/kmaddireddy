---
title: Let AI Answer Data Questions — Without Ever Showing It Your Database
description: A two-path architecture for natural-language analytics, in a world where the schema is the secret and wrong numbers don't crash, they get put in slides.
date: 2026-08-25
tags: [semantic-layer, llm, data-platforms, askeider]
originalUrl: https://www.linkedin.com/pulse/let-ai-answer-data-questions-without-ever-showing-your-maddireddy-tij2c/
---

**TL;DR** — Everyone wants to ask their company data questions in plain English. Three things make this hard: you have too many datasets to prepare by hand, your database structure is itself confidential, and wrong answers don't crash — they look right and end up in a board deck. The design that works uses two paths. Path one: an outside AI picks from a menu of business terms, and trusted code turns that into SQL. Path two: an AI running inside your own network writes SQL for everything else, and a safety checker inspects every query before it runs. The outside AI never sees your database. The inside AI never runs unchecked.

## Three problems, not one

Asking data questions in plain English sounds simple. Three things make it hard in a real company.

**1. Too much data to prepare by hand.** Hundreds of datasets, owned by different teams. If every dataset needs weeks of setup before people can ask about it, you'll finish a dozen and give up.

**2. Your schema is a secret.** Table and column names describe your business: what you measure, what you track, how things connect. Sending that to an outside AI company is already a leak — even before any actual data moves. In banking or healthcare, this alone kills most AI-writes-SQL tools.

**3. Wrong answers look right.** Here's the scary one. Join three perfectly good tables and sum a number that lives at the wrong level — the database happily double-counts your revenue. No error. No warning. Just a bigger number that looks plausible — and ends up in a slide. AI-written SQL usually runs. That's exactly the problem.

So the real question isn't "can AI write SQL?" It's: **who should write the SQL, and who checks it?**

I built a working system end to end to pressure-test this — sample data, both paths, an adversarial test suite. Here's the design that survived.

## The design: two paths

**Path 1 — the governed path, for numbers that must be right.**

The outside AI never writes SQL. It only fills in a form: which metrics (from a fixed menu), which breakdowns (from a fixed menu), which filters. It sees business words like "net revenue" and "region" — never table names, never column names. Trusted code takes the filled-in form and builds the SQL, using rules that make double-counting impossible.

Think of it like ordering at a restaurant. The customer picks from the menu. They don't walk into the kitchen.

**Path 2 — the exploratory path, for everything else.**

A second AI runs inside your own network, on your own machines. Because nothing leaves the building, this one is allowed to see everything: real table names, how tables connect, example values. It writes SQL directly.

But nothing it writes runs unchecked. A safety checker — plain deterministic code, not another AI — reads every query first and enforces the rules: read-only, only approved tables, joins must follow the approved connections, and the big one: **no summing numbers across a join that duplicates rows.** If the query breaks a rule, it's rejected with the reason, and the AI rewrites it.

| Path | Used for | Flow | What the AI sees |
| --- | --- | --- | --- |
| Governed | Official numbers | question → outside AI → menu choices → trusted code builds SQL → database | Business words only |
| Exploratory | Everything else | question → inside AI → writes SQL → safety checker → read-only database | Everything; nothing leaves |

## The idea that makes it scale

Preparing a dataset for Path 1 takes real work — someone has to define every metric. Fine for your 30 official KPIs. Impossible for dataset number 400.

Here's the unlock: the valuable part was never the code that builds SQL. It's the **knowledge behind it** — which table holds what, one row per customer or one row per order, which numbers are safe to add up, which joins are legal.

That knowledge can be used two ways. Code can use it to **build** correct SQL — but only for what you've fully prepared. Or code can use it to **check** any SQL — including SQL an AI wrote for a dataset you never prepared.

Checking scales. Adding dataset 400 stops meaning "write new code" and starts meaning "fill in a short registration": table names, what one row means, how tables connect, which columns are safe to sum. The safety checker protects it from day one.

It's like a spell-checker. It doesn't write your document, and it can't promise your document is *good* — but it catches a whole class of mistakes in everything anyone writes, forever, for free.

## What the checker catches — and what it can't

It reliably kills the worst failures: queries that modify data, queries that touch tables they shouldn't, and the silent double-counting problem. When it rejects a query, it explains why — and the AI's next draft is usually right.

But a checker is not a guarantee. A query can pass every rule and still answer the wrong question — wrong date column, wrong status filter. That's exactly why Path 1 exists: numbers going to the board come from the path where correctness is built in, not inspected afterward.

## The two paths feed each other

When people keep asking the same "unofficial" question week after week on Path 2, that's your signal: promote it. Define it properly, add it to the menu, and it becomes an official, governed metric. The exploratory path isn't just a fallback — it's how you discover what deserves to be governed next.

## Six lessons from building this

**1. The hard problem isn't SQL — it's row duplication.** Know what one row means in every table, and which numbers are safe to add. Write it down where code can read it. Never let the AI guess it.

**2. The same word means different things in different departments.** "Revenue" might be booked revenue in finance and pipeline in sales. Name metrics by department ("finance.revenue") or the answers will quietly disagree.

**3. Keep one source of truth.** We once had two copies of the same field list drift apart — queries built from the stale copy silently returned zero rows. Generate everything from one file. Don't rely on discipline.

**4. Don't stuff everything into one giant prompt.** Route the question first, then load only what's needed. A huge prompt gets expensive and confusing at exactly the moment you need it most.

**5. Check the user's question too, not just your own prompt.** People paste table and column names into their questions all the time. If your privacy check only scans what *you* built, the user's question just carried the secret out the door.

**6. Measure your claims.** "The AI usually fixes its query in one retry" is a guess until you count it. Model sizes and capabilities change every few months — date every claim.

## The whole thing in three sentences

Let the outside AI handle language, and give it so little that a leak is meaningless. Let the inside AI handle SQL, and give it everything, because inside your network "everything" is free. Let plain code do what code does best: **build the queries that must be right, and check the queries that must be safe.**

*How does your team handle this — the schema-privacy problem, the long tail of unprepared datasets, or the silently-wrong-number problem? I'd like to compare notes.*
