# tablecloth.time Relaunch Post — Plan & Context

## Post Plan

### Audience
- Broader tech/data community (via humanscodes.com)
- Clojure data science / SciCloj community (will also post to Civitas blog)

### Tone
- Narrative + technical. Code examples and graphs included.
- Written in Ethan's voice: contextualizes within community, explains *why* before *what*, honest about open questions, credits collaborators by name.

### Structure
1. **Intro** — tablecloth.time is back. Goal: composable time-series extension of tablecloth. History: started years ago with SciCloj, originally built around Pandas-style indexing.
2. **The indexing problem** — Previous versions relied on indexing in tech.ml.dataset, which was removed in TMD v7. Why: Harold's observation that Pandas indexing code is as large as all of TMD. Deliberate simplification.
3. **The design pivot** — Composability over abstraction. Explicit column arguments instead of implicit indexes. Chris Nuernberger's insight: binary search on sorted data outperforms tree structures for datasets that are rebuilt wholesale.
4. **What it looks like in practice** — Code examples: `add-time-columns`, `slice`, `add-lags`. Resampling example showing how standard tablecloth operations compose with time primitives.
5. **Charts** — Victorian electricity demand example with visualization.
6. **What's next** — Active development, where to find it, how to contribute.

### Draft Status
- Intro partially drafted (branch `tablecloth-time-relaunch`, file `_drafts/tablecloth-time-relaunch.markdown`)
- Ethan providing notes section by section; Claude fills out in his voice

### Cross-posting
- Primary: humanscodes.com (Jekyll markdown post)
- Secondary: Civitas blog (Clay notebook at `src/scicloj/tablecloth_time/composability_over_abstraction.clj`)
- Civitas repo already cloned at `~/Projects/clojurecivitas.github.io`, branch `tablecloth-time-relaunch` created

---

## Project Context (from repo exploration)

### What is tablecloth.time?
A Clojure library for manipulating and processing time-series data. Complements and extends tablecloth's API for working with tech.ml.dataset's columnar datasets.

- **Repo:** github.com/scicloj/tablecloth.time
- **Local:** ~/Projects/tablecloth.time
- **Status:** Under active development, API may change
- **License:** MIT

### Design Philosophy
**Composability over high-level abstraction.** No metadata on the dataset indicating which column contains temporal data. Instead of `adjust-frequency` that implicitly operates on a designated time index, provides primitives like `add-time-columns` that derive temporal fields explicitly. Users compose these with standard tablecloth operations (`group-by`, `aggregate`, etc.).

### Key Design Decision: Dropping the Index
Previous versions built on an indexing mechanism in tech.ml.dataset that was removed in TMD v7.

**Why the index was removed:**
- Harold: "there is about as much code in Pandas doing indexing stuff as there is _all of the code in TMD_"
- Simplification: keep core library focused, extensions built outside

**What replaced it:**
- Chris Nuernberger: "Just sorting the dataset and using binary search will outperform most/all tree structures in this scenario"
- Rationale: datasets are rebuilt/reloaded wholesale, not incrementally modified. Sorting is faster than constructing trees. Binary search performs as well as tree search for queries and range queries.
- Harold validated: >1M rows/s performance with `java.util.Collections/binarySearch`

**Current approach:**
- Sort + binary search (not tree structures)
- Explicit column arguments (consistent with tablecloth's API)
- Sortedness checking with helpful error messages

### Current API
```clojure
(require '[tablecloth.api :as tc]
         '[tablecloth.time.api :as tct]
         '[tablecloth.time.column.api :as tct-col])

;; Add temporal fields to a dataset
(tct/add-time-columns :timestamp {:year "Year" :month "Month" :day-of-week "DayOfWeek"})

;; Slice a time range (uses binary search on sorted data)
(tct/slice :timestamp #time/date "2024-01-01" #time/date "2024-03-31")

;; Add lag columns for time series analysis
(tct/add-lags :price [1 2 3 4])

;; Column-level operations
(tct-col/year (my-dataset :timestamp))
(tct-col/floor-to-month (my-dataset :timestamp))
```

### Resampling Example (key for post)
```clojure
;; Resample half-hourly electricity data to daily averages
(def vic-elec (tc/dataset "data/fpp3/vic_elec.csv" {:key-fn keyword}))

(-> vic-elec
    (tct/add-time-columns :Time {:date-string "Day"})
    (tc/group-by ["Day"])
    (tc/mean :Demand))
```
Philosophy: `add-time-columns` extracts temporal components, standard tablecloth does the rest. No implicit index, no magic.

### Key People
- **Ethan Miller** — Original author, relaunching the project
- **Daniel Slutsky** — Coordinating tablecloth.time revival within SciCloj
- **Chris Nuernberger** — dtype-next author, provided performance guidance (binary search > trees)
- **Harold** — Real-world performance validation, Pandas indexing analysis
- **Tomasz Sulej** — tablecloth author

### Recent Activity (since relaunch ~early 2025)
- Rebuilt `slice` using binary search instead of tree-based index
- Added `add-time-columns` for explicit temporal field extraction
- Added `add-lags` / `add-leads` for time series analysis
- Column-level time operations (`tct-col/year`, `tct-col/floor-to-month`, etc.)
- Working through FPP3 (Forecasting: Principles and Practice) Chapter 2 as notebook examples
- Victorian electricity demand dataset as primary example data

### Zulip Discussion Summary
Full context in `doc/zulip-indexing-discussion-summary.md` in the tablecloth.time repo. Key topics:
- Binary search vs tree structures
- Categorical indexing patterns
- Pandas type inconsistencies (return type varies by number of matches)
- Multiple values search algorithm (Daniel Slutsky)
- Interval trees and BRIN indexes (deferred)

### Tech Stack
- Clojure
- tablecloth (data processing)
- tech.ml.dataset / dtype-next (columnar data engine)
- Clay (literate programming / notebook rendering)
- Tableplot (visualization)
