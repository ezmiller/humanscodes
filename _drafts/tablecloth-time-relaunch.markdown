---
layout: post
title: "Relaunching tablecloth.time: Composability Over Abstraction"
author: Ethan Miller
date: 2026-03-16
categories: clojure data-science
tags: [clojure, data-science, time-series, tablecloth, scicloj]
---

I recently relaunched the tablecloth.time project. The goal of this project, which remains in an experimental phase, is to explore a composable extension of the popular tablecloth data processing library that aids temporal analysis of tabular data. Relaunching this project required rethinking some of our intial ideas about how this project would work. While the project remains experimental, the new direction aligns with how tablecloth and tech.ml.dataset already work — explicit column arguments, composable operations, no metadata magic.

This project started its life several years ago with the SciCloj community. At that time, we thought that the project should be built around a mechanism of setting a temporal index structure on a dataset and then building index-aware functions that could operate over the data efficiently using that index. This was a design philosophy that mimicked the index available in Python Pandas. At the time, the index seemed necessary both because it was a familiar and convenient tool, and it offered what seemed like necessary optimizations when doing operations that involved subsetting the dataset where using a tree structure offered O(log(n)) optimization.

However, ultimately, neither turned out to be good rationales for an index. Unlike in Python, Clojure's datasets are immutable. They're recreated wholesale each time you transform them. Under these circumstances, the optimization offered by a tree-based index is moot: the cost of building the tree negates the benefit, and a simple binary search on sorted data performs equally well or better.

This insight emerged from a discussion on the Clojurians Zulip in late 2024, after the tech.ml.dataset library removed its indexing mechanism. Chris Nuernberger, the author of dtype-next and the tech.ml.dataset , put it plainly: "You only need tree structures if you are adding values ad-hoc or removing them — usually with datasets we aren't adding/removing rows but rebuilding the index all at once. Just sorting the dataset and using binary search will outperform most/all tree structures in this scenario." Harold, Chris's colleague, validated this with real-world benchmarks: binary search on a million-row dataset performed at over a million rows per second. The simplicity of not needing an index is not a compromise.

There was still, however, the question of whether the index was a useful abstraction for the user. An index allows the user to mark off certain data as the key pivot for analysis, while index-aware functions offer a degree of "magic" allowing the user to simply call a function like `slice` without needing to say what they intend to slice. So while the the question of optimziation could be answered in slightly clearer terms, the UX issues wrapped up with the index and its familiarity were harder to resolve. 

That said, within the Clojure data community there was a dectable preference -- also clearly represented in @generateme's design of tablecloth --  for an approach that offered less magic and greater transparency. This, of course, is a hallmark of Clojure itself where we prefer to solve complex problems by starting with small pure functions that simply modify immutable data. The beauty of the tech.ml.dataset's objects is that they can be treated the same way.

To be more concrete, instead of marking a column as "the time index" and building functions that implicitly operate on it, tablecloth.time provides explicit primitives that compose with standard tablecloth operations. You say which column you're working with. You see exactly what's being computed.

Consider resampling — a common time series operation where you aggregate data to a coarser time resolution. In pandas, you might write:

```python
df.resample('D').mean()
```

This is concise, but it relies on the DataFrame having a DateTimeIndex set. The index is implicit; the operation is magic.

In tablecloth.time, the same operation looks like this:

```clojure
(-> vic-elec
    (tct/add-time-columns :Time {:date "Date"})
    (tc/group-by [:Date])
    (tc/aggregate {:Demand #(dfn/mean (% :Demand))}))
```

More verbose? Yes. But each step is explicit: extract the date from the `:Time` column, group by it, aggregate. Standard tablecloth operations compose with time primitives. No special "time-aware" mode. No implicit state. This philosophy extends throughout the library. `slice` takes the column name explicitly. `add-lags` tells you exactly which column it's lagging and by how much. The result is code that reads like what it does — a property Clojure programmers tend to value.



<!-- NOTES: Continue from here. Sections to cover:
  1. What happened: index removal from tech.ml.dataset, the Zulip discussion
  2. The design pivot: composability over abstraction, binary search vs tree structures
  3. What it looks like in practice: code examples (add-time-columns, slice, add-lags, resampling)
  4. Charts: Victorian electricity demand example
  5. What's next
-->
