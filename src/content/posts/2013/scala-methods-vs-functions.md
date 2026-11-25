---
title: "Scala: Methods vs Functions"
pubDatetime: 2013-10-26T11:06:00.000+11:00
tags:
  - performance
  - programming
  - scala
description: Micro-benchmarking Scala methods versus first-class Function instances using ScalaMeter across direct invocation, higher-order passing, and primitive vs object boxing.
---

It's a bright, windy Saturday morning. Sipping a nice, warm coffee I find myself musing over the performance implications of subtleties between methods and functions in Scala. Functions are first-class citizens in Scala and represented internally as instances of `Function`_n_ (where n is the arity); effectively, an interface with an `apply` method. Methods are methods are methods; they are directly invocable in JVM-land.

So what differences are there that could affect performance? I can think of:

- Because functions are traits with abstract type members, in JVM-land those abstract types will be erased to Objects. I presume this means boxing for your primitives like int and long (unless scalac has any tricks up its sleeve like `@specialized`)
- When passing a method to a higher-order function, methods will need to be boxed into a Function. For example, in

  ```scala
  def method(s:String) = s.length
  List("abc").map(method)
  ```

  the `map` method requires an instance of `Function1` so I (again, presume) the compiler generates a synthetic instance of `Function1` as a proxy to the target method.

- The JVM can invoke methods directly. To invoke a function, it will have to first load up the Function object and then invoke its `apply` method. That's an extra hop.
- Probably more.

So those are some of the differences between functions and methods in Scala. Let's see how they perform. There's an awesome little micro-benchmarking tool called [ScalaMeter](http://axel22.github.io/scalameter/). It takes about 2 min to get started with it. I decided to test 1,000,000 reps along three axes:

1. Direct invocation vs passing to someone else
2. Primitive vs Object argument
3. Primitive vs Object result

## The Results

|            |           | Fn improvement over Method |
| ---------- | --------- | -------------------------: |
| **Direct** | int → int |                     -6.32% |
| **Direct** | int → str |                     -9.53% |
| **Direct** | str → int |                     -4.39% |
| **Direct** | str → str |                     -1.09% |
| **As Arg** | int → int |                      0.31% |
| **As Arg** | int → str |                      0.94% |
| **As Arg** | str → int |                     -0.22% |
| **As Arg** | str → str |                     -0.24% |

What can we see?

- It seems that there **is** a boxing cost for functions' i/o.
- It seems that there **is** a _slight_ cost when invoking functions directly.
- It seems that there **is no** real cost boxing methods into functions.

## Conclusion

If you're like one-week-ago-me _(pft he's idiot!)_, you might think you're helping the compiler out by writing functions instead of methods when their only use is to be passed around. Well it doesn't appear to be so.<br />
Just use methods and let your mind (if you're lucky enough to have its cooperation) worry about and solve other things.

Code and raw results available here: [https://github.com/japgolly/misc/tree/methods_and_functions](https://github.com/japgolly/misc/tree/methods_and_functions)
