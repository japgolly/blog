---
title: Releasing an App for Android - Part 1
pubDatetime: 2013-02-08T12:01:00.002+11:00
tags:
  - android
  - java
  - programming
  - release
  - scala
description: "Part 1 of lessons from releasing my first Android app (BPM Tapper): Android completeness, multi-density layouts, using Scala on Android, and vector artwork."
---

Last week I decided I would create a little micro Android app and release it so that I could get experience with the process. I recently came to the opinion that it's a good idea to hit learning curves with something small first rather than attempting both “big” and “new” at the same time. So I created an Android app called [BPM Tapper](https://play.google.com/store/apps/details?id=com.beardedlogic.bpm.free). What I found surprising was that I went from vague idea to 95% code complete in 2 days, but then it took another 5 or 6 days to get it released.

Now, my goal here with this blog post is twofold. Firstly, to document what I went through releasing my first Android application so that in future I remember everything that needs to be done; great for planning. Secondly, I want to document tips and strategies to improve next time.

## 1. Android Completeness

By _Android Completeness_ I'm referring to things that are either required or expected of common Android applications. The tasks I came across are as follows.

### 1.1. Inspecting Android Lint warnings.

This is an easy one. The Android SDK provides a lint tool that analyses your compiled code and resources, and creates a list of warnings. Not all Lint warnings are correct but they all should be vetted and resolved if necessary.

### 1.2. Handling interruption.

Your app can be interrupted at any time, e.g. if the phone gets a call while your app is in use, the OS will kick your app out and data will be lost if you don't handle it. Therefore if you don't want users to lose their on-screen state when using your app (or changing orientations), you generally need to implement two methods in your activities. `onRestoreInstanceState` and `onSaveInstanceState`. Scala made this really simple; case classes are serialisable so one simply calls `Bundle.[get|put]Serializable`. Example:

```scala
val measure = savedInstanceState .getSerializable(BUNDLE_KEY_MEASURE).asInstanceOf[Measure]
```

Too easy.

### 1.3. Integrating with the [Android Backup Manager](http://developer.android.com/guide/topics/data/backup.html).

My app is stateless so I just flipped the `allowBackup` switch off in the `AndroidManifest` and didn't have the need to write any code here, but it is something to be aware of. It's easy to forget but very important for stateful apps.

### 1.4. Supporting multiple screen densities.

Different phones have different screen densities and you should at least be targeting support for MDPI through to XHDPI. Different screen densities (loosely) require different copies of your graphics at different sizes. This wasn't a problem for me because I create all my graphics in SVG and have a script to convert them to PNGs using ImageMagick. (See the Artwork section for such a script.)

### 1.5. Providing landscape layouts.

Not mandatory but I've seen quite a few reviews on the marketplace where people get quite passionate (read: vehement) about not being able to turn their phone on its side. Personally I don't see why it's such a big deal but I'm not everyone. Creating a new layout for landscape-mode and having it coexist is easy. However, _designing_ the landscape UI that is pleasing and effective is the time-consuming part.

**Tip #1:** Always use something like Inkscape to create the screen before you hit the code. Use real sizes and colours. Don't assume and leave out anything that you plan to do in code later.

**Tip #2:** Commit to doing this to all screens in your app up-front, or no none at all. Or do some. But make that decision early on and ensure you can make it work. You don't want to create 8 landscape layouts then later come across a few that won't work then decide to scrap the entire landscape orientation ability.

### 1.6. Ensuring layouts look acceptable in various conditions.

This means compiling a testing matrix of relevant attributes such as:

- Screen size.
- Screen density.
- Screen orientation.
- Android version.
- Ads vs no-ads (they do take up valuable screen space).
- Language.

This is pain. The theory is simple right? The screen will look different depending on each factor above. You want your beloved app to look great on all users' phones.

Screen density I've addressed above. That, language and Android API version can just be eyeballed manually I think. No need to give them their own axis in a matrix. But I did want a matrix of ads-or-not, orientation, and screen size. What was annoying is that screen size is not screen size. There are resource qualifiers for screen size, namely `small`, `normal`, `large`, `xlarge`. Now they didn't work as expected for me. Due to my immense frustration and exhaustion at the time, I don't remember the details but I found them not aligning with my expectations at all. Instead I decided to use screen density to create different settings for different screen sizes, because there is a strong correlation between density and screen size anyway. I mean, no one has a 1200x800 LDPI phone. It doesn't exist. Thus I used a test matrix like this:

|          | ads (port) | ads (land) | no ads (port) | no ads (land) |
| -------- | :--------: | :--------: | :-----------: | :-----------: |
| **ldpi** |     ✓      |     ✓      |       ✓       |       ✓       |
| **mdpi** |     ✓      |     ✓      |       ✓       |       ✓       |
| **hdpi** |     ✓      |     ✓      |       ✓       |       ✓       |
| **xdpi** |     ✓      |     ✓      |       ✓       |       ✓       |

**Tip #1:** Create a test matrix and use it to ensure things look good.

**Tip #2:** Eyeball the smallest screen sizes once in each language. Button widths can be twice as long as English depending on the target language which may cause side-effects with your layouts.

**Tip #3:** Always start with the lowest density and work your way up. A MDPI screen will choose `values-ldpi/` over `values/` if it exists and `values-mdpi/` doesn't.

**Tip #4:** Don't trust the screen heights you can choose in the ADT layout editor. I have an old HTC Magic that has around 100dp less height than the closest config available from the editor.

**Tip #5:** Do not leave any hardcoded dimensions in your layout XML (_obvious_) or your `styles.xml` (_not obvious_). When adjusting for each screen it's going to be the dimensions like the text sizes, the padding & margin sizes that you'll be adjusting.

**Tip #6:** Do your utmost, do your friend's utmost (!) to avoid using dimensions to affect the layout itself. For example, a dimension for the margin between elements is one thing but if you want a large river of negative space, don't use dimensions, anchor both sizes of the space to stuff so that the river size is organic. This makes for more consistent layouts on different devices and means you won't have to adjust the value for different screens.

## 2. Scala.

Learn it! Use it! It is a brilliant language. It allows you to write better code, more concisely. There is so much boilerplate bullshit that Java requires, so many hoops to jump through, and so many obstacles that prevent you writing the kind of code that you (well, I) want to. Scala does away with nearly all of those! Its strong focus on immutability, functions, maximum code reuse (yay for multiple inheritance again!) and conciseness, not to mention all the other modern goodness such as pattern matching/partial functions; for comprehensions; case classes; implicit conversions, classes, and parameters... The list goes on. It's very productive language and you will be more productive with it.

Like anything it does have it's shortcomings though: flaky IDE support, slow compilation time, WTF-inducing stacktraces, controversial lack of binary compatibility between major versions (which doesn't bother me at all actually), massive stdlib that Android can't handle without proguard, too many custom operators at times (look at SBT with its `<+= <<= ++= <++=` etc, good god!).

But all in all, Scala is worth it. IDE support will continue to improve and compilation time and stdlib modularisation should be fixed later this year.

Scala can especially be a godsend when it comes to cutting out Android/Java repetition. Consider this Java:

```java
protected TextView nameView;
protected void onCreate(Bundle savedInstanceState) {
    ...
    nameView = (TextView) findViewById(R.id.name);
}
```

And now consider this Scala:

```scala
lazy val nameView = find[TextView](R.id.name)
```

Here's another example. Java:

```java
view.setOnClickListener(new OnClickListener() {
    @Override
    public void onClick(View view) {
        onDelete();
    }
});
```

Verses Scala:

```scala
view.setOnClickListener( onDelete _ )
```

Scala also saved me time on the testing front. Your test code becomes amazing when you can use traits for multiple inheritance, and write methods that accept lambdas or Ruby-style blocks. You'll end up with something approaching a testing DSL before you know it, and most of your test cases will be under 3 lines which certainly taking the wind of the sails of any test-case-writing-laziness.

**Tip #1:** Use an incremental compiler for Scala. With the scala-maven-plugin this is a single config item.

**Tip #2:** Copy a proguard.cfg with Scala settings and set your build to always use proguard.

**Tip #3:** Use traits to create collections of test helper code. Do as little directly as possible in your immediate test case code.

**Tip #4:** Use implicit conversions for all things Android.

**Tip #5:** Create an ActivityHelperTrait or similar and load it up with implicit value classes and inlined helper methods. Example:

```scala
@inline def find[T <: View](resId: Int): T = findViewById(resId).asInstanceOf[T]
```

## 3. Artwork.

Get in the habit of using vector-based graphics and using ImageMagick's `convert` tool (it's command-line). Vector graphics look great at any size and you can `convert` to generate bitmaps at various sizes (which Android needs). If you want you can use SVGs directly in Android with [svg-android](https://github.com/japgolly/svg-android) but there are still places where you need fixed-size images.

You will need to create or procure a visual to use as your application icon before release. Ensure you have it as an SVG (or some other vector-based format) then use ImageMagick to create various sizes. The marketplace requires 512x512, where as your app requires 36x36, 48x48, 72x72, 92x92 for ldpi, mdpi, hdpi and xhdpi respectivelly.

For all kinds of visuals you'll need to have multiple copies in separate sizes to support different screen densities. I wrote a Ruby script to convert all my visuals. Here is an except of that script:

```ruby file="convert_artwork.rb"
DENSITIES= {
  '-mdpi' => 1.0,
  '-ldpi' => 0.75,
  '-hdpi' => 1.5,
  '-xhdpi' => 2.0,
}

def run_cmd(cmd)
  puts cmd
  system cmd
  raise unless $?.success?
end

# Inc/Dec buttons
if ARGV.include?('incdec')
  DENSITIES.each {|dname, dfactor|
    density= 38*dfactor
    %w[inc dec].each {|name|
      %w[default pressed].each{|state|
        svg= "btn_#{name}_#{state}.svg"
        out= "res/drawable#{dname}/btn_#{name}_#{state}.png"
        run_cmd "convert -background none -density #{density} #{svg} PNG32:#{out}"
      }
    }
  }
end
```

**Tip #1:** Use 32-bit PNGs if you want an alpha channel.

**Tip #2:** ImageMagick will be your best friend for conversion. Script it.

**Tip #3:** Inkscape is a great tool. Very easy to use and everything is vector-based.

**Tip #4:** There are plenty of good-looking, vector-based visuals out there that are public-domain. There are also sites like [The Noun Project](http://thenounproject.com/) that have brilliant visuals that you can usually use free as long as you attribute the author, or can buy cheaply.

## To be continued...

I have 6 more points. Read about them [in part 2](/posts/2013/releasing-app-for-android-part-2).
