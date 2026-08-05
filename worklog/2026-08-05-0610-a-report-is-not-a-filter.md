# Worklog: a report is not a filter

Date: 2026-08-05T06:10:48Z (generated filename)
Thread: the six non-English books

## The gap in last turn's fix

I found six German and Latin books in the corpus and made
`corpus-integrity` report them. That runs **after the download**.

**A check that runs after the bytes have moved is a report. A check that runs
before is a filter.** The next want-list would have brought more.

## The signal was available at selection

| | |
| --- | --- |
| IA's `language` field | says `eng` for all six — useless |
| the **title** | *"für Geschichte und Literärgeschichte"*, *"Zeitschrift"*, *"Johannis Freind medicinae doctoris"* |

Tested against **all 120 candidates** of the third list: **6 of 6 caught, 0 false
positives**, 114 clean.

## The rule, and why Latin needs two markers

German: any one function word — *für, und, der, zeitschrift, geschichte*.

Latin: **two or more** markers. A single-marker rule would flag *"A brief sketch
of the Historical Club of the Department of Medicine"* on **de** and **ad**
alone. Verified on five known titles, 5/5 — both foreign ones caught, and three
English titles with similar vocabulary correctly passed.

## Where the exclusion is recorded

In the want-list itself, under `non_english_excluded`, with the identifier,
title and which language it looks like. **A dropped item with its reason beats a
smaller number** — that is the same lesson as the Gutenberg-mirror rule, which
once recorded only a count.

## What I did not do

The six already in the corpus stay. Removing books is not this filter's job, and
`corpus-integrity` still reports them for whoever decides.

Verify exit 0. Suites 3 pass, 0 fail.
