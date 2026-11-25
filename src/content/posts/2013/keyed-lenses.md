---
title: Keyed Lenses
pubDatetime: 2013-09-05T14:56:00.000+10:00
tags:
  - fp
  - programming
  - scala
  - scalaz
description: Introducing KeyedLens in Scala and Scalaz—a composable lens variant that requires a key to focus into maps or indexed collections, propagating keys cleanly through composition.
---

_**TL;DR:** Lenses are cool. I've come up with keyed lenses which I find helpful. Hopefully you will too. Do you? Have I just reinvented the wheel in ignorance?_

Annual blog post time. So this year I've been imploding and exploding with enthusiasm over functional programming. Already I've found some FP perspectives and strategies mind-boggle-blow-blast-ingly effective, and beautiful. My day project is in a significantly better state owing to FP. If you're not onboard I recommend reading [Learn You a Haskell for Great Good!](http://learnyouahaskell.com/chapters) and [Functional Programming in Scala](http://www.manning.com/bjarnason/).

_(Btw: big thanks to NICTA, specifically [Tony Morris](https://twitter.com/dibblego) & [Mark Hibberd](https://twitter.com/markhibberd) who held 2 free FP courses and gracefully tolerated numerous dumb-shit moments from me. I think it's a semi-annual recurring thing so keep an eye out on [scala-functional](https://groups.google.com/forum/#!forum/scala-functional) for the next one if you're interested and in Australia.)_

**What is a lens?** If you don't know what a lens is, it's basically a decoupled getter/setter that be composed with other lenses, so that the depth and structure of data can be hidden. In traditional OO you might not see the merits but when your data structures are all immutable, the benefit is immense. There are plenty of good resources online to learn more, such as [this](http://www.parleys.com/play/51c387cae4b0ed8770356869/), [this](http://www.monadzoo.com/blog/2012/11/18/using-lenses-with-scalaz-7/) and [this](https://blog.stackmob.com/2012/02/an-introduction-to-lenses-in-scalaz/).

## KeyedLenses

What I'm calling a KeyedLens, is a lens that points to a value in a composite value such that a key is required. A Map is an obvious example.

_(NOTE: Scalaz has some basic support for this -- I am aware of it -- but I find that it doesn't my needs and/or the way I try to use it. I find that the call-site syntax becomes long and nasty, it doesn't compose well, and it creates new lenses every time it's used which is inefficient)._

Let's start with some toy data.<br />
I'm going to use Scala and the awesome [Scalaz](https://github.com/scalaz/scalaz) library, and there's a link to the KeyedLens source code at the end of the post. (If you don't know Scala, just imagine it's pseudo-code. The concepts translate into almost anything.)

Let's model a band from a guitarist's point of view.

```scala file="BandData.scala"
case class Person(name: String)

case class Guitar(strings: Int, tuning: String, gauges: List[Double])

case class Band(name: String,
                members: Map[Person, Guitar],
                otherPeopleWhoSupportTheGuitarists: Set[Person]) // Just ask Yngwie

// Sample data

val acle = Person("Acle")
val james = Person("James")

val gauge6 = List(0.010, 0.013, 0.017, 0.026, 0.036, 0.046)
val gauge7 = List(0.011, 0.014, 0.018, 0.028, 0.038, 0.049, 0.059)

val band = Band("Tesseract"
             , Map(  acle -> Guitar(7, "BEADGBE", gauge7),
                    james -> Guitar(6, "EADGBE", gauge6))
             , Set(Person("Jay"), Person("Amos"), Person("Ashe")))
```

Here we're modelling the [mighty band Tesseract](http://www.youtube.com/watch?v=pPBTtsgIWNM) (think Pink Floyd + Meshuggah).<br />
There are two places where I'm going to use a keyed lens.

1. To access the guitar of a given band member. _(guitarL)_
2. To access the string gauge of a given guitar. _(stringGaugeL)_

Here are the lens definitions:

```scala file="BandLenses.scala"
val bandNameL = lensg[Band, String](b => n => b.copy(name = n), _.name)

val guitarTuningL = lensg[Guitar, String](g => t => g.copy(tuning = t), _.tuning)

// KeyedLens #1: Here Person is a key.
val guitarL = KeyedLens[Band, Person, Guitar](
    b => p => newValue => b.copy(members = b.members + (p -> newValue)),
    b => p => b.members(p))

// KeyedLens #2: Here Int is the key.
val stringGaugeL = KeyedLens[Guitar, Int, Double](
    g => s => newValue => g.copy(gauges = g.gauges.updated(s-1, newValue)),
    g => s => g.gauges(s-1))

// Compose a keyed and non-keyed lens
val guitaristsTuningL = guitarL >@=> guitarTuningL

// Compose 2 keyed lenses
val guitaristsGaugeL = guitarL >@=@> stringGaugeL
```

This gives us the following lenses:

| LENS              | TYPE                                                    |
| ----------------- | ------------------------------------------------------- |
| guitarTuningL     | `LensFamily[Guitar, Guitar, String, String]`            |
| stringGaugeL      | `LensFamily[(Guitar,Int), Guitar, Double, Double]`      |
| bandNameL         | `LensFamily[Band, Band, String, String]`                |
| guitarL           | `LensFamily[(Band,Person), Band, Guitar, Guitar]`       |
| guitaristsTuningL | `LensFamily[(Band,Person), Band, String, String]`       |
| guitaristsGaugeL  | `LensFamily[(Band,(Person,Int)), Band, Double, Double]` |

Notice the keys always get propagated to the left.<br />
Now let's see them in action. This is what appeals to me the most.

## Usage. The Fun Part.

**Get with one key.** _What is Acle's guitar tuned to?_

```scala
scala> guitaristsTuningL.get(band, acle)
res0: String = BEADGBE
```

**Get with two keys.** _What is the gauge of Acle's 7th string?_

```scala
scala> guitaristsGaugeL.get(band, (acle, 7))
res1: Double = 0.059
```

**Set with one key.** _I want to change Acle's tuning._

```scala
scala> guitaristsTuningL.set((band, acle), "G#FA#D#FA#D#")

res2: Band = Band(Tesseract,Map(Person(Acle) -> Guitar(7,G#FA#D#FA#D#,List(0.011, 0.014, 0.018, 0.028, 0.038, 0.049, 0.059)), Person(James) -> Guitar(6,EADGBE,List(0.01, 0.013, 0.017, 0.026, 0.036, 0.046))),Set(Person(Jay), Person(Amos), Person(Ashe)))
```

**Set with two keys.** _I want to lower the gauge of Acle's 7th string._

```scala
scala> guitaristsGaugeL.set((band, (acle, 7)), 0.0666666)

res3: Band = Band(Tesseract,Map(Person(Acle) -> Guitar(7,BEADGBE,List(0.011, 0.014, 0.018, 0.028, 0.038, 0.049, 0.0666666)), Person(James) -> Guitar(6,EADGBE,List(0.01, 0.013, 0.017, 0.026, 0.036, 0.046))),Set(Person(Jay), Person(Amos), Person(Ashe)))
```

_[If you're new to lenses, keep in mind that all the data here is immutable. Objects are copied and reused.]_

- I really like the brevity of these lines.
- I like that you get a single lens that _requires_ a key be provided.
- I don't like the `(A, (K1,K2))` type of `guitaristsGaugeL` which is easily changable into `(A, K1, K2)` but then what happens when it's further recomposed? I'd probably need methods like compose2, compose3, compose4, etc. Will think later.

What do you think? Does anything like this already exist?

**Source code** [for KeyedLenses.scala is here](https://gist.github.com/japgolly/6436598).

Thanks!
