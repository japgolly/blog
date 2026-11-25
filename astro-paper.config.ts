import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://astro-paper.pages.dev/", // TODO
    title: "@japgolly Tech Blog",
    description: "A tech blog, mostly about Scala.",
    author: "David Barri (@japgolly)",
    // profile: "https://satna.ing",
    ogImage: "default-og.jpg",
    lang: "en",
    timezone: "Australia/Melbourne",
    dir: "ltr",
  },
  posts: {
    perPage: 10,
    perIndex: 10,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: false,
    },
    search: "pagefind",
    toc: true,
  },
  socials: [
    { name: "github",   url: "https://github.com/japgolly/" },
    { name: "linkedin", url: "https://www.linkedin.com/in/dbarri/" },
    { name: "mail",     url: "mailto:japgolly@gmail.com" },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x",        url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
