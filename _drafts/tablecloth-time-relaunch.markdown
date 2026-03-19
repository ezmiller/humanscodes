---
layout: post
title: "Relaunching tablecloth.time: Composability Over Abstraction"
author: Ethan Miller
date: 2026-03-16
categories: clojure data-science
tags: [clojure, data-science, time-series, tablecloth, scicloj]
---

I recently relaunched the tablecloth.time project. The goal of this project, which remains in an experimental phase, is to explore a composable extension of the popular tablecloth data processing library that aids temporal analysis of tabular data. Relaunching this project required rethinking some of our intial ideas about how this project would work. While the project remains experimental, the new direction aligns with how tablecloth and tech.ml.dataset already work — explicit column arguments, composable operations, no metadata magic.

### Indexing and Optimization

This project started its life several years ago with the SciCloj community. At that time, we thought that the project should be built around a mechanism of setting a temporal index structure on a dataset and then building index-aware functions that could operate over the data efficiently using that index. This was a design philosophy that mimicked the index available in Python Pandas. In Pandas, you might set a time column as your DataFrame's index:

```python
df = df.set_index('Time')
```

Once set, operations like slicing and resampling work implicitly on that index:

```python
df['2024-01']              # all rows from January 2024
df.resample('D').mean()    # daily averages
```

The index is invisible but ever-present — you don't pass the time column to these functions; they just know.

At the time, the index seemed necessary both because it was a familiar and convenient tool, and it offered what seemed like necessary optimizations when doing operations that involved subsetting the dataset where using a tree structure offered O(log(n)) optimization.

However, ultimately, neither turned out to be good rationales for an index. Unlike in Python, Clojure's datasets are immutable. They're recreated wholesale each time you transform them. Under these circumstances, the optimization offered by a tree-based index is moot: the cost of building the tree negates the benefit, and a simple binary search on sorted data performs equally well or better.

This insight emerged from a discussion on the Clojurians Zulip in late 2024, after the tech.ml.dataset library removed its indexing mechanism. Chris Nuernberger, the author of dtype-next and the tech.ml.dataset , put it plainly: "You only need tree structures if you are adding values ad-hoc or removing them — usually with datasets we aren't adding/removing rows but rebuilding the index all at once. Just sorting the dataset and using binary search will outperform most/all tree structures in this scenario." Harold, Chris's colleague, validated this with real-world benchmarks: binary search on a million-row dataset performed at over a million rows per second. The simplicity of not needing an index is not a compromise.

### Indexing and UX

There was still, however, the question of whether the index was a useful abstraction for the user. An index allows the user to mark off certain data as the key pivot for analysis, while index-aware functions offer a degree of "magic" allowing the user to simply call a function like `slice` without needing to say what they intend to slice. In R's tsibble package, for example:

```r
vic_elec <- as_tsibble(data, index = Time)
vic_elec |> index_by(Date = as_date(Time)) |> summarise(Demand = mean(Demand))
```

The `index = Time` declaration ripples through everything — `index_by` knows what to group on, plotting functions know the x-axis, and interval detection happens automatically. It's elegant, which makes this approach desirable, but it's also implicit state threaded through your data. So while the the question of optimziation could be answered more definitively, the UX issues involved real choices.

### Favoring Clarity and Composability

That said, within the Clojure data community there was a detectable preference for an approach that offered less magic and greater transparency — clearly represented in @generateme's design of tablecloth's API. In tablecloth, you always say what you mean:

```clojure
(-> ds
    (tc/select-columns [:Time :Demand :Temperature])
    (tc/order-by [:Time])
    (tc/group-by [:Date]))
```

No hidden state, no implicit pivots. Each function takes the data and the columns it operates on. The pipeline reads like what it does. This, of course, is a hallmark of Clojure itself where we prefer to solve complex problems by starting with small pure functions that simply modify immutable data. The beauty of the tech.ml.dataset's objects is that they can be treated the same way.

In reviving tablecloth.time, I am following this pattern. While I might at some point decide there is a power to enabling a utility that marks a column as "the time index" and building functions that can use that information, for the moment tablecloth.time provides explicit primitives that compose with standard tablecloth operations. You say which column you're working with. You see exactly what's being computed.

Consider resampling — aggregating time series data to a coarser resolution. In Pandas:

```python
df.resample('D').mean()
```

This is one opaque line. 'D' is a frequency string meaning "daily" — one of dozens of such codes ('W' for weekly, 'M' for monthly, 'H' for hourly, and so on). The operation uses the implicit DateTimeIndex and automatically aggregates every numeric column. Convenient, but what exactly is happening?

tablecloth.time doesn't have a resample function. Instead, resampling is just a pattern — composable primitives that work with standard tablecloth:

```clojure
(-> ds
    (tct/add-time-columns :Time [:day])
    (tc/group-by [:day])
    (tc/aggregate {:Demand #(dfn/mean (% :Demand))}))
```

You choose what temporal component to extract. You specify the time index (`:Time`). You choose what to group by. You choose what to aggregate. Each step is visible, each step composes with the rest of your pipeline. The code reads like what it does — a property Clojure programmers tend to value.

At some point, this pattern could also be packaged, for convience, into a `resample` function that encapsulates this pattern. That would be magic to some degree, but this function would also just name the index: 

```clojure
(-> ds
    (tct/resample :Time :day) ;; returns group-ds 
    (tct/aggregate {:Demand #(dfn/mean (% :Demand))}))
```

Indeed, we could even in this development return to the question of whether it makes sense to mark an index within an expression — perhaps something like `(tct/with-time-index :Time)` that sets metadata for subsequent operations to read. That *would* be implicit state, but set visibly, in the expression that uses it.

The key distinction from Pandas: in tablecloth.time, the index would be pure convenience. The primitives always take explicit column arguments. You could use `with-time-index` if you want, but you could always drop down to:

```clojure
(tct/resample ds :Time :day)
```

The index would be optional sugar, not architecture. That's the difference.

<!-- NOTES: Continue from here. Sections to cover:
  1. What happened: index removal from tech.ml.dataset, the Zulip discussion
  2. The design pivot: composability over abstraction, binary search vs tree structures
  3. What it looks like in practice: code examples (add-time-columns, slice, add-lags, resampling)
  4. Charts: Victorian electricity demand example
  5. What's next
-->
