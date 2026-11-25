---
title: "Testing Scala.JS on Firefox & Chrome from SBT"
pubDatetime: 2016-03-20T16:04:00.001+11:00
tags:
  - sbt
  - scala
  - scalajs
  - testing
description: How to integrate scala-js-env-selenium into an SBT project to run Scala.JS unit tests headlessly on real Firefox and Chrome browsers without recompiling.
---

It's been fantastic being able to write Scala and compile it to JavaScript thanks to [Scala.JS](http://www.scala-js.org/). Going further, Scala.JS lets you write accompanying unit tests, run them from SBT, and choose a target environment from {Rhino, Node.JS, Phantom.JS}. If you needed DOM in your testing, your only option was Phantom.JS which seems great at first but—because it only simulates DOM—you soon discover that there are many cases in which its behaviour diverges from normal browsers (eg. DOM types for `<td>` tags), or isn't supported at all (text selection, anything to do with focus, more). Oh, and it's also riddled with bugs, many significant and long-standing. So while Phantom.JS's effort is appreciated, it's no substitute for a real browser. This was where the story ended until very recently.

Recently, the Scala.JS team released [scala-js-env-selenium](https://github.com/scala-js/scala-js-env-selenium) which allows you to use [Selenium](http://www.seleniumhq.org/) in the same way you would the other JS environments. That means that Scala.JS can now interface with _real_ browsers, namely Firefox and Chrome. Awesome!

The next step, and the purpose of this blog post, is to effectively integrate it into your SBT/Scala/Scala.JS project.
Let me tell you about my ideal environment and then I'll show you how to achieve it.

## Goals

In my ideal environment:

- I write my Scala.JS unit tests the same way I already do, and I can continue to run them against Node.JS or Phantom.JS because it's fast. No changes there.
- To run tests against Firefox or Chrome, I simply prefix my SBT command with `firefox:` or `chrome:`.<br />For example, `firefox:test` would run tests in Firefox, `chrome:testOnly a.b.c` would run my `a.b.c` test in Chrome.
- Testing in FF/Chrome doesn't require recompilation _(All in the Land know Scalac is slow)_. It should use all of the same bits and bobs (especially the output JS) that normal tests use.
- I specify that certain tests will only run in FF and/or Chrome.<br />For example, tests that use focus should skip Phantom.JS where I know focus doesn't work.
- I run `testAll` to run the same tests in all environments (fast-env & Firefox & Chrome). This will happen concurrently.
- I can use FF/Chrome headlessly (i.e. without the windows popping up when the browsers are launched and running).

## 1. Selenium support.

Add this to your `project/plugins.sbt`:

```scala
libraryDependencies += "org.scala-js" %% "scalajs-env-selenium" % "0.1.1"
```

Then install [ChromeDriver](https://sites.google.com/a/chromium.org/chromedriver/) which is needed so that Selenium can interface with Chrome.

## 2. General SBT Config

Create a file called `project/InBrowserTesting.scala` with the following content:

```scala file="InBrowserTesting.scala"
import sbt._
import sbt.Keys._
import org.scalajs.sbtplugin.ScalaJSPlugin.autoImport._
import org.scalajs.sbtplugin.cross.CrossProject
import org.scalajs.sbtplugin.ScalaJSPluginInternal._
import org.scalajs.jsenv.selenium._

object InBrowserTesting {

  lazy val testAll = TaskKey[Unit]("test-all", "Run tests in all test platforms.")

  val ConfigFirefox = config("firefox")
  val ConfigChrome  = config("chrome")

  private def browserConfig(cfg: Configuration, env: SeleniumJSEnv): Project => Project =
    _.settings(
      inConfig(cfg)(
        Defaults.testSettings ++
        scalaJSTestSettings ++
        Seq(

          // Scala.JS public settings
          checkScalaJSSemantics         := (checkScalaJSSemantics         in Test).value,
          emitSourceMaps                := (emitSourceMaps                in Test).value,
          fastOptJS                     := (fastOptJS                     in Test).value,
          fullOptJS                     := (fullOptJS                     in Test).value,
          jsDependencies                := (jsDependencies                in Test).value,
          jsDependencyFilter            := (jsDependencyFilter            in Test).value,
          jsDependencyManifest          := (jsDependencyManifest          in Test).value,
          jsDependencyManifests         := (jsDependencyManifests         in Test).value,
          jsManifestFilter              := (jsManifestFilter              in Test).value,
       // loadedJSEnv                   := (loadedJSEnv                   in Test).value,
          packageJSDependencies         := (packageJSDependencies         in Test).value,
          packageMinifiedJSDependencies := (packageMinifiedJSDependencies in Test).value,
          packageScalaJSLauncher        := (packageScalaJSLauncher        in Test).value,
          persistLauncher               := (persistLauncher               in Test).value,
          relativeSourceMaps            := (relativeSourceMaps            in Test).value,
          resolvedJSDependencies        := (resolvedJSDependencies        in Test).value,
       // resolvedJSEnv                 := (resolvedJSEnv                 in Test).value,
       // scalaJSConsole                := (scalaJSConsole                in Test).value,
          scalaJSIR                     := (scalaJSIR                     in Test).value,
          scalaJSLauncher               := (scalaJSLauncher               in Test).value,
          scalaJSLinkedFile             := (scalaJSLinkedFile             in Test).value,
          scalaJSNativeLibraries        := (scalaJSNativeLibraries        in Test).value,
          scalaJSOptimizerOptions       := (scalaJSOptimizerOptions       in Test).value,
          scalaJSOutputMode             := (scalaJSOutputMode             in Test).value,
          scalaJSOutputWrapper          := (scalaJSOutputWrapper          in Test).value,
          scalajsp                      := (scalajsp                      in Test).inputTaskValue,
          scalaJSSemantics              := (scalaJSSemantics              in Test).value,
          scalaJSStage                  := (scalaJSStage                  in Test).value,

          // Scala.JS internal settings
          scalaJSClearCacheStats := (scalaJSClearCacheStats in Test).value,
          scalaJSEnsureUnforked  := (scalaJSEnsureUnforked  in Test).value,
          scalaJSIRCacheHolder   := (scalaJSIRCacheHolder   in Test).value,
          scalaJSIRCache         := (scalaJSIRCache         in Test).value,
          scalaJSLinker          := (scalaJSLinker          in Test).value,
          scalaJSRequestsDOM     := (scalaJSRequestsDOM     in Test).value,
          sjsirFilesOnClasspath  := (sjsirFilesOnClasspath  in Test).value,
          usesScalaJSLinkerTag   := (usesScalaJSLinkerTag   in Test).value,

          // SBT test settings
          definedTestNames     := (definedTestNames     in Test).value,
          definedTests         := (definedTests         in Test).value,
       // executeTests         := (executeTests         in Test).value,
       // loadedTestFrameworks := (loadedTestFrameworks in Test).value,
       // testExecution        := (testExecution        in Test).value,
       // testFilter           := (testFilter           in Test).value,
          testForkedParallel   := (testForkedParallel   in Test).value,
       // testFrameworks       := (testFrameworks       in Test).value,
          testGrouping         := (testGrouping         in Test).value,
       // testListeners        := (testListeners        in Test).value,
       // testLoader           := (testLoader           in Test).value,
       // testOnly             := (testOnly             in Test).value,
          testOptions          := (testOptions          in Test).value,
       // testQuick            := (testQuick            in Test).value,
          testResultLogger     := (testResultLogger     in Test).value,
       // test                 := (test                 in Test).value,

          // In-browser settings
          jsEnv           := env,
          requiresDOM     := true)))

  def js: Project => Project =
    _.configure(
      browserConfig(ConfigFirefox, new SeleniumJSEnv(Firefox())),
      browserConfig(ConfigChrome, new SeleniumJSEnv(Chrome())))
    .settings(
      testAll := {
        (test in Test         ).value
        (test in ConfigFirefox).value
        (test in ConfigChrome ).value
      })

  def jvm: Project => Project =
    _.settings(
      testAll := (test in Test).value)

  def cross: CrossProject => CrossProject =
    _.jvmConfigure(jvm).jsConfigure(js)
}
```

This creates SBT configurations for each browser, then delegates most of the settings to the `test:*` settings.

## 3. Project-specific SBT config

Next you need to look at your existing SBT build settings.

For each cross-JVM/JS project, add:

```scala
  .configure(InBrowserTesting.cross)
```

For each JS-only project, add:

```scala
  .configure(InBrowserTesting.js)
```

For each JVM-only project, add:

```scala
  .configure(InBrowserTesting.jvm)
```

You might be wondering why JVM projects need any configuration at all. It's so that when `testAll` is run from a JVM project or the root project, you want it to run the JVM tests. Without this setting, `testAll` in a JVM project would do nothing at all, and `testAll` from the root would only run the JS tests.

## 4. Environment-Dependent Tests

I often forget that I'm writing JS when I write Scala.JS. As we're in JS land, to determine our environment all we have to do is check the user-agent.

```scala file="JsEnvUtils.scala"
import scala.util.Try
import scalajs.js.Dynamic.global

object JsEnvUtils {

  /** Sample (real) values are:
    * - Mozilla/5.0 (Unknown; Linux x86_64) AppleWebKit/538.1 (KHTML, like Gecko) PhantomJS/2.1.1 Safari/538.1
    * - Mozilla/5.0 (X11; Linux x86_64; rv:45.0) Gecko/20100101 Firefox/45.0
    * - Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.75 Safari/537.36
    */
  val userAgent: String =
    Try(global.navigator.userAgent.asInstanceOf[String]) getOrElse "Unknown"

  // Check each browser
  val isFirefox = userAgent contains "Firefox"
  val isChrome  = userAgent contains "Chrome"

  val isRealBrowser = isFirefox || isChrome

  // Or you can even just check if running in X
  val isRunningInX = userAgent contains "X11"
}
```

How you skip tests depends on the test framework you're using but all you have to do is put something like this in your test code:

```scala
  if (JsEnvUtils.isRealBrowser) {
    // test here
  } else {
    // skip
  }
```

## 5. Headlessness

Super simple (unless you're a Windows user). Install xvfb, "X Virtual FrameBuffer", which starts X without a graphics display.

Here are two different ways you can use it:

1. Either start it in a separate window via

   ```bash
   Xvfb :1
   ```

   or in the background

   ```bash
   nohup Xvfb :1 &
   ```

   then launch SBT like this:

   ```bash
   DISPLAY=:1 sbt
   ```

2. This tip comes from danielkza _(thanks!)_.
   You can simply prepend your SBT command with `xvfb-run -a` to have an X server spun up on demand without the need to start it yourself. Beware though, that `xvfb-run` is [a bit naive](https://github.com/revnode/xvfb-run/blob/master/xvfb-run#L85-L97) and [susceptible to race conditions](http://stackoverflow.com/questions/30332137/xvfb-run-unreliable-when-multiple-instances-invoked-in-parallel) so while it'll be fine on your local machine, it may cause you problems on your CI server or similar.

You'll no longer see any Firefox and Chrome windows; all your output just appears in the SBT console as usual. Too easy.

_Note: The `:1` indicates the X display-number, which is a means to uniquely identify an X server on a host. The `1` is completely arbitrary—you can choose any number so long as there isn't another X server running that's already associated with it._

## Done.

All goals described are thus achieved.<br />
I hope you found this helpful.<br />
Happy coding!
