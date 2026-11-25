---
title: A Year of Functional Programming
pubDatetime: 2014-06-09T18:53:00.000+10:00
tags:
  - fp
  - java
  - programming
  - ruby
  - scala
description: Reflections after one year of functional programming—from discovering Scala, Haskell, and Scalaz to embracing abstractions, expressive types, property-based testing, and computer science academia.
---

It's been a year since I first came across the concept of functional programming. To say it's changed my life, is an unjust understatement. This is a reflection on that journey.

_Warning: I use the term FP quite loosely throughout this article._

## Where I Was

I've been coding since the age of 8, so 26 years now. I started with BASIC & different types of assembly then moved on to C, C++, PHP and Perl _(those were different times, maaaan ☮)_, Java, JavaScript, Ruby. That's the brief gist of it. Basically: a lot of time on the clock and absolutely no exposure to FP concepts or languages. I thought functional programming just meant recursive functions (_ooooo big deal right?_). I really came in blind.

## How It Started: Scala

Last year, I wanted the speed and static checking (_note: not “types”_) of Java with the conciseness and flexibility of Ruby. I came across Scala, skimmed a little and was impressed. I bought a copy of [Scala For The Impatient](http://www.amazon.com/Scala-Impatient-Cay-S-Horstmann-ebook/dp/B007JWDMIE) and just ate it for breakfast. I read the entire thing in 2 or 3 days, jotted down everything useful and then just started coding. It was awesome! At first I was just coding the same way I would Java with less than half the lines of code. It is a very efficient Java.

## Exposure: Haskell

Lurking around the Scala community, I came across a joke. Someone said “Scala is a gateway drug to Haskell.” I found that amusing, although not for the reasons that the author intended. Haskell? Isn't that some toy university language? An experiment or something. Is it even still alive? Scala's awesome and so powerful, why would _that_ lead to Haskell? How.... intriguing. Inexplicably it piqued my interest and really stuck with me. Later I decided to look it up and yes, it sure was alive and very active. I was shocked to discover that it compiles to machine code (binary) and is comparable in speed to C/C++. _What?!_ It seems idiotic now but a year ago I thought it was some interpreted equation solver. I'm not alone in that ignorance, sadly; talking about it to some mates over lunch last year and a friend incredulously burst out laughing, “Haskell?” as if I was trying to tell him my dishwasher had an impressive static typing system. It saddens me to realise how in the dark I was, and how many people still are. Haskell is pretty frikken awesome! True to the gateway drug prophecy, I do now look to Haskell as an improvement to using Scala. But let's get back on track.

## Exposure: Scalaz

I also started seeing contentious discussion of some library called [Scalaz](https://github.com/scalaz/scalaz). Curious, I had a look at the code to see what people were on about, and didn't understand it at all. I'd see classes like `Blah[F[_], A, B]`, methods with confusing names that take params like `G[_], A → C, F[X → G[Y]]`, implementations like `F.boo_(f(x))(g)(x)`, and I'd just think “_What the hell is this? How is this useful?_”. I was used to _methods_ that did something pertaining to a goal in its domain. This Scalaz code was very alien to me and yet, very intriguing. Some obviously-smart person spent time making the alphabet soup permutations, why?

I've since discovered that answer to that question and I never could've imagined the amount of benefit it would yield. Instead of methods with domain-specific meaning, I now see functions for morphisms, in accordance with relevant laws. Simply put: changing the shape or content of types. No mention of any kind of problem-domain; applicable to all problem-domains! It's been surprising over the last year to discover just how applicable this is. This kind of abstraction is prolific, it's in your code right now, disguised, and intertwined with your business logic. Without knowledge of these kind of abstractions (and the awareness that a type-component level of abstraction _is_ indeed possible) you are doomed to reinvent the wheel for all time and not even realise it. Identifying and using these abstractions, your code becomes more reusable, simple, readable, flexible, and testable. When you learn to recognise it, it's breathtaking.

## FP: The Basics

Now that I'd been exposed to FP I started actively learning about it. At first I learned about referential transparency, purity and side-effects. I nodded agreement but had major reservations about the feasibility of adhering to such principals, and so at first I wasn't really sold on it. Or rather, I was hesitant. I may have been guilty of mumbling sentences involving the term “real-world”. Next came immutability. Now I'm a guy who used to use final religiously in Java, const on everything in C++ back in the day, and here FP is advocating for data immutability. Not just religiously advocating but providing real, elegant solutions to issues that you encounter using fully immutable data structures. Wow! So with immutability, composability, lenses it had its hooks in me.

Next came advocation for more expressive typing and (G)ADTs. That appealed in theory too and again I was hesitant about its feasibility. Once I experimentally applied it to some parts of my project, I was blown away by how well it worked. That became the gateway into thinking of code/types algebraically, which lead to...

## FP: Maths

I loved maths back in school and always found it easy. Reading FP literature I started coming across lots of math and at first thought “_great! I'm awesome at maths!_” but then, trying to make sense of some FP math stuff, I'd find myself spending hours clicking link after link, realising that I wasn't getting it and, in many cases, still couldn't even make sense of the notation. It became daunting. Even depressing. Frequently demotivating.

The good news is that everything you need is out there; you just have to be prepared to learn more than you think you need. I persisted, I stopped viewing it as an annoying bridge and starting treating it as a fun subject on its own and, before long things made sense again. It opens new doors when you learn it.

Example: I had a browser tab (about co-Yoneda lemma) open for 3 months because I couldn't make sense of it. It took months (granted not everyday) of trying then confusion then tangents to understand background and whatever it was that threw me off. Once I learned that final piece of background info, I went from understanding only the first 5% to 100%. It was a great feeling.

## Feeling Intimidated

Looking back there were times when I felt learning FP quite intimidating. When I'm in/around/reading conversations between experienced FP'ers quite often I've seriously felt like a moron. I started wondering if I gave my head a good slap, would a potato fall out. It can be intimidating when you're not used to it. But really, my advice to you, Reader, is that everyone's nice and happy to help when you're confused. I have a problem asking for help but I've seen everyone else do it and be received kindly... then I swoop in an absorb all the knowledge, hehe.

It's a mindset change. I wish I'd known this earlier as it would've saved me frustration and doubt, but you kind of need to unlearn what you think you know about coding, then go back to the basics. Imagine you've driven trains for decades, and spontaneously decide you want to be a pilot. No, you can't just read a plane manual in the morning and be in Tokyo in the afternoon. No, if you grab a beer with experienced pilots you won't be able to talk about aviation at their level. It's normal, right? Be patient, learn the basics, have fun, you'll get there.

On that note, I highly recommend [Fuctional Programming in Scala](http://www.manning.com/bjarnason/), it's a phenomenal book. It helped me wade my way from total confusion to comfortable comprehension on a large number of FP topics with which I was struggling trying to learn from blogs.

## Realisation: Abstractions

Recently I looked at some code I wrote 8 months ago and was shocked! I looked at one file written in “good OO-style”, lots of inheritance and code reuse, and just thought “_this is just a monoid and a bunch of crap because I didn't realise this is a monoid_” so I rewrote the entire thing to about a third of the code size and ended up with double the flexibility. Shortly after I saw another file and this time thought “_these are all just endofunctors,_” and lo and behold, rewrote it to about a third of the code size and the final product being both easier to use and more powerful.

I now see more abstractions than I used to. Amazingly, I'm also starting to see similar abstractions outside of code, like in UI design, in (software) requirements. It's brilliant! If you're not on-board but aspire to write “DRY” code, you will love this.

## Realisation: Confidence. Types vs Tests

I require a degree of confidence in my code/system, that varies with the project. I do whatever must be done to achieve that. In Ruby, that often meant testing it from every angle imaginable, which cost me significant effort and negated the benefit of the language itself being concise. In Java too, I felt the need to test rigorously.

At first I was the same in Scala, but since learning more FP, I test way less and have more confidence. Why? The static type system. By combining lower-level abstractions, an expressive type system, efficient and immutable data structures, and the laws of parametricity, in most cases when something compiles, it works. Simple as that. There are hard proofs available to you, I'm not talking about fuzzy feelings here. I didn't have much respect for static types coming from Java because it's hard to get much mileage out of it _(even in Java 8 – switch over enum needs a default block? Argh fuck off! Gee maybe maybe all interfaces should have a catch-all method too then. That really boiled my blood the other day. Sorry-)_, anyway: Java as a static typing system is like an abusive alcoholic as a parent. They may put food on the table and clothes your back, but that's a far cry from a good parent. (And you'll become damaged.) Scala on the other hand teaches you to trust again. Trust. Trust in the compiler. I've come to learn that when you trust the compiler and can express yourself appropriately, entire classes of problems go away, and with it the need for testing. It's joyous.

Sadly though, eventually you get to a point where Scala starts to struggle. It gets stupid, it can't work out what you mean, what you're saying, you have to gently hold its hand and coax it with explicit type declarations or tricks with type variance or rank-n types. Once you get to that level you start to feel like you've outgrown Scala and now need a big boy's compiler which can lead to habitual grumbling and regular reading about Haskell, Idris, Agda, Coq, et al.

However when you do need tests, you can write a single test for a bunch of functions using a single expression. How? Laws. Properties. Don't know what I mean? Pushing an item on to a stack should always increase its size by 1, the popping of which should reduce its size by 1 and return the item pushed, and return a stack equivalent to what you started with. Using libraries like [ScalaCheck](http://www.scalacheck.org/), turning that into a single expression like `pop(push(start, item)) == (start, item)` which is essentially all you need to write; ScalaCheck will generates test data for you.

## Where Next?

What does the future hold for me? Well, I could never go back to dynamically-typed language again.<br />
I will stick with Scala as I've invested a lot in it and it's still the best language I know well. I'd like to get more hands-on experience with [Haskell](http://learnyouahaskell.com/); I don't know its trade-offs that well but its type system seems angelic. Got my eye on [Idris](http://www.idris-lang.org/), too.

## Academia!

I used to get excited discovering new libraries. I'd always think “Great! I wonder what this will allow me to do.” Well now I feel that way about research & academic papers. They are the same thing except smarter, more lasting, more dependable, and they yield more flexibility. It's awesome and I've got decades of catching up to do! Over the next year I'll definitely spend a lot of time learning more FP and comp-sci theory. I'd also like to be able to understand most Haskell blogs I come across. They promise very intelligent constructs (which aren't specific to Haskell) but the typing usually gets a bit too dense; it'd be nice to be able to read those articles with ease.

**Don't fall for the industry dogma** that academia isn't applicable to the real-world. What a load of horseshit that lie is. It _does_ apply to the real-world, it's here to _help_ you achieve your goals, it will _save_ you significant time and effort, even with the initial learning overhead considered. Don't say you don't have time to do things in half the time. If you're always busy and your business are super fast-paced agile scrum need-it-yesterday kinda people, well I know you don't have time, but what I'm offering is this: say you just need to get something out the door and can do it quickly and messily in 1000 lines in 6 hours with 10 bugs and 10 “abilities”, well if you spend a bit of your own time learning you could perform the same task in 400 lines in 4 hours with maybe 1 bug and 20 “abilities”. You've just saved 2 hours up-front, not to mention days of savings when adding new features, fixing bugs, etc. That's applicable to you, the “real-world” and the industry. I've spent years in the industry and not just as a coder and I wish I'd known about this stuff back then because it would've saved me so much time, effort and stress. There seems to be this odd disdain for academia throughout the industry. Reject it. It's an ignorant justification of laziness and short-sightedness. It's false. I encourage you to take the leap.
