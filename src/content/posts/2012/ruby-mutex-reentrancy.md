---
title: Ruby Mutex Reentrancy
pubDatetime: 2012-04-23T10:00:00+10:00
tags:
  - ruby
  - jruby
  - programming
  - benchmarks
description: Discovering that Ruby's Mutex is not reentrant, using Monitor instead, and benchmarking the performance trade-off across MRI and JRuby.
---

This morning I was making some Ruby code of mine thread-safe which is always fun. (I'm serious btw. I frikking love multithreaded programming!) In doing so I came across something that I found a bit surprising.

Consider the following snippet:

```ruby file="reentrancy-mutex.rb"
require 'thread'

m= Mutex.new
m.synchronize {
  m.synchronize {
    puts "Mutex is reentrant."
  }
}
```

Think it will work?

Let's try...

```text
<internal:prelude>:8:in `lock': deadlock; recursive locking (ThreadError)
 from <internal:prelude>:8:in `synchronize'
 from reentrancy.rb:5:in `block in <main>'
 from <internal:prelude>:10:in `synchronize'
 from reentrancy.rb:4:in `<main>'
```

**Shocking!**

Mutex is not reentrant. Wow. Ok. Let's try something else...

Let's change that `Mutex` into a `Monitor` and try again.

```ruby file="reentrancy-monitor.rb"
require 'monitor'

m= Monitor.new
m.synchronize {
  m.synchronize {
    puts "Monitor is reentrant."
  }
}
```

Alrighty, let's put on fresh underwear and give it a whirl...

```text
Monitor is reentrant.
```

Ah, the world makes sense again. If I had to code my own reentrancy I would've cried and hated Ruby a little bit. My love and faith in Ruby remains, yay!

## Is There A Cost?

Nothing is free. Is there a performance penalty? Time for some benchmarks.

Here is a little benchmarking script that acquires and releases both a mutex and monitor 1 million times each:

```ruby file="reentrancy-benchmark.rb"
require 'benchmark'
require 'thread'
require 'monitor'

mutex = Mutex.new
monitor = Monitor.new
nop = proc{}
range = 1..1_000_000

Benchmark.bm(10) do |x|
  x.report('Mutex')  { for i in range; mutex.synchronize   &nop end }
  x.report('Monitor'){ for i in range; monitor.synchronize &nop end }
end
```

Benchmarking results:

```text
                 user     system      total        real
Mutex        0.400000   0.000000   0.400000 (  0.406259)
Monitor      0.870000   0.010000   0.880000 (  0.864888)
```

Ouch, monitor takes over the double the time that mutex does. That's the trade-off.

## What About JRuby

I'm curious, let's try JRuby too. We'll change `bm` to `bmbm` and fire it up.

```text
Rehearsal ---------------------------------------------
Mutex       0.571000   0.000000   0.571000 (  0.539000)
Monitor     2.012000   0.000000   2.012000 (  2.012000)
------------------------------------ total: 2.583000sec

                user     system      total        real
Mutex       0.321000   0.000000   0.321000 (  0.321000)
Monitor     1.696000   0.000000   1.696000 (  1.696000)
```

Wow, Monitor is 5.3x slower when using JRuby!!! Hmmm, I suspect JIT just need more time to warmup. Here's a new benchmarking script with a big warmup:

```ruby file="reentrancy-benchmark-jruby.rb"
require 'benchmark'
require 'thread'
require 'monitor'

mutex = Mutex.new
monitor = Monitor.new
nop = proc{}
range = 1..1_000_000

for j in 1..20
  puts "Warmup ##{j}/20"
  for i in range; mutex.synchronize   &nop end
  for i in range; monitor.synchronize &nop end
end
puts

Benchmark.bm(10) do |x|
  x.report('Mutex')  { for i in range; mutex.synchronize   &nop end }
  x.report('Monitor'){ for i in range; monitor.synchronize &nop end }
end
```

And the results:

```text
> jruby --1.9 --fast reentrancy-benchmark-jruby.rb
Warmup #1/20
...
Warmup #20/20
                user     system      total        real
Mutex       0.357000   0.000000   0.357000 (  0.357000)
Monitor     0.768000   0.000000   0.768000 (  0.768000)
```

Ok, that's on-par with the MRI results. Mutex is fast off-the-bat with JRuby where as Monitor will be a lot slower at first then decrease to a little over double the speed of mutex.

## Conclusion

- **Mutex:** No reentrancy. Fast, less than half the speed of Monitor.
- **Monitor:** Reentrancy. Slow, little over twice as slow as Mutex.
