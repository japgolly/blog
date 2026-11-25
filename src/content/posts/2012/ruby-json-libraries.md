---
title: Ruby JSON Libraries
pubDatetime: 2012-04-18T20:27:00+10:00
tags:
  - jruby
  - json
  - performance
  - programming
  - ruby
description: Benchmarking Ruby and JRuby JSON libraries (Oj, YAJL, json-jruby, json_pure, json, OkJson, and jrjackson) across MRI, OpenJDK, and Oracle Java.
---

Over the last 5 years or so I'd been away from the world of Ruby. I still used Ruby at work and home for various little things [cos it's _awesome!_] but that's quite different to living in it, especially seeing its community is one of the most fast-paced I've seen. So when I came back recently and I needed a JSON library, I went searching and found (what felt like) 100 different JSON libraries...

Long story short, I benchmarked them. Feel free to skip to the [end of this post](#conclusion) to just get the conclusion and be on your way.

## What Was Used

| NAME        | VERSION   | BUILD                                                                                                                                                       |
| ----------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MRI Ruby    | 1.9.3p125 | `ruby 1.9.3p125 (2012-02-16 revision 34643) [x86_64-linux]`                                                                                                 |
| JRuby       | 1.6.7     | `jruby 1.6.7 (ruby-1.9.2-p312) (2012-02-22 3e82bc8) (OpenJDK 64-Bit Server VM 1.7.0_03-icedtea) [linux-amd64-java]`                                         |
| JRuby       | 1.7.0.dev | `jruby 1.7.0.dev (ruby-1.9.3-p139) (2012-04-15 b4b38d4) (Java HotSpot(TM) 64-Bit Server VM 1.7.0_03) [linux-amd64-java]`                                    |
| OpenJDK     | 1.7.0_03  | `OpenJDK Runtime Environment (IcedTea7 2.1) (ArchLinux build 7.b147_2.1-3-x86_64)`<br />`OpenJDK 64-Bit Server VM (build 22.0-b10, mixed mode)`             |
| Oracle Java | 1.7.0_03  | `java version "1.7.0_03"`<br />`Java(TM) SE Runtime Environment (build 1.7.0_03-b04)`<br />`Java HotSpot(TM) 64-Bit Server VM (build 22.1-b02, mixed mode)` |
| MultiJson   | 1.3.2     | `c73bc389fa1b0b1c0b8225ea77ff3e2dee312304`                                                                                                                  |

The following JSON libraries were tested:

| NAME                | GEM NAME     | VERSION                               |
| ------------------- | ------------ | ------------------------------------- |
| Optimized JSON (Oj) | `oj`         | 1.2.4                                 |
| YAJL                | `yajl-ruby`  | 1.1.0                                 |
| JSON JRuby          | `json-jruby` | 1.5.0                                 |
| JSON Pure           | `json_pure`  | 1.6.6                                 |
| JSON gem            | `json`       | 1.6.6                                 |
| OkJson              | `okjson`     | Version packaged with MultiJson 1.3.2 |

I created a little app to benchmark each library that performs two functions 100,000 times and records the time taken. Said two functions are:

1. **[Writing]** Generates JSON for Ruby data structure:

   ```ruby
   {
     a: 2,
     b: (1..50).to_a, # i.e. an array of 1,2,3,4,5,6, ... ,49,50
     c: %w[asf xcvb sdfg sdf gfsd],
     d: {
       omg: 'hedfasgdsfg',
       wewr: 34,
       sfgjbsdf: %w[sdfg sdfgsdfgnj klj kj hkuih ui hu kjb bkj b sdfg],
     },
   }
   ```

2. **[Reading]** Parses this JSON:

   ```json
   {
     "a": 2,
     "b": [
       1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
       31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50
     ],
     "c": ["asf", "xcvb", "sdfg", "sdf", "gfsd"],
     "d": {
       "omg": "hedfasgdsfg",
       "wewr": 34,
       "sfgjbsdf": ["sdfg", "sdfgsdfgnj", "klj", "kj", "hkuih", "ui", "hu", "kjb", "bkj", "b", "sdfg"]
     }
   }
   ```

If you're interested you can grab the code here: [https://github.com/japgolly/WebServerBenchmark/tree/json_libraries](https://github.com/japgolly/WebServerBenchmark/tree/json_libraries)
You're free to read it, play with it, hack it, print it and eat it, make love to it; It's all good.

Finally, these tests were performed on a Q9550 with 8GB RAM running Arch Linux 64-bit.

```text
➤ uname -a
Linux golly-desktop 3.3.2-1-ARCH #1 SMP PREEMPT Sat Apr 14 09:48:37 CEST 2012 x86_64 Intel(R) Core(TM)2 Quad CPU Q9550 @ 2.83GHz GenuineIntel GNU/Linux
```

## Results: First Cut

The numeric axis represents number of seconds taken to perform 100,000 operations.
Less is better.

|                            | Linear Graph                                                                   | Logarithmic Graph                                                                |
| -------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| **MRI**                    | ![MRI linear graph](http://img688.imageshack.us/img688/1571/mrilinear.png)     | ![MRI logarithmic graph](http://img256.imageshack.us/img256/8228/mrilog.png)     |
| **JRuby (on Oracle Java)** | ![JRuby linear graph](http://img688.imageshack.us/img688/2128/jrubylinear.png) | ![JRuby logarithmic graph](http://img854.imageshack.us/img854/7482/jrubylog.png) |

Wow. Two things are immediately obvious:

1. OkJson is extremely slow on both Ruby implementations. Whatever its design goals, performance isn't one of them.
2. JRuby runs YAJL like my grandmother runs marathons.

I really thought JRuby would perform better. Maybe 1.7 will be better. I know the JRuby team expect significant performance gains; I wonder if they've implemented them yet... Let's try using the latest dev version of JRuby 1.7.0!

Also I think I'll try using JRuby 1.6.7 with the OpenJDK implementation of Java and see if that gives better results.

## Results: Lots of JRuby Love

> [!IMPORTANT]
> **Update 2012-04-23:** New JRuby library discovered, [see conclusion](#conclusion).

Alrighty, done. Here are the results: (**note:** using a logarithmic scale here again)

![All Ruby and JRuby benchmark results (bar chart)](http://img577.imageshack.us/img577/777/allbar.png)

And the same thing expressed differently:

![All Ruby and JRuby benchmark results (line chart)](http://img801.imageshack.us/img801/7089/allline.png)

Jeez, it's not getting much better for JRuby...

Ok, enough of this. Let's get rid of the council-working options _[hey, Aussies get that!]_ and just look at the feasible ones.

## Results: The Finalists

The numeric axis represents number of seconds taken to perform 100,000 operations.
Less is better.

![Finalist JSON libraries (bar chart)](http://img833.imageshack.us/img833/9600/significantbar.png)

![Finalist JSON libraries (line chart)](http://img440.imageshack.us/img440/7097/significantline.png)

## Conclusion

If you use **MRI**, use **`Oj`** unless you generate more JSON than you parse, in which case use **`YAJL`**.

If you use **JRuby**, you've only really got one choice: **`json-jruby`**. You can expect roughly the same performance with OpenJDK, Oracle Java and the latest dev build of JRuby.

> [!IMPORTANT]
> **Update 2012-04-23:** [jrjackson](https://github.com/guyboertje/jrjackson) for **JRuby** is approx **4x faster** than `json-jruby` and faster than MRI. If you use JRuby, you want this!!
