---
title: "Problems with at_exit{}, exit(), and RSpec"
pubDatetime: 2012-09-12T14:47:00.001+10:00
tags:
  - programming
  - ruby
description: Why Ruby at_exit cleanup hooks can clobber $! and cause RSpec to return exit code 0 on test failures, and a helper method to preserve the exit status.
---

I had an interesting problem the other day, working on a Ruby project of mine. I ran my tests:
(_note: I have "`rak`" aliased to "`bundle exec rake`"_)

```bash
rak test
```

which internally expands to the equivelent of:

```bash
rak test:spec test:int
```

which runs my specs and integration tests in that order.

Then an odd thing happened. My specs failed but then the integration tests ran anyway and scrolled the spec failure off the screen to report happy success. After some digging around I discovered the following:

- I'd had this test failure for a few commits without noticing.
- My CI builds on Travis CI were all reporting success (although the failure message was there in the build logs should one manually check.)
- Rake itself and RSpec's rake task were both fine.
- Running my tests directly with the `rspec` CLI, I was getting an exit code of 0 on both success and failure.

## The Problem

RSpec was returning an error/exit/status code of 0 despite test failure. It should be non-zero so that external processes like Travis CI and Rake can determine that something's gone wrong and react accordingly.

I'm going to cut a tedious story down to the result here. After investigation I learned that `rspec` worked as expected again when I avoided this piece of code in my tests:

```ruby file="prob.rb"
def dynamic_fixture_root
  $gu_dynamic_fixture_root || DYNAMIC_FIXTURE_ROOT_LOCK.synchronize {
    $gu_dynamic_fixture_root ||= (
      at_exit {
        FileUtils.remove_entry_secure $gu_dynamic_fixture_root if $gu_dynamic_fixture_root
        $gu_dynamic_fixtures= $gu_dynamic_fixture_root= nil
      }
      Dir.mktmpdir
    )
  }
end
```

What this piece of code does is:

1. create a temporary directory the first time it's called
2. reuse that temporary directory on subsequent calls
3. remove the directory at the end of the process's lifecycle

Why does that affect RSpec returning non-zero on failure? Because RSpec itself doesn't run immediately; it wants to wait until all of your specs have been loaded first. The way it accomplishes that is it registers itself to run via an `at_exit` block and then calls `exit` when it's finished with your specs. Still sounds like there's no problem right? Well this is what happens from that point on...

1. RSpec finishes running tests and calls `exit` with 0 for success or 1 for failure.
2. Accordingly, Ruby creates an instance of `SystemExit` and plonks it into the `$!` global variable.
3. Now that the process is shutting down, my `at_exit` in the snippet above starts running.
4. My cleanup code (correctly, validly and legally) runs Ruby's `FileUtils.remove_entry_secure` to remove the temporary directly created during tests. This isn't a problem in itself.
5. Here's the gotcha: `FileUtils.remove_entry_secure` removes the directory and sets `$!` to `nil` to indicate that no exception occurred.
6. Ruby ends the process and sets the exit code to the result of `$!.status` which was lost in the previous step.

## The Solution

That was the problem. Now what's the solution?
Simple. Just take care to preserve the exit status in your `at_exit` so that it ends with what it started with. Here is a helper method that I created:

```ruby file="soln.rb"
# This file is available in: https://raw.github.com/japgolly/golly-utils

module Kernel

  # Alternate implementation of `at_exit` that preserves the exit status (unless you call `exit` yourself and an error
  # is raised).
  #
  # The initial driver for this was that using `at_exit` to clean up global resources in RSpec tests, RSpec's exit
  # status would be lost which means CI processes and such were unable to tell whether there were test failures.
  #
  # @return [Proc] Whatever `at_exit` returns.
  def at_exit_preserving_exit_status(&block)
    at_exit {
      status= $!.is_a?(::SystemExit) ? $!.status : nil
      block.()
      exit status if status
    }
  end
end
```

(You can also view this file [directly on Github in a utility library of mine](https://github.com/japgolly/golly-utils/blob/master/lib/golly-utils/ruby_ext/kernel.rb).)

Then the solution becomes simply use `at_exit_preserving_exit_status` instead of `at_exit` in first snippet, and everything works again! Happy days!

## TL;DR: Conclusion

Be careful that you don't corrupt the value of `$!` when using `at_exit`. If you're not careful (or don't use a handy, safe function like presented above), then you can corrupt the exit status of RSpec in particular, and other libraries that work in a similar fashion.
