---
title: An Example of Functional Programming
pubDatetime: 2014-09-28T21:56:00.000+10:00
tags:
  - fp
  - programming
  - scala
description: A practical, beginner-friendly walkthrough of functional programming in Scala, incrementally building a composable user-data validation library across five evolving requirements.
---

Many people, after reading my [previous blog post](/blog/posts/2014/a-year-of-functional-programming), asked to see a practical example of FP with code. I know it's been a few months – I actually got married recently; wedding planning is _very_ time consuming – but I've finally come up with an example. Please enjoy.

Most introductions to FP begin with pleas for immutability but I'm going to do something different. I've come up with a real-world example that's not too contrived. It's about validating user data. There will be 5 incremental requirements that you can imagine coming in sequentially, each one building on the other. We'll code to satisfy each requirement incrementally without peeking at the following requirements. We'll code with an FP mindset and use Scala to do so but the language isn't important. This isn't about Scala. It's about principals and a perspective of thought. You can write FP in Java (if you enjoy pain) and you can write OO in Haskell (I know someone who does this and baffles his friends). The language you use affects the ease of writing FP, but FP isn't bound to or defined by any one language. It's more than that. If you don't use Scala this will still be applicable and useful to you.

I know many readers will have programming experience but little FP experience so I will try to make this as beginner-friendly as possible and omit using jargon without explanation.

## Req 1. Reject invalid input.

The premise here is that we have data and we want to know if it's valid or not. For example, suppose we want ensure a username conforms to certain rules before we accept it and store it in our app's database.

I'm championing _functional_ programming here so let's use a function! What's the simplest thing we need to make this work? A function that takes some data and returns whether it's valid or not: `A ⇒ Boolean`.

Well that's certainly simple but I'm going to handwaveily tell you that primitives are dangerous. They denote the format of the underlying data but not its meaning. If you refactor a function like `blah(dataWasValid: Boolean, hacksEnabled: Boolean, killTheHostages: Boolean)` the compiler isn't going to help you if you get the arguments wrong somewhere. Have you ever had a bug where you used the ID of one data object in place of another because they were both `long`s? Did you hear about the NASA mission that failed because of mixed metric numbers (eg. miles and kilometers) being indistinguishable?

So let's address that by first correcting the definition of our function. We want a function that takes some data and returns ~~whether it's valid or not~~ an indication of validity: `A ⇒ Validity`.

```scala
sealed trait Validity
case object Valid extends Validity
case object Invalid extends Validity

type Validator[A] = A => Validity
```

We'll also create a sample username validator and put it to use. First the validator:

```scala
val usernameV: Validator[String] = {
  val p = "^[a-z]+$".r.pattern
  s => if (p.matcher(s).matches) Valid else Invalid
}
```

Now a sample save function:

```scala
def example(u: String): Unit =
  usernameV(u) match {
    case Valid   => println("Fake-saving username.")
    case Invalid => println("Invalid username.")
  }
```

There's a problem here. Code like this will make FP practitioners cry and for good reason. How would we test this function? How could we ever manipulate or depend on what it does, or its outcome? The problem here is “[effects](<http://en.wikipedia.org/wiki/Side_effect_(computer_science)>)” and unbridled, they are anathema to healthy, reusable code. An effect is anything that affects anything outside the function it lives in, relies on anything impure outside the function it lives in, or happens in place of the function returning a value. Examples are printing to the screen, throwing an exception, reading a file, reading a global variable.

Instead we will model effects as data. Where as the above example would either 1) print _“Fake-saving username”_ or 2) print _“Invalid username”_, we will now either 1) return an effect that when invoked, prints _“Fake-saving username”_, or 2) return a reason for failure.

We'll define our own datatype called `Effect`, to be a function that neither takes input nor output.<br />
_(Note: If you're using Scalaz, `scalaz.effect.IO` is a decent catch-all for effects.)_

```scala
type Effect = () => Unit
def fakeSave: Effect = () => println("Fake save")
```

Next, Scala provides a type `Either[A,B]` which can be inhabited by either `Left[A]` or `Right[B]` and we'll use this to return either an effect or failure reason.<br />
Putting it all together we have this:

```scala
def example(u: String): Either[String, Effect] =
  usernameV(u) match {
    case Valid   => Right(fakeSave)
    case Invalid => Left("Invalid username.")
  }
```

## Req 2. Explain why input is invalid.

We need to specify a reason for failure now.<br />
We still have two cases: valid with no error msg, invalid with an error msg. We'll simply add an error message to the `Invalid` case.

```scala
case class Invalid(e: String) extends Validity
```

Then we make it compile and return the invalidity result in our example.

```diff
 val usernameV: Validator[String] = {
   val p = "^[a-z]+$".r.pattern
-  s => if (p.matcher(s).matches) Valid else Invalid
+  s => if (p.matcher(s).matches) Valid else
+         Invalid("Username must be 1 or more lowercase letters.")
 }

 def example(u: String): Either[String, Effect] =
   usernameV(u) match {
     case Valid      => Right(fakeSave)
-    case Invalid    => Left("Invalid username.")
+    case Invalid(e) => Left(e)
   }
```

## Req 3. Share reusable rules between validators.

Imagine our system has 50 data validation rules, 80% reject empty strings, 30% reject whitespace characters, 90% have maximum string lengths. We like reuse and D.R.Y. and all that; this requirement addresses that by demanding that we break rules into smaller constituents and reuse them.

We want to write small, independent units and join then into larger things. This leads us to an important and interesting topic: composability.

I want to suggest something that I know will cause many people to cringe – but hear me out – let's look to math. Remember basic arithmetic from ye olde youth?

```text
8 = 5 + 3
8 = 5 + 1 + 2
```

Addition. This is great! It's building something from smaller parts. This seems like a perfect starting point for composition to me. There's a certain beauty and elegance to math, and its capability is proven; what better inspiration!

Let's look at some basic properties of addition.

**Property #1:**

> 8 = 8 + 0<br />
> 8 = 0 + 8<br />
> Add 0 to any number and you get that number back unchanged.

**Property #2:**

> 8 = (1 + 3) + 4<br />
> 8 = 1 + (3 + 4)<br />
> 8 = 1 + 3 + 4<br />
> Parentheses don't matter. Add or remove them without changing the result.

**Property #3:**

> I'll also mention that in primary school, you had full confidence in this:<br />
> `number + number = number`<br />
> It may seem silly to mention, but imagine if your primary school teacher told you that<br />
> `number + number = number | null | InvalidArgumentException`

\+ has other properties too, like 2+6=6+2 but we don't want that for our scenario with validation. The above three provide enough benefit for what we need.

You might wonder why I'm describing these properties. Why should you care? Well as programmers you gain much by writing code with similar properties. Consider...

- You know you don't have to remember to check for nulls, catch any exceptions, worry about our internal AddService™ being online.
- As long as the overall order of elements is preserved, you needn't care about the order in which groups are composed. i.e. we know that a+b+c+d+e will safely yield the same result if we batch up execution of (a+b) and (c+d+e) then add their results last. And parenthesis support is already provided by the programming language.
- If ever forced into composition by some code path and you can opt out by specifying the 0 because we know that 0+x and x+0 are the same as x. No need to overload methods or whatnot.

Simple right? Well have you ever heard the term _“monoid”_ thrown around? (Not “monad”.) Guess what? We've just discussed all that makes a monoid what it is and you learned it as a young child.<br />
A monoid is a binary operation (x+x=x) that has 3 properties:

- **Identity:** The 0 is what we call an identity element. 0+x = x = x+0
- **Associativity:** That's the ability to add/remove parentheses without changing the result.
- **Closure:** Always returns a result of the same type, no RuntimeExceptions, no nulls.

If jargon from abstract algebra intimidates you, know that it's mostly just terminology. You already know the concepts and have for years. The knowledge is very accessible and it's incredibly useful to be able to identify these kinds of properties about your code.

Speaking of code, let's implement this new requirement as a monoid. We'll add `Validator.+` for composition and ensure it preserves the associativity property, and `Validator.id` for identity (also called zero).

_(Note: If using Scalaz, Algebird or similar, you can explicitly declare your code to be a monoid to get a bunch of useful monoid-related features for free.)_

```scala
case class Validator[A](f: A => Validity) {
  @inline final def apply(a: A) = f(a)

  def +(v: Validator[A]) = Validator[A](a =>
    apply(a) match {
      case Valid         => v(a)
      case e@ Invalid(_) => e
    })
}

object Validator {
  def id[A] = Validator[A](_ => Valid)
}
```

The difficulty of building human-language sentences scales with expressiveness. For our demo it's enough to simply have validators contain error message clauses like _“is empty”_, _“must be lowercase”_ and just tack the subject on later.

First we define some helper methods `pred` and `regex`, then use them to create our validators

```scala
object Validator {
  def pred[A](f: A => Boolean, err: => String) =
    Validator[A](a => if (f(a)) Valid else Invalid(err))

  def regex(r: java.util.regex.Pattern, err: => String) =
    pred[String](a => r.matcher(a).matches, err)
}

val nonEmpty = Validator.pred[String](_.nonEmpty, "must be empty")
val lowercase = Validator.regex("^[a-z]*$".r.pattern, "must be lowercase")

val usernameV = nonEmpty + lowercase
```

Then we gaffe our subject to on to our error messages before displaying it and we're done.

```scala
def buildErrorMessage(field: String, err: String) = s"$field $err"

def example(u: String): Either[String, Effect] =
  usernameV(u) match {
    case Valid      => Right(fakeSave)
    case Invalid(e) => Left(buildErrorMessage("Username", e))
  }
```

## Req 4. Explain all the reasons for rejection.

Users are complaining that they get an error message, fix their data accordingly only to have it then rejected for a different reason. They again fix their data and it is rejected again for yet another reason. It would be better to inform the user of all the things left to fix so they can amend their data in one shot.<br />
For example, an error message could look like _“Username 1) must be less than 20 chars, 2) must contain at least one number.”_

In other words there can be 1 or more reasons for invalidity now. Ok, we'll amend `Invalid` appropriately...

```scala
case class Invalid(e1: String, en: List[String]) extends Validity
```

Then we just make the compiler happy...

```diff
 case class Validator[A](f: A => Validity) {
   @inline final def apply(a: A) = f(a)

   def +(v: Validator[A]) = Validator[A](a =>
-    apply(a) match {
-      case Valid         => v(a)
-      case e@ Invalid(_) => e
-    })
+    (apply(a), v(a)) match {
+      case (Valid          , Valid          ) => Valid
+      case (Valid          , e@ Invalid(_,_)) => e
+      case (e@ Invalid(_,_), Valid          ) => e
+      case (Invalid(e1,en) , Invalid(e2,em) ) => Invalid(e1, en ::: e2 :: em)
+    })
 }

 object Validator {
   def pred[A](f: A => Boolean, err: => String) =
-    Validator[A](a => if (f(a)) Valid else Invalid(err))
+    Validator[A](a => if (f(a)) Valid else Invalid(err, Nil))
 }

-def buildErrorMessage(field: String, err: String) = s"$field $err"
+def buildErrorMessage(field: String, h: String, t: List[String]): String = t match {
+  case Nil => s"$field $h"
+  case _   => (h :: t).zipWithIndex.map{case (e,i) => s"${i+1}) $e"}.mkString(s"$field ", ", ", ".")
+}

 def example(u: String): Either[String, Effect] =
   usernameV(u) match {
     case Valid         => Right(fakeSave)
-    case Invalid(e)    => Left(buildErrorMessage("Username", e))
+    case Invalid(h, t) => Left(buildErrorMessage("Username", h, t))
   }
```

_(Note: If you're using Scalaz, `NonEmptyList[A]` is a better replacement for `A, List[A]` like I've done in `Invalid`. The same thing can also be achieved by `OneAnd[List, A]`. In fact `OneAnd` is a good way to have compiler-enforced non-emptiness.)_

## Req 5. Omit mutually-exclusive or redundant error messages.

Take the this error message: _“Your name must 1) include a given name, 2) include a surname, 3) not be empty”_. If the user forgot to enter their name you just want to say _“hey you forgot to enter your name”_, not bombard the user with details about potentially invalid names.

What does this mean? It means one rule is unnecessary if another rule fails. What we're really talking about here is the means by which rules are composed. Let's just add another composition method. We talked about the + operation in math already, well math also provides a multiplication operation too. Look at an expression like 6 + 14 + (7 \* 8). Two types of composition, us explicitly clarifying our intent via parentheses. That's perfectly expressive to me and it solves our new requirement with simplicity and minimal dev. As a reminder that we can borrow from math without emulating it verbatim, instead of a symbol let's give this operation a wordy name like `andIfSuccessful` so that we can say `nonEmpty andIfSuccessful containsNumber` to indicate a validator that will only check for numbers if data isn't empty.

Just like these express different intents and yield different results

```text
number = 4 * (2 + 10)
number = (4 * 2) + 10
```

So too can

```scala
rule = nonEmpty andIfSuccessful (containsNumber and isUnique)
rule = (nonEmpty andIfSuccessful containsNumber) and isUnique
```

Or if you don't mind custom operators

```scala
rule = nonEmpty >> (containsNumber + isUnique)
rule = (nonEmpty >> containsNumber) + isUnique
```

To implement this new requirement we add a single method to `Validator`:

```scala
def andIfSuccessful(v: Validator[A]) = Validator[A](a =>
  apply(a) match {
    case Valid           => v(a)
    case e@ Invalid(_,_) => e
  })
```

## Conclusion

And we're done.<br />
It's not how I would've approached code years back in my OO/Java era, nor is it like any of the code I came across written by others in that job. As an experiment I started fulfilling these requirements in Java the way old me used to code and there was a _loooot_ of wasted code between requirements. I'd get all annoyed at each new step, so much so that I didn't even bother finishing. On the contrary, I _enjoyed_ writing the FP.

Right, what conclusions can we draw?

**FP is simple.** Each validation is a single function in a wrapper.<br />
**FP is flexible.** Logic is reusable and can be assembled into complex expressions easily.<br />
**FP is easily maintainable & modifiable.** It has less structure, less structural dependencies, and is less code, plus the compiler's got your back.<br />
**FP is easy on the author.** There was next to no rewriting or throw-away of code between requirements, and each new requirement was easy to implement.

I hope this proves an effective concrete example of FP for programmers of different backgrounds. I also hope this enables _you_ to write more reliable software and have a happier time doing it.

Go forth and function.

_[(Source code)](https://gist.github.com/japgolly/fe822c84855da9b7f011)_
