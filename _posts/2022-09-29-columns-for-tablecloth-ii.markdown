---
layout: post
title: "Columns For Tablecloth, Update #2"
author: Ethan Miller
date:   2022-09-29
categories: clojure data-science
---

This post is the second regular update for my "Column for Tablecloth"
project, which has been generously funded by [Clojurists
Together](https://clojuriststogether.com). The goal of this project --
explained in more detail in my [first
update](/columns-for-tablecloth-i) -- is to give the `column` a
presence within the data processing library
[Tablecloth](https://github.com/scicloj/tablecloth). In other words,
by the end of the project, users of Tablecloth should be able to
interact exclusively with a `column` using functions that generally
take a column and return a column: `(column argx argy) => column`.

Over the past three months, I developed some conversation about the
project within the online Clojure and
[SciCloj](https://twitter.com/scicloj) communities and on a piece of
unexpected work: the datatype API for Tablecloth columns. These two
efforts haven't necessarily overlapped, but they've certainly been
mutually reinforcing. I'll start by discussing the work I've done on
datatypes.

## Checking Datatypes on the API

The work on datatypes came out of my [first
PR](https://github.com/scicloj/tablecloth/pull/71) for this project,
which established the new `tablecloth.column.api` namespace and added
a few key functions to get things rolling. One of the functions I
added was `typeof` -- inspired by R's function of the same name --
that returns the data type of the elements in the column. E.g.:

```
(typeof (column [1 2 3]))
;; => :int64
```

It turned out that the story about types in Tablecloth, unbeknownst to
me, was a bit more complicated. Unlike tech.ml.dataset, Tablecloth has
a type hierarchy ([defined in
tablecloth.api.utils](https://github.com/scicloj/tablecloth/blob/master/src/tablecloth/api/utils.clj#L56-L67)).
So how should `typeof` work with this hierarchy? Should `typeof`
return the child or "concrete" types? (e.g. `:int64`) or the "general"
type (e.g. `:integer`)?

After [some
discussion](https://github.com/scicloj/tablecloth/discussions/73) and
experimentation we settled on the following:

* `typeof` will return the concrete type; and
* `typeof?` can confirm the concrete or general type

So:

```
(def mycol (column [1 2 3]))

(typeof mycol)
;; => :int64

(typeof? mycol :int64)
;; => true

(typeof? mycol :boolean)
;; => false

(typeof? mycol :integer)
;; => true

(typeof? mycol :logical)
;; => false
```

That the focus is on the concrete type with an ability to check the
general type follows the tendency visible in both Python's Numpy and
in R. In both, checking the datatype will yield the concrete type.
Both also have type hierarchies. In Numpy, there's a somewhat clunky
function `issubdtype` that can be used to check the parent-child
relationship; in R, you can ask: `is.numerical` or `is.logical`, etc.

We accomplish something similar to R with just the `typeof` and
`typeof?` because we can ask about the concrete type with `(typeof?
col :int64)` and the general type with `(typeof? col :numerical)`. So
for now this is the type syntax we settled on. 

The most interesting design decision was whether or not to return
the concrete type or the general type when querying the type of the
column. It is true that this is the behavior of at least two of the
main data processing libraries. So we are in good company. In
conversation, Jon Antony (author of the visualization library
[Hanami](https://github.com/jsa-aerial/hanami), among other things)
gave this further reason for choosing the concrete type:

> FWIW, count me in for returning the concrete type as well. At root
> this stuff is (or should be) about performance and when I'm checking
> types in this context I always want the concrete type. Some extra
> 'higher level' stuff might be nice, but likely won't be used much.[^1]

I like this reasoning because it is based in a sense of what is useful
in practice. Another reason that occurred to me is that, if we ask for
the type and get back the general type, we are actually throwing away
information. The column elements' types have a concrete type that
provides more information about what they are and how they are stored
in memory. Why throw that away by default?

If the user wants to know the general type of the elements columns, we
will let them ask about that like so: 

```
(->general-types (typeof (column [1 2 3])))
;; => #{:integer :numerical}
```

That is where we've landed so far on the datatype API. Please if you
have any comments or questions, reach out and let me know what you
think.

## Discussions in the Community

Up until recently, I had not talked about this project publicly as
much as I had planned. In the last months, however, I made a conscious
effort to think together with others in the community about the
project. I have sought input in more public venues (some
experimental): in Github discussions
([here](https://github.com/scicloj/tablecloth/discussions/73)) newly
enabled on the Tablecloth repository, in Clojurians Slack
([here](https://clojurians.zulipchat.com/#narrow/stream/236259-tech.2Eml.2Edataset.2Edev/topic/tablecloth.20columns.20project)),
and in a short presentation in a session of the newly organized
"data-recur" SciCloj meeting
([here](https://www.youtube.com/watch?v=nTyPMxDlw0w&ab_channel=SciCloj)).

Some of these conversations related to the process of understanding
how we wanted to approach Tablecloth's datatype API (e.g.
[here](https://github.com/scicloj/tablecloth/discussions/73) and
[here](https://clojurians.zulipchat.com/#narrow/stream/236259-tech.2Eml.2Edataset.2Edev/topic/tablecloth.20columns.20project/near/298789513)).

A more thought-provoking line of conversation sprang up when I asked
[here](https://clojurians.zulipchat.com/#narrow/stream/151924-data-science/topic/use.20cases.20for.20a.20tablecloth.20column.3F)
if anyone could come up with a nice concrete real-world situation in
which the `column` API would be useful. This might seem like a strange
question given that I'm already working on this project, but the fact
is the basis for this project was always more logical than practical
-- at least in its framing.

Numpy and R both have array processing facilities. In Clojure, we have
some fast libraries for array processing as well: neanderthal and deep
diamond. But within the API provided by Tablecloth, built on the
"tech" stack (tech.ml.dataset and dtype-next), we have no entity on a
more granular level than the dataset. 

Mostly, this is okay. Most of the time, one works across a whole
dataset (or dataset of datasets). If one needs to do some array
processing, one can then turn to the alternative libraries just
mentioned. It's even possible to convert between neanderthal and
tech.ml.datset structures. However, the absence of some kind of
array-like primitive in Tablecloth is still felt. So the logical
reason for this project is to add that piece.

The public discussion around this question -- driven by the
characteristically probing questions of Carsten Behring --
recapitulated some of the thought process that led to this project in
a much more precise manner and, most importantly for me, adding a
dimension of *shared understanding*. It was hugely helpful to see
others in the community, who have more expertise and experience than I
do, expressing the rationale for the project in their own words.

I want share a lengthy quote from Jon Antony (@jsa), whom I've already
quoted in this post. He described how he thought the project made
sense on its own, despite the lack of a clearly compelling use-case:

> I also think this thing can be useful and a good thing, w/o an
> explicit use case for it 'out of the box'. Here's how/why I think
> this thing could be good and useful: Gather together the TMD.column
> and TV.datatype.functional column ops under a uniform TC.column api.
> These ops would always be column(s) -> column. Then also use this to
> implement a corresponding set of TC ops [dataset targetcol
> source-column(s)] -> ds. This would likely be a proper subset of
> those in the new TC.column. Now, you have the TMD.column and
> TVD.'column' stuff in nice uniform api for direct use on both
> columns and datasets.
>        
> The dataset versions will likely get the most use, but you will also
> be providing a unified version for straight columns. Now you have a
> nice public base on columns that users can try on various column use
> cases that may then also lead to explicit situations where such an
> api could be useful on its own. This could then lead to new ops in
> the api for more direct support in such situations. IOW, make this a
> bottom up instead of top down approach - in good ol' Lisp tradition. [^2]

I found this summary of the conversation helplful, and I will likely
return to it repeatedly. While I'd felt the absence of the `column` in
Tablecloth, it makes a lot of sense to me that by adding the `column`
API we are doing some building from the "bottom up". It may be that
the main use-cases that one might demo for the column API will
actually still be on the dataset level and take the form of, as Jon
put it, `[dataset targetcol source-column(s)] -> dataset`. 

In this case, the new column operations, even if they are used less,
will make this new set of column-oriented dataset operations feel
logical and natural. The user that has operated on the `column` within
the standard Tablecloth API for datasets won't blink any eye when and
if they need to drop down to the column level.

[^1]: Jon Antony (@jsa). Message posted to #tech.ml.dataset.dev
    channel, topic: "tablecloth columns project". *Clojurians Zulip*,
    15 September 2022.
    [https://clojurians.zulipchat.com/#narrow/stream/236259-tech.2Eml.2Edataset.2Edev/topic/tablecloth.20columns.20project](https://clojurians.zulipchat.com/#narrow/stream/236259-tech.2Eml.2Edataset.2Edev/topic/tablecloth.20columns.20project)

[^2]: Jon Antony (@jsa). Message posted to #datascience channel,
    topic: "use cases for tablecloth column?". *Clojurians Zulip*, 18
    Sept 2022.
    https://clojurians.zulipchat.com/#narrow/stream/151924-data-science/topic/use.20cases.20for.20a.20tablecloth.20column.3F/near/299606441
