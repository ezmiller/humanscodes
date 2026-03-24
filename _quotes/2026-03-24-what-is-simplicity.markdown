---
layout: quote
title: "What is Simplicity?"
source: "Dan Palmer, 'What is Simplicity?'"
source_url: https://danpalmer.me/2025-06-25-what-is-simplicity/
date: 2026-03-24
tags: [simplicity, software-design]
highlight: >
  These disagreements are notoriously hard to resolve because we lack
  the language to talk about our preferences when it comes to
  simplicity, and simplicity is not a single concept or direction, but
  a set of competing priorities and trade-offs.
---

We all want code (and systems) that are simple. Rich Hickey, the creator of Clojure, [distinguished simple from easy](https://www.infoq.com/presentations/Simple-Made-Easy/). The easiest thing is not necessarily the simplest. But the software engineer Dan Palmer takes this further, pointing out that there are multiple conceptions of simplicity, and they exist in tension with each other:

> But what is simplicity? Despite this near universal agreement that it's important, throughout my career I've seen numerous instances of friction in design and code review where both parties are convinced that their solution is the simpler option. These disagreements are notoriously hard to resolve because we lack the language to talk about our preferences when it comes to simplicity, and simplicity is not a single concept or direction, but a set of competing priorities and trade-offs.

Palmer names these concepts this way:

> - **Abstracted simplicity:** implementation details are wrapped up in abstractions such that when reading code, irrelevant parts can be skipped or understood in a summarised form.
> - **Flattened simplicity:** abstractions are avoided, in favour of flattening code paths such that when reading code, details are not hidden.
