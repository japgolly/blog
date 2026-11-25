---
title: Releasing an App for Android - Part 2
pubDatetime: 2013-02-10T09:44:00.001+11:00
tags:
  - android
  - java
  - maven
  - programming
  - sbt
  - scala
description: "Part 2 of lessons from releasing my first Android app: free and paid editions, AdMob advertising, localisation, Proguard, signing, and Maven vs SBT."
---

Continuing on from [part 1](/blog/posts/2013/releasing-app-for-android-part-1)...

## 4. Free and Paid Editions.

The Google Play marketplace doesn't allow free & paid editions of apps. If you want free & paid editions you will need to manage and release two separate apps with separate package names.

To do this I decided to go with the mainstream approach, namely, creating a separate projects. If you have shared code without shared Android resources (unlikely) then you'd simply move the shared code out into its own project and include the resulting jar as a dependency in the free & paid projects. With Android it's similar, you create an APK library. Practically this means adding `android.library=true` to your library's project properties and changing its pom packaging from `apk` to `apklib`. The free/paid projects wont contain much but they will need their own AndroidManifests and a reference to the library in the project properties such as `android.library.reference.1=../library`. That's the gist of it.

One annoying thing is that, like a few things that have come out of the Android dev camp, it's a hack. The resulting library is basically just a zip of the resources and the _SOURCE CODE_. When you use an Android library in a top-level project it unzips, merges and recompiles the library code. How annoying. The reason is the generated `R.java` will produce different ids outside of the library, hence the recompilation. As far as I understand the system is therefore a quick hack. It might be fair enough - I don't know how much pressure the Android dudes are under or how well/poorly staffed they are. But technologically speaking is still a hack. Oh well. Make sure Scala incremental compilation is on as it takes a large bite of the build pain.

In retrospect it was a good thing that I saved this step until the end. The time to alter the build & structure (especially if you've got a working reference) near the end of the project will be much less than both the time spent by managing 3 separate projects instead of 1; and the time wasted by waiting on the extra compilation, dexing and proguard'ing.

**Tip #1:** Use a single project for as long as you can get away with but anticipate that towards the end you'll need a little time to split out library, free, and paid projects.

**Tip #2:** Anything edition-specific should be separated from anything shared. For example, create an ad banner layout and then `<include>` it rather than using an AdView directly. Later you can configure things so that the paid edition gets a NOP layout.

## 5. Advertising.

I started not knowing anything about ads. Basically I did this:

1. Sign up with AdMob.
2. Fill in all your bank details so they can pay you. You'll also need a merchant account with Google Play.
3. Add your app but don't give it a market URL yet. This allows you to get an ID that you can start using before you release.
4. AdMob doesn't just show you their own ads; they connect to other ad networks and can show you their ads too. That was surprising. Advantage us because it means that once you get ads working in your app and you want to use a different ad provider like InMobi or MobFox, you can just sign up with those guys, get your ID and plug it into AdMob on their website. No code changes required. You can even configure Admob to show ads from a combination of providers, or use different providers for certain countries.
5. Get the AdMob SDK and wire it into your project.
6. Follow the instructions on this page to integrate ads into your layout: <https://developers.google.com/mobile-ads-sdk/docs/admob/fundamentals>. Reading all those pages is a good idea.
7. Finally, if you want ads to refresh every 60 sec or so, don't do it in code; play around in the AdMob website and you'll find settings for it. You can also customise the appearance of ads on the website or in code.

Done.

Now I don't know much about how it all works yet but this is what I've gleamed:

- Every time an ad is shown to a user it's called an _“impression”_. You get nothing, $0.00, for impressions.
- Every time an ad is clicked you get something small like $0.03.
- RPM = _“Revenue Per Mile”_ = the amount of money you've made per 1000 impressions.
- Fill rate = Quote: _Fill rate represents the percentage of ad requests that satisfy the ad requests sent by the app. It is a measure of AdMob's ability to serve ads in your app with the existing inventory._
- You'll see eCPM everywhere, it stands for _“effective cost per mile”_. It's a metric indicating how effective/profitable a particular ad network has been for you _so far_. Don't freak out when AdMob says eCPM $0.00 when you first sign up, that just means you haven't had any clicks yet. The formula is `1000 x Cost-per-Click x Click-Through-Rate.`

And we've reached the boundary of my knowledge on the topic. Hope you enjoyed the tour.

**Tip #1:** Filter logcat by tag `“Ads”` to see all your AdMob logs.

**Tip #2:** Search the AdMob logs for your test device ID and then plug that into the `ads:testDevices` attribute of your view. From what I hear the AdMob support is notoriously bad so if you get in trouble with your account, it's far from easy to get it back online.

**Tip #3:** eCPM is a metric of how well an ad network has been for someone. It's not a setting that you need to configure (even though it looks that way from AdMobs UI).

## 6. Localisation.

Not much to say here. Android warns you constantly about externalising your strings which is good. It doesn't monitor your source code though. If paranoid or you have a large team, Eclipse can warn when it finds strings without something like `//$NON-NLS-1`. Checkstyle et al probably have a similar feature.

**Tip #1:** Either put non-translatable strings into a file called `donottranslate.xml` (seriously – Android Lint requirement) or give them an attribute `translatable="false"`.

**Tip #2:** A split to paid/free editions will introduce new strings. Consider this before sending out text for translation.

**Tip #3:** The marketplace description(s) will also need translation. Write and include that before sending out text for translation.

**Tip #4:** Your text is easier to manage when all in one place. Therefore don't include separate strings in the free/paid versions; put them all in the library project together then just reference them differently in each app. If you don't want to change the references then reference an alias and change the alias in each project. Example:

```xml
Library project:
  <string name="app_name_free">Bananas (free)</string>
  <string name="app_name_paid">Bananas (pro)</string>
  <string name="app_name">@string/app_name_paid</string>

Free project:
  <string name="app_name">@string/app_name_free</string>
```

**Tip #5:** Use the app in each language to spot-check the layout. Certain languages might need tweaking to look good. For example, a language like Japanese that doesn't use spaces might need a manual endline (`\n`) so that it doesn't end up with one character dangling and the word split across lines.

## 7. Proguard.

If you don't know what Proguard is, it's a tool that shrinks, "validates", optimises and obfuscates your binaries.

Scala on Android demands it.<br />
Optimisation is very slow.<br />
Obfuscation didn't seem to do very much to my app although it happily obfuscated my dependency libraries.

I managed to speed things up by having two proguard configs: dev & release. Turn off optimisation and obfuscation in the dev config and you will save a lot of time. With optimisation enabled it can take minutes at a time. I've uploaded my configs here: <https://gist.github.com/japgolly/4747423>

**Tip #1:** Reuse existing proguard configs.

**Tip #2:** Use separate dev & release proguard configs.

## 8. Signing.

Your app will need to be signed (and then zip-aligned, in that order) in order to release it. To sign it you need to have your own certificate that doesn't expire until at least 2033 (which isn't the best for security but I don't make the rules). It's a Java thing so just google `keytool` and you'll be done pretty quickly. You'll need to create and save 2 passwords: one for the key, one for the store. I generated mine with this command: _(tip: script it or purge it from shell history when done)_

```bash
keytool -genkey -v \
  -keystore <keystore filename> \
  -alias <keystore name> \
  -keyalg RSA -keysize 4096 -validity 10000 \
  -keypass 'xxxxxxxxxx' \
  -storepass 'yyyyyyyyyy'
```

Once you're done, make sure you backup your keys and passwords then it's time to integrate signing into your build. For a Maven project you need to weave a massive blob of shit into your poms in order to integrate signing and zip-align. They should be in a release profile and all up it comes to around 100 lines of XML (!). I don't remember how much I was able to refactor into my parent pom (as my project is multi-module) but I don't think it was all of it. I'll post all the Maven stuff shortly anyway. Most of the time spent on signing was getting Maven to work properly.

**Tip #1:** Either ditch Maven for something better, or make sure you copy a working Maven Android project that has signing. (I'll post my Maven stuff shortly.)

## 9. Build Automation.

Last but not least, we arrive at something that is actually important from day #1 of the coding period: build automation. Very important. Obviously. I used Maven and ended up creating a multi-module project which I'll post more on later. Suffice to say Maven gave me trouble, and cost me too much time. I want to switch to something else and I have my eye on [SBT](http://www.scala-sbt.org/).

I did some tests on SBT recently and the results supported the rumours that SBT is faster than Maven. A build of a single, simple Android project took 35 sec with Maven, verses the same project at 24 sec with SBT. That's a 31% saving. A clean build of my multi-module Maven project takes 2 minutes and I wonder how fast it would be with SBT. If I assumed flat 31% saving again, that's 120 sec down to 82 sec. Nice. I didn't investigate further because it's time-consuming and because I worry about Eclipse integration. I'm sure Eclipse + SBT = happy days, but it seems that Eclipse + ADT + SBT = pain. ADT is extremely inflexible and the sbt-android plugin is way too poorly documented for an SBT noob like me. If I changed the dir & file structure to suit ADT an expert might be able to modify the sbt-android build pretty easily but I can't. Also, it practically has a seizure if you give it a full AndroidManifest as it wants to create its own. I imagine that ADT wouldn't be too happy about that. Would loooooove to be shown the error of my ignorant ways here so if anyone knows, ping me.

Another thing is that Maven is archaic and verbose. Reuse between modules is impossible in some situations; there are 6-year-old bugs and feature requests for mixins that are still open... SBT on the other hand is concise and allows as much reuse as you can shake a stick at (and I can shake a stick at A LOT of reuse).

But any further bitching about Maven is just that at this point: bitching. So I'll suck it up and declare that though sweat and toil I've come to have a great multi-module Maven Android project setup with library, free/paid projects, and free/paid (instrumented) integration test projects working together, nuances coerced, effective for dev and release builds. I'll be posting it shortly.

## In Conclusion

Looking back on all these issues I can now see how it took 5 or 6 days to go from 95% dev complete to released, despite doing 0%-95% in 2 days. I'll be applying these lessons during my other Android projects and I hope it helps others _(yes you!)_ as well.
