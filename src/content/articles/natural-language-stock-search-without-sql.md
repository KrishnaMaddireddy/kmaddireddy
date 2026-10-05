---
title: Building Natural Language Stock Search Without Model-Generated SQL
description: How PaakData turns plain-English stock questions into checked database queries, with a model that never writes SQL.
date: 2026-09-15
tags: [paakdata, llm, search, postgres]
cover: /images/articles/stock-search-cover.png
coverAlt: "Diagram: how a sentence becomes a database query. Router, parser (the one model call), JSON spec, repair and validate, SQL builder, Postgres, explain line."
originalUrl: https://www.linkedin.com/pulse/building-natural-language-stock-search-without-sql-krishna-maddireddy-qalbc/
---

The most troubling failure in a stock screener is a plausible list of stocks that quietly ignores part of the request.

That risk shaped how we built PaakData’s natural-language search, UQ. A language model interprets the question. Application code validates the interpretation and builds the database query. The model never writes SQL.

Consider this request:

*Profitable semiconductor stocks with rising short interest, ranked by one-month return.*

Our parser turns it into a small JSON filter specification: semiconductor theme, positive net margin, positive short-interest change, and a descending sort on one-month return.

That intermediate step gives us something we can inspect, validate, repair, and test before touching the database. Five decisions made it practical.

## 1. Give the model a bounded job

Direct text-to-SQL introduces several risks: invented columns, unpredictable query plans, and conditions that disappear during translation.

We limit the model to a fixed vocabulary of fields, supported operators, values, a sort order, and a short explanation of what it understood. We use temperature zero to reduce variation, but correctness comes from the checks that follow.

A deterministic builder maps the validated specification to SQL. It selects columns, joins, operators, and sort directions from an allowlist, then binds values as parameters. Model-supplied values are treated as data, not executable SQL.

The uncached search path is straightforward:

*Question → model interpretation → repair and validation → SQL builder → database → results and explanation.*

The same parser, builder, and field map serve our apps, public search, dashboards, and tools used by other agents. A fix in that shared pipeline reaches every interface that uses it.

## 2. Treat the field vocabulary as a product interface

The field map defines what users can search and what each concept means in our data.

Some entries point to database columns. Others represent derived expressions, such as a stock’s percentage distance from its 50-day moving average. Aliases let several names refer to the same underlying measure.

When a model repeatedly uses a different name for the same concept, a tested alias can be more useful than another prompt instruction. The important condition is that the alias preserves meaning. Substituting a different time window is a separate decision and needs to be disclosed.

The map also controls which data sources a query needs. A short-interest filter activates the relevant join; a query that does not use that source can avoid it.

Adding a field therefore involves more than teaching the model a new word. We update its definition, query support, output handling, parser instructions, tests, and documentation together.

## 3. Show what changed during interpretation

Each response includes an explanation. The model writes the initial version; application code appends notices when validation removes a field or a repair substitutes a supported window or proxy.

If borrow fees are unavailable, the response says:

*Borrow fee is not tracked, so that condition was skipped. Results reflect only the remaining criteria.*

If every condition is identified as unsupported, the system returns guidance instead of running an unrestricted screen.

There is a limit here that deserves plain language: validation can identify an unsupported condition present in the specification. It cannot automatically detect every condition the model never emitted.

Targeted checks against the original sentence catch some omissions. For example, a named ticker list can be restored when the model leaves it out. Regression tests cover known failures, but other omissions can still occur.

The explanation is therefore an interpretation with recorded corrections, not independent proof that every part of the request was understood. Appending a warning also does not, by itself, verify every sentence the model originally wrote.

## 4. Repair known failures and cache carefully

Some parsing failures recur. Rather than keep adding instructions to the prompt, we handle known patterns in code.

The repair layer fixes misplaced structures, converts range objects into supported filters, and maps operator spellings carefully: “above” means greater than; “at least” includes the boundary. Repairs that change the requested meaning add a notice to the explanation.

One caching incident made this discipline concrete. A parse dropped two conditions, then entered the cache. Retrying the same sentence replayed the same degraded interpretation.

We changed the parser cache so interpretations with detected dropped conditions are used once and discarded. A later request gets a fresh attempt. That rule addresses detected degradation; it cannot catch an omission the system has not recognized.

There are three different kinds of caching in this system, and they have different consequences:

- **Prompt caching** reuses the model’s stable instructions and examples. The user’s sentence remains the changing part of the request.
- **Interpretation caching** reuses a filter specification. It still goes through validation, query construction, and execution against the database’s current contents.
- **Result caching** reuses previously returned rows. In the Lite app, stored results can be retained for up to seven days, so a repeat search there may return an earlier snapshot.

That last distinction matters in a market-data product. A cached interpretation and a cached result make different freshness promises.

Prompt caching can reduce repeated input costs when the prefix is reused successfully. It is not exclusive to our architecture: a SQL-generating system can also cache stable instructions and schema context. Our fixed vocabulary makes the stable portion easier to maintain. Both OpenAI and Anthropic document this use of reusable prompt prefixes.

## 5. Make each fix prove itself

We keep regression cases built from real requests, with assertions about the interpretation they should produce.

A request to beat the S&P in each of two years must preserve both conditions. A request for a score of at least 11 on a 0-to-10 scale should explain that the criterion cannot match.

Some cases execute the generated SQL with `LIMIT 1`. That is an execution smoke test: it catches broken queries, but does not establish complete result correctness or production performance.

For each bug fix, the new regression test must fail on the affected build and pass after the fix. This helps us distinguish a real correction from a change that merely looks plausible in review.

## The database bug that made the lesson concrete

One search kept timing out: “breakaway gap up that has not filled.” The equivalent hand-written query ran in about two seconds.

We reconstructed the exact SQL emitted by the builder and inspected its execution plan. Text comparisons were wrapped in a normalization expression so variants such as “Health Care” and “healthcare” would match.

We had no statistics for that expression. The planner estimated one matching row, while the query matched 181. It chose a nested-loop plan that repeatedly executed an expensive join, and the request hit its timeout.

For columns already storing normalized tokens, we changed the builder to compare the column directly and normalize the input value in JavaScript. That let the planner use the column statistics again and changed the join strategy.

The practical lesson was to inspect what the application actually sends to the database. In this incident, the query plan was the bottleneck. Looking only at the user’s sentence—or a simpler hand-written query—would have missed it.

## What I would carry into the next system

The most useful boundary was the one between interpretation and execution. It gave us a specification we could test, a query we could inspect, and a place to record the compromises made along the way.

That boundary does not eliminate mistakes. It makes many of them easier to detect and correct.

If you are building natural-language search over a real database, how do you detect a condition the model silently leaves out? That is the failure case I would most like to compare notes on.

*[PaakData](https://www.paakdata.com) is a quantitative stock-analytics platform.*

### Further reading

- [OpenAI prompt caching](https://openai.com/index/api-prompt-caching/)
- [Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
