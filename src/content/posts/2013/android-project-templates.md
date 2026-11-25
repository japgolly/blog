---
title: Android Project Templates
pubDatetime: 2013-02-19T08:54:00.000+11:00
tags:
  - android
  - java
  - maven
  - programming
  - scala
description: Three Maven and Eclipse compatible Android project templates for Java, single-app Scala, and dual free/paid Scala editions.
---

Today I'd like to share some templates I've made for creating Android apps. They all use Maven and have been coerced into compatibility with Eclipse. There are a few different flavours which I will describe below. If you want to skip the reading and just want the code, np, it's all here: <https://github.com/japgolly/reference>.

## Template #1: Java

[Code available here](https://github.com/japgolly/reference/tree/master/android-java-maven-single).

This is the gist of what I use when I'm using Android + Java. It comes with a few add-ons to mitigate Java's verbosity and inflexibility and the fact that they all work together in harmony, even with Eclipse, well that's what makes this template gold. It took a while to get working way back when.

### Features

- **Lombok**: Integrated into both Maven and Eclipse.<br />
  Modified to play nice with Android, and added the ability to add `@Inject` to generated constructors.<br />
  _[What is Lombok?](http://projectlombok.org/)_

- **AndroidAnnotations**: Integrated into both Maven and Eclipse.<br />
  _[What is AndroidAnnotations?](http://androidannotations.org/)_

- **CoFoJa**: Contracts For Java provides annotations that can be used to verify pre-conditions, post-conditions and invariants. The validations are inherited so they're great for interfaces. Also they can be omitted from bytecode during compilation meaning you get more checking during tests and dev with no performance penalty in prod.<br />
  _[More about CoFoJa.](http://code.google.com/p/cofoja/)_

- **Unit testing**: Robolectric is being used for unit testing (along with an example of usage). I'm actually using a [test library of mine](https://github.com/japgolly/android-test-utils) (open-source) that includes Robolectric, FEST, Mockito and some Android-specific testing utilities.<br />
  _[What is Robolectric?](http://pivotal.github.com/robolectric/)_

- **Integration testing**: Robotium is being used for integration testing (along with an example of usage).<br />
  _[What is Robotium?](http://code.google.com/p/robotium/)_

- **Android Lint**: There's a profile that run Android Lint. Great for CI builds.

- **Findbugs**: Findbugs has been integrated (not that it was effort). What's nice is that I've included a rules file to exclude certain Android-specific warnings. I'm a nice guy.

- **Proguard**: Dev & release configs for Proguard are included.

- **Release**: A release profile is included that runs Proguard, signs artifacts, and runs zipAlign.

- **AdMob**: It's in there, ready to go but can also be deleted just as easily if you don't want it.

- **Eclipse settings**: Auto-format on save. Auto-organise-imports on save. A `TODOC` tag for doco todos. More.

## Template #2: Scala

[Code available here](https://github.com/japgolly/reference/tree/master/android-scala-maven-single).

Here you can use Scala instead of Java to build your app. The introduction of Scala renders obsolete the need for Lombok and AndroidAnnotations which simplifies the build process. As above, everything in this build works from CLI with Maven, and within Eclipse.

### Features

- **Scala**: Scala app code. Scala unit tests. Scala integration tests. Scala proguard. Scala Eclipse. Scala everything!

- **Unit testing**: Robolectric is being used for unit testing (along with an example of usage). I'm actually using a [test library of mine](https://github.com/japgolly/android-test-utils) (open-source) that includes Robolectric, FEST, Mockito and some Android-specific testing utilities.<br />
  _[What is Robolectric?](http://pivotal.github.com/robolectric/)_

- **Integration testing**: Robotium is being used for integration testing (along with an example of usage).<br />
  _[What is Robotium?](http://code.google.com/p/robotium/)_

- **Android Lint**: There's a profile that run Android Lint. Great for CI builds.

- **Proguard**: Proguard is mandatory when Scala is used. Rules included so that Scala works. Dev & release configs for Proguard are included.

- **Release**: A release profile is included that runs Proguard, signs artifacts, and runs zipAlign.

- **AdMob**: It's in there, ready to go but can also be deleted just as easily if you don't want it.

NOTE: You cannot use Scala _and_ Java together because it wrecks Eclipse. If you're using VIM or some other editor inferior to mighty VIM, you'll be fine with both languages simultaneously, Maven can handle it, just don't expect a happy life using Eclipse.

## Template #3: Scala + Free/Paid Editions of Your App

[Code available here](https://github.com/japgolly/reference/tree/master/android-scala-maven-dual).

Same as the Scala template above except this time instead of having a single app, you have an Android library and two separate apps that extend it.

### Features

- **Everything in template #2**. See above.

- **Shared APK Library**: Anything shared between your free & paid apps will live in the shared library. It's an Android library so resources can be shared too.

- **Separate Apps**: Your free and paid apps are separate apps that extend the shared library. Additional code and/or resources can be dropped in as necessary.

## Usage

To use one of these templates just copy the entire folder (and ensure you capture files starting with `.`). Next use the [find_template_values.sh](https://github.com/japgolly/reference/blob/master/find_template_values.sh) script to find places in the project where you need to swap out example values for real values. There's also a helper script, [replace.sh](https://github.com/japgolly/reference/blob/master/replace.sh) that you can use to perform recursive, mass regex replacements.

To load your project into Eclipse, simply hit _File_ → _Import..._ → _Existing Projects into Workspace_. All the required Eclipse settings and files are already there in the template.

Enjoy.
