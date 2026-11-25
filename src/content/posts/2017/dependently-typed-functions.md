---
title: Dependently-Typed Functions
pubDatetime: 2017-06-05T21:27:00.002+10:00
tags:
  - fp
  - scala
description: "How to implement exhaustive dependently-typed methods and first-class dependently-typed function values in Scala using path-dependent types and higher-kinded folds."
---

It's been a while since my last blog post.
This time around I'm going to show how to do something in Scala that you might first
think would be very straight-forward but unfortunately, at least in Scala ≤ 2.12.2, requires a bit of hoop-jumping:
dependently-typed functions.

Consider the following data type:

```scala
sealed trait Field { type Value }
object Field {
  case object Name extends Field { type Value = String }
  case object Age  extends Field { type Value = Int }
}
```

With this data type, you have the following path-dependent types:

```scala
Name.Value == String
Age .Value == Int

val n = Name
n.Value == String
```

You also have the following type projections:

```scala
Name .type#Value = String
Age  .type#Value = Int
Field     #Value = Any
```

## 1. A Dependently-Typed Method

Lets say you want to create the following, rather innocent-looking function:

```scala
def emptyValue(f: Field): f.Value
```

Likely your first attempt will be to pattern-match:

```scala
def emptyValue(f: Field): f.Value =
  f match {
    case Field.Name => ""
    case Field.Age  => 0
  }
```

Unfortunately scalac doesn't support this and you instead get compilation errors:

```text
<console>:15: error: type mismatch;
 found   : String("")
 required: f.Value
           case Field.Name => ""
                              ^
<console>:16: error: type mismatch;
 found   : Int(0)
 required: f.Value
           case Field.Age  => 0
                              ^
```

Ok, let's switch to a different representation:

```scala
type Aux[A] = Field { type Value = A }

def emptyValueHack[A](f: Aux[A]): A =
  f match {
    case Field.Name => ""
    case Field.Age  => 0
  }

def emptyValue(f: Field): f.Value =
  emptyValueHack[f.Value](f)
```

This _does_ work. Great! END BLOG POST. Right?
Wrong. There's another problem.
What happens if we forget a case:

```scala
def emptyValueHack2[A](f: Aux[A]): A =
  f match {
    case Field.Name => ""
    // case Field.Age  => 0
  }
```

It's compiles successfully without any warnings.
We've lost exhaustivity checking which is a runtime exception just waiting to happen.
Oh noes. Now what?
Consider: what are we doing when we do simple pattern-matching on each case?
We're inspecting a value, choosing a corresponding function, and executing it.
If each case has exactly one corresponding function then we have exhaustivity.
That sounds like something we already have the means to do, without pattern-matching, in plain old Scala.

Ok, let do this ourselves, exactly one function per case and choose depending on the `Field`.

```scala
sealed trait Field {
  type Value
  def fold(n: Field.Name.type => Field.Name.Value,
           a: Field.Age .type => Field.Age .Value): Value
}

object Field {
  case object Name extends Field {
    override type Value = String
    override def fold(n: Field.Name.type => Field.Name.Value, a: Field.Age.type => Field.Age.Value): Value =
      n(this)
  }

  case object Age extends Field {
    override type Value = Int
    override def fold(n: Field.Name.type => Field.Name.Value, a: Field.Age.type => Field.Age.Value): Value =
      a(this)
  }
}
```

Take a good look at this. There are a few things that might seem odd.
You're probably wondering why I'm passing statically-known singletons to arguments.
Why not just:

```scala
def fold(name: => Field.Name.Value,
         age : => Field.Age .Value): Value
```

Three reasons:

1. Cases aren't always objects. What if they're case classes like `case class CustomField(label: String) extends Field`. In such a case it will be important to pass the instance to the caller so that they have access to the additional/dynamic information in the `label` field.

2. It embodies the proof that the appropriate argument case is required for each field case. The types make it clear and so long as you call the arg with `this` instead of `Field.Name` directly, then you get an extra bit of proof of correctness. Seeing as the workarounds described in this post introduce some tedium so too do they often introduce copy-pasting which can lead to accidental bugs like this:

   ```scala
   // Spot the bug...
   case object Name extends Field {
     override type Value = String
     override def fold(n: Field.Name.type => Field.Name.Value, a: Field.Age.type => Field.Age.Value): Value =
       n(Name)
   }
   case object Age extends Field {
     override type Value = Int
     override def fold(n: Field.Name.type => Field.Name.Value, a: Field.Age.type => Field.Age.Value): Value =
       n(Name)
   }
   ```

3. The caller has the same problem as above; if they're pattern-matching and want an downcast instance of `Field` in their case functions then this gives it to them so that _they_ don't manually reference `Field.Name` and end up with potential bugs.

## 2. Reducing Duplication

Next, let's think about what happens if we add a new case like `Field.Address`; we'll have to update the `fold` signature in our current three places and then add a fourth in `Field.Address`. So much repetition!
If you find yourself copy-pasting a cumbersome list of method arguments, consider it a good practice to encapsulate them all in a class/record.
That way you can consistently pass around and declare a single type, and changes to its fields don't cause changes to method signatures.
Let's do that for our fold method:

```scala
sealed trait Field {
  type Value
  def fold(f: Field.Fold): Value
}

object Field {
  case object Name extends Field {
    override type Value = String
    override def fold(f: Field.Fold) = f.name(this)
  }

  case object Age extends Field {
    override type Value = Int
    override def fold(f: Field.Fold) = f.age(this)
  }

  final case class Fold(name: Field.Name.type => Field.Name.Value,
                        age : Field.Age .type => Field.Age .Value)
}
```

Look at that `fold` method, nice and easy. We can add cases ALL DAY LONG without repetition.
High five thineself.

While we're in the vicinity, let's add a little convenience method to the `Fold` class to really prove to ourselves that can accomplish our original goal, pay attention to signature:

```scala
final case class Fold(name: Field.Name.type => Field.Name.Value,
                      age : Field.Age .type => Field.Age .Value) {
  def apply(f: Field): f.Value =
    f.fold(this)
}
```

Now using the above, how can we rewrite our original `emptyValue` function?

```scala
def emptyValue(f: Field): f.Value =
  Field.Fold(
    name = _ => "",
    age  = _ => 0,
  )(f)
```

Goals: accomplished.

- Concise
- Exhaustive
- Pattern-match in spirit

It's a little ugly but not a huge deal.
Depending on your codebase and environment you can likely avoid the need for `_ =>` bits without penalty which will make it a little nicer on the eyes.

## 3. A Dependently-Typed Function

Like most everything from OOP, methods are boring. You can't abstract over them,
all you can do is call them. Functions allow you to do more because they themselves
are values; you can pass them around which facilitates awesome collections methods
like `.map(A => B)`, `.filter(A => Boolean)`, etc. and that's just the tip of the iceberg.

In the previous step we created a method whose output depends on its input _value_.
How can we have the same in the form of a function?
Function types are fixed, and the function type doesn't have a value to work with.
Scala doesn't accept this kind of syntax:

```scala
// nope - not valid syntax
type MyFn = (f: Field) => f.Value
```

You might try using projections like this but you'll lose the relationship between input and output.

```scala
type MyFn = Field => Field#Value
// which is the same as
type MyFn = Field => Any
```

We've already encountered the answer. Surprise!
`Field.Fold` is what we're looking for. It's a value, you can pass it around;
you can apply it via its `apply` method to obtain a dependently-typed result.

Let's try it out:

```scala
def blah(field: Field, getValue: Field.Fold): field.Value =
  getValue(field)
```

Hmmm, yes, well it _does_ work but it's admittedly not very interesting in that shape.
It can only represent `f => f.Value`...

## 4. Dependently-Typed Functions

What if we want a function of any shape instead of just `f => f.Value`?
Maybe you want to be able to print each field to the screen: `f => f.Value => Unit`.
Maybe you want to reduce lists of each value to a single value: `f => List[f.Value] => f.Value`.
Or perform validation: `f => f.Value => Either[Error, f.Value]`.

Let's find an abstraction that can represent each example above.
They all have the shape: `f => {something including f.Value}`.
Add some type aliases for the right-hand sides:

```scala
type GetValue  [Value] = Value
type Print     [Value] = Value => Unit
type ReduceList[Value] = List[Value] => Value
type Validate  [Value] = Value => Either[Error, Value]
```

There's our abstraction:

```scala
type F[Value] = // various
```

with the fold being various cases of `f => F[f.Value] where F[Value] = …`.

Let's update the fold to allow this:

```scala
final case class Fold[F[_]](name: Field.Name.type => F[Field.Name.Value],
                            age : Field.Age .type => F[Field.Age .Value]) {
  def apply(f: Field): F[f.Value] =
    f.fold(this)
}
```

Now let's try it out:

```scala
// f: Field => f.Value
val getValue = Field.Fold[GetValue](
  name = _ => "George",
  age  = _ => 99)

// f: Field => f.Value => Unit
val printValue = Field.Fold[Print](
  name = _ => n => println(s"My name is $n."),
  age  = _ => i => println(s"I am $i years old."))
```

Great. Dependently-typed function values. And how do we use them? Just like normal functions.

```scala
val f = Field.Age
val v = getValue(f) // v = 99
printValue(f)(v)    // prints: I am 99 years old.
```

Very good. I hope you found the interesting. Thanks for reading!

For more exhilaration, as an exercise to the reader, try to:

- define composition of fold functions
- create multiple folds for subsets of the same data type

## Appendix

### Type parameters

In terms of representation, using type parameters is isomorphic (ignoring variance).
The following represents the exact same information:

```scala
sealed trait Field[V]
object Field {
  case object Name extends Field[Int]
  case object Age  extends Field[String]
}
```

In terms of usage however, the two representations are far from the same and have a drastic impact on how you'll use them.
Some things are easier, some harder.

For example, in terms of generic access existential types make life easier: its simply `Field` instead of `Field[_]`. This is even more evident when there's a constraint on the type like `Field[_ <: AnyRef]` whilst `Field` remains the same.

I've come across other scenarios but honestly can't remember right now, something something implicits...
Instead take a look at this slide deck of [@julienrf](https://twitter.com/julienrf)'s for more comparison: <https://julienrf.github.io/2017/existential-types/>

### Code

The final code in full of this blog post is available here:
<https://gist.github.com/japgolly/162f102d516abf86b54359ef0b1d3b65>
