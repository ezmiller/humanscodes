---
layout: post
title: "Relaunching tablecloth.time: Composability Over Abstraction"
author: Ethan Miller
date: 2026-03-16
categories: clojure data-science
tags: [clojure, data-science, time-series, tablecloth, scicloj]
---

I recently relaunched the tablecloth.time project. The goal of this project, which remains in an experimental phase, is to explore a composable extension of the popular tablecloth data processing library that aids temporal analysis of tabular data. This project started its life several years ago with the SciCloj community. At that time, we thought that the project should be built around a mechanism of setting a temporal index structure on a dataset and then building index-aware functions that could operate over the data efficiently using that index. This was a design philosophy that mimicked the index available in Python Pandas. At the time, the index seemed necessary both because it was a familiar and convenient tool, and it offered what seemed like necessary optimizations when doing operations that involved subsetting the dataset where using a tree structure offered O(log(n)) optimization. However, ultimately...

<!-- NOTES: Continue from here. Sections to cover:
  1. What happened: index removal from tech.ml.dataset, the Zulip discussion
  2. The design pivot: composability over abstraction, binary search vs tree structures
  3. What it looks like in practice: code examples (add-time-columns, slice, add-lags, resampling)
  4. Charts: Victorian electricity demand example
  5. What's next
-->
