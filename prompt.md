

I have been building the `study-mandarin` app for a little while now. But it is becoming a bit larger and I think it needs to become a Nextjs app.

1. Create a new empty NextJS app
2. A design system 

## The design system 

The system needs to have a similar word, character, and phrase component. This will be able to be displayed with zhuyin on the right, pinyin on top, and english underneath. It should be able to display any subset of that text without changing the size. It should be able to easily change between a few fonts. It should be able to reveal based on hover, click, or parent instruction. Do not just make props for each of these features, really think about how it will get done.

After that we need a global header, styles for `h1`, `h2`, etc.

Page level things too.

Checkboxes, buttons, the usual stuff.

I would like the design system to have dark and light mode built in. The dark mode is the neon theme, seen in `study-mandarin`. The light mode is the bamboo theme seen in `bamboo`.

## Data and hosting

Lets host this on vercel. lets have a public data folder that can be found on the public github repo. lets access that to source data so I can easily change things without rebuilding. ensure that folder does not trigger rebuilds.

## Chrome extension

There is a chrome extension related to this app, we will worry about it later