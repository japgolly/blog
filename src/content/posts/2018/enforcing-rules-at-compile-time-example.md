---
title: "Enforcing rules at compile-time: an example"
pubDatetime: 2018-07-26T09:39:00+10:00
tags:
  - scala
  - scalajs
description: "Using a type-level Option encoding and @implicitNotFound in Scala to enforce React lifecycle method ordering rules at compile time in scalajs-react."
---

I recently solved a problem I had in Scala.
I was able to solve the problem quickly and easily, where as I remember when I was less experienced with Scala,
solving a problem like this was difficult. It would take a lot of thought and
effort, and even if I came away with a solution that technically worked,
it often felt off and wasn't pleasant to use.

I thought it'd be nice to share this example of my current approach to writing good Scala.
I hope you find it useful.

## Premise

I'm the author and maintainer of [scalajs-react](https://github.com/japgolly/scalajs-react) which is a Scala.JS library
that provides a type-safe interface to [React](https://reactjs.org), a JavaScript UI library.

In [scalajs-react](https://github.com/japgolly/scalajs-react), the primary way to create a UI component is via "the builder
pattern". The builder API is separated into 4 steps so that you first specify
the prerequisites in a deliberate order, then at the final step you can
specify a bunch of optional lifecycle methods. Usage looks like this:

```scala
val MyComponent =
  ScalaComponent.builder[Props]("MyComponent")
    .stateless               // step 1
    .noBackend               // step 2
    .render(...)             // step 3
    .componentWillMount(...) // step 4 (optional)
    .componentDidMount(...)  // step 4 (optional)
    .build                   // step 4
```

Steps 1 and 2 are optional and are made so in the API via implicits. A minimal example looks like this:

```scala
val MyComponent =
  ScalaComponent.builder[Props]("MyComponent")
    .render(...)             // step 3
    .build                   // step 4
```

Multiple specifications of the same lifecycle method compose.
For example, this is valid and will result in all three procedures executing
at the `.componentDidMount` lifecycle event.

```scala
val MyComponent =
  ScalaComponent.builder[Props]("MyComponent")
    .render(...)             // step 3
    .componentDidMount(...)  // step 4 (optional)
    .componentDidMount(...)  // step 4 (optional)
    .componentDidMount(...)  // step 4 (optional)
    .build                   // step 4
```

## Problem

A recent version of React introduced some changes to lifecycle methods
and so I was updating scalajs-react the other day.

The two changes relevant to this article are:

1. A new lifecycle method `getSnapshotBeforeUpdate` is added, from which you return any arbitrary value called a snapshot.
2. The lifecycle method `componentDidUpdate` gets a new parameter which is the value from `getSnapshotBeforeUpdate` above.

## Goals

Let's break down the new React changes into a few rules:

1. The return type of `getSnapshotBeforeUpdate` needs to match the type of the new `componentDidUpdate` param.
2. In the case that `getSnapshotBeforeUpdate` isn't specified, the type of the new `componentDidUpdate` param will be `Unit` (which is `undefined` in JS).
3. In order to support composition of multiple `getSnapshotBeforeUpdate` functions, a means of return value composition (most naturally a `Semigroup` typeclass) is required.

Regarding (3),

- `Semigroup` would only be required for subsequent calls, not the first, which adds a little complication for values for which `Semigroup` isn't defined.
- scalajs-react doesn't have external dependencies and I don't want to add a `Semigroup` typeclass to the public API.
- I'd be surprised if anyone ever wanted to supply multiple `getSnapshotBeforeUpdate` functions anyway; if so, one can do it oneself.

Therefore I've decided to just not support multiple `getSnapshotBeforeUpdate` functions. We don't lose parity with React JS anyway.

Let's break down (1) and (2) into more concrete rules:

1. `getSnapshotBeforeUpdate` can only be called 0 or 1 times
2. `getSnapshotBeforeUpdate` sets the `Snapshot` type
3. `componentDidUpdate` receives the `Snapshot` type
4. When `componentDidUpdate` is called and the `Snapshot` type is undefined, it's set to `Unit`
5. `getSnapshotBeforeUpdate` cannot occur after `componentDidUpdate` because it will change the `Snapshot` type which would invalidate the previous `componentDidUpdate` where the `Snapshot` was `Unit` (and a fn to `Unit` would be pointless here).

Before we continue it's time to emphasise:
type-safety is very important to me.
One of the biggest features of scalajs-react is its strong type-safety.
(As much is reasonable in Scala) if it compiles, I want confidence that it works and is correct.

I want to encode the above rules into the types so that end-users don't have to
read any documentation, have any internal knowledge of these rules, or experience
any runtime exceptions; the compiler should just enforce everything
we discussed such that violations wont even compile.

## Rejected solution

Probably the first solution that earlier-me would've reached for, is to create
a new step in the builder API like this:

```text
  [STEP 3]                                          [STEP 5]

  .render   ----(implicit with Snapshot=Unit)--->   last step
     \                                              /
      \                                            /
       --------> .getSnapshotBeforeUpdate ------> /

                         [STEP 4]
```

There are problems with such a solution:

- It doesn't scale. If React adds more constraints in future it will become harder to keep a fluent API without introducing unnecessary usage constraints.
- External component config fns (`LastStep => LastStep`) need to be able to configure any part of the lifecycle.
- `ScalaComponent.builder.static` is an example where it returns a half-built component allowing further configuration.
  It needs to set the `shouldComponentUpdate` method which would skip step 4 in this approach, or else require that we add nearly everything to both steps (yuk).

## Basic solution

Consider this pseudo-code:

```scala
var snapshotType = None

def getSnapshotBeforeUpdate[A](f: X => A) = {
  snapshotType match {
    case None    => snapshotType = Some(A)
    case Some(_) => error("SnapshotType already defined!")
  }
  getSnapshotBeforeUpdate = f
}

def componentDidUpdate(f) = {
  snapshotType = Some(snapshotType.getOrElse(Unit))
  componentDidUpdate.append(f)
}
```

We could track this at the term-level at runtime using `Option` (and typetags).
It's not very type-safe though.
We can still keep the same approach and logic, we just need to lift it up into the type-level so
that it runs at compile-time instead of at runtime.
To do so we'll use a type-level encoding of `Option`.

This is how you encode `Option` at the type-level in Scala; first you'll see a term-level equivalent
for contrast:

```scala
object TermLevel {

  sealed trait Option[+A] {
    def getOrElse[B >: A](default: => B): B
  }
  final case class Some[+A](value: A) extends Option[A] {
    override def getOrElse[B >: A](default: => B) = value
  }
  case object None extends Option[Nothing] {
    override def getOrElse[B >: Nothing](default: => B) = default
  }

  // Example usage
  def value: Option[Any] => Any = _.getOrElse(())
}

// ===============================================================

object TypeLevel {

  sealed trait TOption {
    type GetOrElse[B]
  }
  sealed trait TSome[A] extends TOption {
    override final type GetOrElse[B] = A
  }
  sealed trait TNone extends TOption {
    override final type GetOrElse[B] = B
  }

  // Example usage
  type Value[T <: TOption] = T#GetOrElse[Unit]
}
```

Ok, now let's code up a skeleton that will enforce our rules at compile-time:

```scala
final class Builder[SnapshotType <: TOption] {
  type SnapshotValue = SnapshotType#GetOrElse[Unit]

  def getSnapshotBeforeUpdate[A](f: ... => A)
                                (implicit ev: SnapshotType =:= TNone)
                                : Builder[TSome[A]]

  def componentDidUpdate(f: SnapshotValue => ...)
                        : Builder[TSome[SnapshotValue]]
}
```

Let's compare this to our pseudo-code:

1. The `snapshotType` var is now a type parameter of `Builder`.
2. `getSnapshotBeforeUpdate` would check `snapshotType` is `None` and set it to `Some(A)`.
   Now we ask for implicit proof that `SnapshotType =:= TNone`, set in the return type we can see return a new `Builder` with `SnapshotType` set to `TSome`
3. `getSnapshotBeforeUpdate` throw an error when `snapshotType` is `Some(_)`.
   Now the compiler will throw an implicit not found error at compile-time when `SnapshotType =:= TSome[_]`.
4. Where as before in `componentDidUpdate` we had `snapshotType = Some(snapshotType.getOrElse(Unit))`,
   we now have the equivalent in that the return type is `Builder[TSome[SnapshotValue]]`
   where `SnapshotValue = SnapshotType#GetOrElse[Unit]`.

## Nice solution

A while back I would've been satisfied with the above solution; it works right?
If you know all of the rules, sure, but the error message to users is going to
be pretty confusing and probably even lead them to think there's some kind of bug in the library.
This is what an error looks like at the moment:

```text
[error] ScalaComponentTest.scala:189: Cannot prove that japgolly.scalajs.react.example.TSome[A] =:= japgolly.scalajs.react.example.TNone.
[error]         .getSnapshotBeforeUpdate(???)
[error]                                 ^
[error] one error found
```

Nice UX in Scala is a bit of an art; in this case we'll do away with the
generic `TOption` and create a custom construct for this one specific problem.

First, the new shape. Because this isn't generic anymore we no longer need the
inner type member to be a type constructor which makes usage nicer too
(i.e. `T#Value` instead of `T#GetOrElse[Unit]`):

```scala
sealed trait UpdateSnapshot {
  type Value
}

object UpdateSnapshot {
  sealed trait None extends UpdateSnapshot {
    override final type Value = Unit
  }

  sealed trait Some[A] extends UpdateSnapshot {
    override final type Value = A
  }
}
```

Easy enough. Now to improve the UX on failure. First we change the `(implicit ev: SnapshotType =:= TNone)`
to `(implicit ev: UpdateSnapshot.SafetyProof[U])` and create:

```scala
object UpdateSnapshot {

  @implicitNotFound("You can only specify getSnapshotBeforeUpdate once, and it has to be before " +
    "you specify componentDidUpdate, otherwise the snapshot type could become inconsistent.")
  sealed trait SafetyProof[U <: UpdateSnapshot]

  implicit def safetyProof[U <: UpdateSnapshot](implicit ev: U =:= UpdateSnapshot.None): SafetyProof[U] =
    null.asInstanceOf[SafetyProof[U]]
}
```

The `(implicit ev: U =:= UpdateSnapshot.None)` is still part of the solution, but this time it's indirect.
It's a dependency on the availability of implicit `SafetyProof`. Thus the logic is still the same,
just users will never see it as an error message.

The `@implicitNotFound` annotation on `SafetyProof` is the pudding.
It will cause our custom error message to be displayed
as a compilation error when someone breaks the rules.

Using `null.asInstanceOf[SafetyProof[U]]` is a performance optimisation;
`new SafetyProof[U]{}` is fine too but I'd prefer to avoid the allocation
and more importantly, by never actually creating or using `SafetyProof` it can be
completely elided from Scala.JS output which means a smaller download for your
webapp's end-users.

Finally, our new builder excerpt looks like this:

```scala
final class Builder[U <: UpdateSnapshot] {
  type SnapshotValue = U#Value

  def getSnapshotBeforeUpdate[A](f: ... => A)
                                (implicit ev: UpdateSnapshot.SafetyProof[U])
                                : Builder[UpdateSnapshot.Some[A]]

  def componentDidUpdate(f: SnapshotValue => ...)
                        : Builder[UpdateSnapshot.Some[SnapshotValue]]
}
```

And let's look at what errors look like now:

```text
[error] ScalaComponentTest.scala:189: You can only specify getSnapshotBeforeUpdate once, and it has to be before you specify componentDidUpdate, otherwise the snapshot type could become inconsistent.
[error]         .getSnapshotBeforeUpdate(???)
[error]                                 ^
[error] one error found
```

## Done

That's all. I hope you've enjoyed.
If you're interested, the full patch that went into scalajs-react is here:

<https://github.com/japgolly/scalajs-react/commit/ee81acf12c1039997460a7cac3d759fda6577533>
