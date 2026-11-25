---
title: Welcome!
pubDatetime: 2020-08-18T11:28:00+10:00
tags:
  - shipreq
  - scala
  - scalajs
  - meta
description: An introduction, a tech overview of ShipReq, and a warm message to OSS contributors.
---

Hello and welcome to the ShipReq Blog.
I'm David and I created ShipReq.

## What is "ShipReq"? A techie's perspective

If you're reading this you're likely a fellow techie, and probably expecting a technical article.
I'll leave you to head over to the [ShipReq About](https://shipreq.com/about) page if your want to know ShipReq's purpose.

Otherwise, I'll introduce it from a technical perspective.
It's a SAAS built from the ground-up with FP (functional programming); both in the backend, which is written in [Scala](https://www.scala-lang.org);
and in the frontend, which is written in [Scala](https://www.scala-lang.org) too using [Scala.JS](https://www.scala-js.org). Scala.JS
transpiles and optimises Scala into plain old JS. The generated JS is incomprehensible to humans but
source maps can also be generated.
Deciding to use Scala for both the frontend as well as the backend was a decision that felt a bit risky at first,
but has ended up consistently paying huge dividends for years now, and I couldn't be happier.
Being able to effortlessly share, and move strongly-verified code around between the frontend and backend is profoundly beneficial.

There are a bunch of satellite components and services in the ShipReq ecosystem if you peek behind the covers,
most of which are third-party OSS apps.
I won't list them all but notably, [Prometheus](https://prometheus.io) and [Grafana](https://grafana.com/oss/grafana)
deserve an applause, and I highly recommend you give them a look if you don't know what they are.

All infrastructure is managed by [Terraform](https://www.terraform.io).
Another fantastic tool I highly recommend using if you're not already.
Finally with my own venture I'm in a position where if I decide I want to spin up a completely
new environment, complete with metrics and security and scalability etc, I basically just
hit a button and enjoy a 20 min coffee break. There've been so many times in my career
that I and the entire team were frustrated and hindered by the fact that we needed to,
we couldn't spin up a new UAT cluster,
or do performance testing without locking everyone else out.
If you write all of your infrastructure once without hardcoding settings,
especially if you make your environment a [Terraform module](https://learn.hashicorp.com/tutorials/terraform/module),
getting it working for a single environment effectively gains you the ability
to spin up new, isolated environments for free.

This site is written
with [Gatsby](https://www.gatsbyjs.org), [Typescript](https://www.typescriptlang.org), [MDX](https://mdxjs.com) _(MD + JSX)_
which, by the way, has been a surprisingly awesome experience.
Typescript isn't the greatest type system in the world,
but a blog is not a large-scale complex system and
Typescript has shown to be a fantastic tool for this job.
Gatsby's much slower than advertised and I really hope that the Gatsby team manages to improve this in the future
because it's the only significant flaw that I experienced.
ShipReq's documentation is ongoing (and has been stalled by the global pandemic),
and I was planning to host it all with Gatsby.
Given the discovery of Gatsby's performance issues (30 min builds anyone?), I think it's now important
to evaluate [Next.js](https://nextjs.org) and it's ability to create static websites.
If you're ever need to create a web "site" (not webapp), regardless of what your favourite language is,
I think you'll like [Typescript](https://www.typescriptlang.org) with either [Gatsby](https://www.gatsbyjs.org) or [Next.js](https://nextjs.org).

## What is this blog for?

There are two types of content you can expect to see here.

1. **Service related:** articles discussing [ShipReq](https://shipreq.com), the service.

   Anything from announcements of, or deep-dives into new features, to notifications of uptime disruption.

2. **Technical posts:** educational material, mostly for programmers.

   There's a reason I listed a bunch of technologies above.
   When I come across something I think is an interesting discovery, invention, workaround, whatever, in those domains,
   if I judge it to be the right combination of valuable and not-well-known then this is where you can find me posting about it.

## OSS ❤️

[ShipReq](https://shipreq.com) is quite an advanced product that wouldn't have been possible
without being able to stand on the shoulders of many giants in the open-source community.
I have so much appreciation towards the many wonderful people
in the open-source community, their efforts, and the amazing tools and technologies.
As the founder, a very important part of my vision for [ShipReq](https://shipreq.com) has always been that it has
to be of exceptionally high quality, both from the perspective of our staff as we maintain, nurture and
grow the product; and even more importantly, of our users in every interaction both on-screen and off.
I'm elated to say that I've achieved my goal, and
I wouldn't have been able to achieve this level of quality alone, without access to all the wonderful,
free tools and material out there.
So it's become a very important value of ShipReq, now and forever,
to give back to the community when I can, and hopefully enable a
new generation of creators and visionaries, just as I had the privilege of being enabled.
To be concrete, I plan to do this in the following ways:

1. <u>open-sourcing software created for ShipReq.</u> I've been doing this for years now, and you can already have a look around if you like:
   _(They're nearly all Scala libraries)_

   - [Clear Config](https://github.com/japgolly/clear-config)
   - [Microlibs](https://github.com/japgolly/microlibs-scala)
   - [Mr. Boilerplate](https://github.com/japgolly/mr.boilerplate)
   - [Nyaya](https://github.com/japgolly/nyaya)
   - [scala-graal](https://github.com/japgolly/scala-graal)
   - [scalajs-benchmark](https://github.com/japgolly/scalajs-benchmark)
   - [scalajs-react](https://github.com/japgolly/scalajs-react)
   - [ScalaCSS](https://github.com/japgolly/scalacss)
   - [Scala Test State](https://github.com/japgolly/test-state)
   - [UnivEq](https://github.com/japgolly/univeq)
   - [Webtamp](https://github.com/japgolly/webtamp) (JS)

2. <u>sharing learnings & teaching.</u> Primarily by writing blog posts—that's part of what this blog is for!
   Previously I'd post to [my personal account](https://japgolly.blogspot.com/) but
   going forward, all new technical articles will appear here instead. The majority of articles
   will be about [Scala](https://www.scala-lang.org), [Scala.JS](https://www.scala-js.org), and FP (functional programming).

3. <u>financial support and sponsorship.</u> [ShipReq](https://shipreq.com) is still in the early stages of business and as I write
   this, it's not even open to the general public yet. But mark my words, when [ShipReq](https://shipreq.com) blooms into a
   successful business and is in a position that can afford to, we will financially contribute to both
   OSS directly, and to amazing initiatives like [Scala Center](https://scala.epfl.ch).
   This declaration has been written down and archived until (at least) the cold death of universe by Google
   so feel free to hold me to it in future.

That's all for now.
Thanks for dropping by and stay tuned for more!

And again: if you're a contributor to OSS or similar, ❤️thank you❤️!
You help people's dreams come true.

---

_Original discussion: [Hacker News](https://news.ycombinator.com/item?id=24195087) · [Reddit](https://old.reddit.com/r/scala/comments/ibtrco/a_message_to_the_scala_oss_community_new/) · [Twitter](https://twitter.com/japgolly/status/1295566888227856385)_
