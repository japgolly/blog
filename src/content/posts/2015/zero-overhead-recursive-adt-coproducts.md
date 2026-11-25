---
title: Zero-overhead Recursive ADT Coproducts
pubDatetime: 2015-02-23T19:18:00.000+11:00
tags:
  - performance
  - programming
  - scala
description: Modeling zero-overhead, sealed, recursive ADT coproducts in Scala using path-dependent types and trait composition, compared against inheritance hacks and Shapeless.
---

_Zero-product Recursive AMD what???_

Ok. Imagine this: you're building some app, and in certain parts users can type text with special tokens. (It's like in Twitter, when typing “`Hello @japgolly`” the “`@japgolly`” part gets special treatment.) You parse various types of tokens. You might have different locations to type text, and rules about which tokens are allowed in each location. You want the compiler to enforce those rules but you also want to handle tokens generically sometimes. How would you do such a thing in Scala?

## Initial Attempts

Ideally you'd define an ADT ([algebraic data type](http://en.wikipedia.org/wiki/Algebraic_data_type)) for all tokens possible, then create new types for each location that form a subset of tokens allowed. If that were possible, here's what that would look like.

```scala
sealed trait Token
case class  PlainText(t: String)  extends Token
case object NewLine               extends Token
case class  Link(url: String)     extends Token
case class  Quote(q: List[Token]) extends Token

// type BlogTitle   = PlainText | Link    | Quote[BlogTitle]

// type BlogComment = PlainText | NewLine | Quote[BlogComment]
```

Now Scala won't let us create our `BlogTitle` type like shown above. It doesn't have a syntax for [coproducts](http://en.wikipedia.org/wiki/Coproduct) (which is what `BlogTitle` and `BlogComment` would be, also called “disjoint unions” and “sum-types”) over existing types. Seeing as we have control over the definition of the generic tokens, we can be tricky and inverse the declarations like this:

```scala
sealed trait BlogTitle
sealed trait BlogComment

sealed trait Token
case class  PlainText(t: String) extends Token with BlogTitle with BlogComment
case object NewLine              extends Token                with BlogComment
case class  Link(url: String)    extends Token with BlogTitle
case class  Quote(q: List[????]) extends Token with BlogTitle with BlogComment
//                        ↑ hmmm...
```

...but as you can see, we hit a wall when we to `Quote`, which is recursive. We want a `Quote` in a `BlogTitle` to only contain `BlogTitle` tokens, not just any type of token. We can continue our poor hack as follows.

```scala
abstract class Quote[A <: Token] extends Token { val q: List[A] }
case class QuoteInBlogTitle  (q: List[BlogTitle])   extends Quote[BlogTitle]
case class QuoteInBlogComment(q: List[BlogComment]) extends Quote[BlogComment]
```

Not pleasant. And we're not really sharing types anymore. What else could we do?

We could create separate ADTs for `BlogTitle` and `BlogComment`, that would mirror and wrap their matching generic tokens, then write converters from specific to generic. That's a lot of duplicated logic and tedium, plus we now double the allocations and memory needed. Let's try something else...

## Shapeless

_NOTE: This bit about Shapeless is an interesting detour, but it can be skipped._

We could use [Shapeless](https://github.com/milessabin/shapeless)!
Shapeless is an ingeniously-sculpted library that facilitates abstractions that a panel of sane experts would deem impossible in Scala, one such abstraction being `Coproduct`s. Here's what a solution looks like using Shapeless.

_(Sorry I thought I had this working but just realised recursive coproducts don't work. I've commented-out Quote[A] for now. There is probably a way of doing this – Shapeless often doesn't take no from scalac for an answer – I'll update this if some kind 'netizen shares how.)_

```scala
sealed trait Token
case class  PlainText(text: String) extends Token
case object NewLine                 extends Token
case class  Link(url: String)       extends Token
case class  Quote[A](q: List[A])    extends Token

type BlogTitle   = PlainText :+: Link         :+: /*Quote[BlogTitle]   :+: */ CNil
type BlogComment = PlainText :+: NewLine.type :+: /*Quote[BlogComment] :+: */ CNil

/* compiles → */ val title = Coproduct[BlogTitle](PlainText("cool"))
// error    → // val title = Coproduct[BlogTitle](NewLine)
```

So far so good. What would a `Token ⇒ Text` function look like?

```scala
object ToText extends Poly1 {
  implicit def caseText    = at[PlainText   ](_.text)
  implicit def caseNewLine = at[NewLine.type](_ => "\n")
  implicit def caseLink    = at[Link        ](_.url)
  // ...
}

val text: String = title.map(ToText).unify
```

Ok I'm a little unhappy because I'm very fold of pattern-matching in these situations, but the above _does_ work effectively. One thing to be aware of with Shapeless, is _how_ it works. To achieve its awesomeness, it must build up a hierarchy of proofs which incurs time and space costs at both compile- and run-time – its awesomeness ain't free. The `val title = ...` statement above creates at least 7 new classes at runtime, where I want 1. Depending on your usage and needs, that overhead might be nothing, but it might be significant. It's something to be aware of when you decide on your solution.

## Zero-overhead Recursive ADT Coproducts

There's another way. I mentioned “zero-overhead” and it can be done. Here is a different solution that relies solely on standard Scala features, one such feature being path-dependent types.

You can create an abstract ADT, putting each constituent in a trait, then simply combine those traits into an object to have it reify a new, concrete, sealed ADT. **Sealed!** Let's see the new definition:

```scala
// Generic

sealed trait Base {
  sealed trait Token
}

sealed trait PlainTextT extends Base {
  case class PlainText(text: String) extends Token
}

sealed trait NewLineT extends Base {
  case class NewLine() extends Token
}

sealed trait LinkT extends Base {
  case class Link(url: String) extends Token
}

sealed trait QuoteT extends Base {
  case class Quote(content: List[Token]) extends Token
}

// Specific

object BlogTitle   extends PlainTextT with LinkT    with QuoteT
object BlogComment extends PlainTextT with NewLineT with QuoteT
```

Now let's use it:

```scala
   List[BlogTitle.Token](BlogTitle.PlainText("Hello")) // success
// List[BlogTitle.Token](BlogTitle.NewLine)   ← error: BlogTitle.NewLine doesn't exist
// List[BlogTitle.Token](BlogComment.NewLine) ← error: BlogComment tokens aren't BlogTitle tokens


// Specific
val blogTitleToText: BlogTitle.Token => String = {
  // case BlogTitle.NewLine   => ""     ← error: BlogTitle.NewLine doesn't exist
  // case BlogComment.NewLine => ""     ← error: BlogComment tokens not allowed
  case BlogTitle.PlainText(txt) => txt
  case BlogTitle.Link(url)      => url
  // Compiler warns missing BlogTitle.Quote(_) ✓
}

// General
val anyTokenToText: Base#Token => String = {
  case a: PlainTextT#PlainText => a.text
  case a: LinkT     #Link      => a.url
  case a: NewLineT  #NewLine   => "\n"
  // Compiler warns missing QuoteT#Quote ✓
}


// Recursive types
val t: BlogTitle  .Quote => List[BlogTitle  .Token] = _.content
val c: BlogComment.Quote => List[BlogComment.Token] = _.content
val g: QuoteT     #Quote => List[Base       #Token] = _.content
```

Look at that! That is _awesome_. These are some things that we get:

- No duplicated definitions or logic.
- Generic & specific hierarchies are sealed, meaning the compiler will let you know when you forget to cater for a case, or try to cater for a case not allowed.
- Children of recursive types have the same specialisation.<br />Eg. a `BlogTitle` can only quote using `BlogTitle` tokens.
- Tokens can be processed generically.
- Zero-overhead. No additional computation or new memory allocation needed to store tokens, or move them into a generic context. No implicits.
- Nice, neat pattern-matching which makes me happy.
- It's just plain ol' Scala traits so you're free to encode more constraints & organisation. You can consolidate traits, add type aliases, all that jazz.

There you go. Seems like a great solution to this particular scenario.

Nothing is without downsides though. Creation will likely be a little hairy; imagine writing a serialisation codec – the `Generic ⇒ Binary` part will be easy but `Binary ⇒ Specific` will be more effort. In my case I will only create this data thrice {serialisation, parsing, random data generation} but read and process it many, many times. Good tradeoff.
