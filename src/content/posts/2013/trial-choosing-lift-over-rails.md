---
title: "Trial: Choosing Lift over Rails"
pubDatetime: 2013-04-25T11:57:00.003+10:00
tags:
  - lift
  - programming
  - scala
description: Starting a new webapp with Scala's Lift framework instead of Ruby on Rails — weighing security, speed, snippets, and Ajax against a smaller ecosystem.
---

Today, I'm going to start on a slightly scary journey. I'm going to start work on a new webapp but I'm not going to use Ruby on Rails which I (mostly) love (with plugins) and already know well. Instead I'm going to use the Scala-based [Lift framework](http://liftweb.net/) which I have never used and is completely alien to me. This is going to cost me a lot of time at the beginning, not just because I don't know the API, but because the mindset of the beast seems drastically different to typical web frameworks that most of us are used to.

_(**NOTE re RAILS:** I will make many comparisons to RoR because it's the web framework I know best and cos it's well-known. Just like everyone thinks Maccas (ie. McDonalds for non-Aussies) when you think fast-food. It's tough being on top. Bad luck RoR.)_

_(**Have you made a similar transition?** I'd love to know how it went. [Let me know](mailto:japgolly@gmail.com)!)_

## Why?

In no particular order...

- **[Security](http://seventhings.liftweb.net/security).** Big security focus. Immune to lots of common vulnerabilities. I think it even automatically uses random param names for POSTs, etc.

- **Speed.** Compiles to Java bytecode, runs on JVM. Parallel rendering. Scala has built-in, native XML support so that should be faster than parsing textual templates. I read somewhere that a modest, old processor can comfortably serve 300 req/sec on a single processor, doing a modest amount of transformation. With threading I've read that this can exceed 20x the speed of the same webapp in RoR running multi-process, presumably on something like Puma, Thin, whatnot. _(No sources, sorry, it's arbitrary anyway. And we all know Ruby can be scaled, that's not the topic here.)_

- **Snippets rather than MVC.** MVC has never felt right to me. It's great for trivial DB-interface-like-webapp kind of stuff, but outside of that I've often run into ambiguous scenarios that don't feel comfortable... although I have used it happily for lack of a better alternative. Lift instead uses snippets which are pieces of logic/functionality that you can use all over the place in as many views as you like. Seems much better in terms of reusability, organisation on the other hand I'm not sure yet. Snippets are also executed in parallel -- nice.

- **Easier Ajax with [wiring/binding](http://seventhings.liftweb.net/wiring), [server-push](http://seventhings.liftweb.net/comet), more.** In addition to what the links say, most of the Ajax plumbing seems to be automatic; you don't even need to declare URLs or actions. Also type and parameter safety -- excellent.

Those are the main reasons that come to mind. There other niceties too such as [lazy loading](http://seventhings.liftweb.net/lazy). The doco flaunts [designer friendly templates](http://seventhings.liftweb.net/templates) as some awesome feature but I'm personally on the fence about it. I'm a one-man everything team at the moment so it doesn't immediately appeal to my situation. I can see it potentially making CSS dev faster (because you can work off a static template with all cases hardcoded which gets wiped by Lift) but I think any small gains will be offset by the major productivity loss of not having HAML.

## Downsides. The Oh Noes.

Basically, less \<good thing\>.

Less adoption. Less incumbency. This results in less libraries to choose from. Less plugins. I assume more reinvent-the-wheel kind of stuff for me to write.

Less community. It especially won't be as big as RoR's. This means less examples and code online, less questions on StackOverflow, less forums and blogs, less information and help. It sounds like the mailing list is friendly enough and I'll be joining today but it's nicer to have more resources at your disposal rather than just always hitting up the same guys for help.

Less developers on the market. If this app makes me millions of dollars and I get to a point where I need to outsource or hire then I'm going have significantly less people that can do the job. It's hard not to compare to RoR which is ubiquitous these days and which would cause no sweat finding capable helpers.

I'm going to accept these problems because Scala is awesome, Lift is philosophically fresh and whispers of great advantages once you climb the learning curve, and there are aspects of Lift that will have a direct impact on time, money and resources. For example, I'll be able to host my project free for longer (due to improved performance). If my project gets popular, yes, I'll have it harder looking for manpower but, (and this runs contrary to my innate tendencies), I often read & hear (with supporting evidence) that it's best to focus entirely on the short term when starting up a small business or venture (notice I avoided calling it a "startup"). Worries like scalability, resourcing, support, etc. can and should be dealt with once the project premise is proven to be successful **and profitable**. Like the 37-Signals guys say, _"A business without a path to profit isn't a business, it's a hobby"_, and if this gets off the ground and becomes just a hobby then I'm not going to fuss about that stuff anyway.
