# Feelings Wheel

A feelings wheel you can actually use — in a therapy session on your phone, or
at your laptop between them.

It is the Geoffrey Roberts wheel: 7 core emotions, 41 more specific words, 130
in total, each with a plain-English definition. You can log what you felt, when,
and what was going on, then read a summary of everything since your last
session.

**Everything stays on your device.** There is no account, no server, and no
database — not as a promise, but as an architecture. Your entries live in your
browser's own storage and move between devices only as a file you carry
yourself.

---

## What it does

- **Tap through the wheel.** Tap a core emotion and it expands to fill the
  screen, showing its more specific words. The other six compress into a collar
  you can tap to switch. The browser's back button closes it again.
- **Choose how much it shows at rest.** The default is the whole wheel — all 7
  core feelings and their 41 more specific words. In Settings you can switch to
  the 7 core feelings alone, which takes the smallest tap target from about 20px
  to 64px on a phone and opens onto 7 words instead of 48. Opening a feeling is
  identical either way.
- **Pick at any level.** Sometimes "Bad" is as precise as it gets, and that
  counts. You can save a core emotion, or refine it all the way to "Isolated".
- **Pick more than one.** Angry *and* ashamed *and* relieved is a normal
  afternoon. Refining a word replaces it rather than stacking, so you get one
  clear choice per feeling, not three overlapping ones.
- **Read what the words mean.** Every one of the 130 has a one-line definition
  written to distinguish it from its neighbours — the difference between guilty
  ("you did something you believe was wrong") and ashamed ("not that you did
  wrong, but that you are wrong").
- **Log it.** Optional tags, and a date you can change, so you can catch up on
  Tuesday for how you felt on Sunday.
- **Look back.** History newest-first, with everything editable and deletable.
- **Prepare for a session.** Mark the date of each session; the summary then
  covers exactly the stretch since the last one — which feelings, which words,
  what was going on.
- **Use it anywhere.** Installs to your home screen and works with no signal,
  which is the point in a basement therapy office.

## What it deliberately does not do

No intensity ratings, no free-text notes, no body map, no accounts, no sync
service, no reminders, no dark mode, no analytics. Each was considered and left
out. The entry format has room for a note if that turns out to be missed.

---

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm test           # unit tests
npm run lint
npm run build      # static files in dist/
npm run preview    # serve the production build
npm run icons      # regenerate the app icons (only after a design change)
```

## Deploying

The build is plain static files, so anything can host it. For Vercel: import the
repository, and the framework preset and `vercel.json` handle the rest. **It
must be served over HTTPS** — the offline install does not work otherwise.

---

## How it is put together

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite 8, TypeScript |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| Storage | `localStorage`, behind one module |
| Offline | `vite-plugin-pwa` (Workbox) |
| Tests | Vitest |

### The wheel

`src/lib/layout.ts` is the heart of it. `computeLayout(coreId)` returns an angle
and radius band for all 130 nodes in both the overview and the focused state,
and `lerpLayout` blends between them — so "the wedges tile the circle with no
gaps or overlaps" is a unit test rather than something you squint at.

Three decisions worth knowing if you change it:

- **Cores are sized by how many words they hold.** Happy has 9 secondary words
  and Bad has 4, so an even split would make Happy's words less than half as
  wide. By weight, every secondary wedge is identical and equally tappable.
- **Angles are never normalised into `[0, 2π)`.** A wedge straddling the top of
  the wheel would otherwise take the long way round when the wheel opens.
- **Labels run whichever way the wedge is roomier.** In the overview the rings
  are deep and the wedges narrow, so labels run outward; in the focused view it
  is the opposite and they follow the arc. "Surprised" does not fit across a
  focused core ring at any readable size. Type is uniform per ring, so a ring
  does not look ransom-noted.

The zoom writes SVG geometry straight to the DOM in a `requestAnimationFrame`
loop rather than re-rendering: path data cannot be CSS-transitioned, and pushing
130 wedges through React at 60fps is not something a phone should be asked to
do. React still owns colour and selection, and a layout effect re-asserts
geometry after every render so selecting a word cannot reset the zoom.

### The data

IDs are path-based (`sad.lonely.isolated`) because **labels are not unique** on
this wheel: "Embarrassed" appears under both Disgusted and Sad, and
"Overwhelmed", "Disappointed" and "Inferior" each appear twice too. Keying by
label would silently merge two different feelings. Once published, an id can
never change — saved entries point at it.

Import **merges by id** rather than replacing, so carrying the file from your
laptop to your phone cannot delete what the phone already had.

---

*A tool for noticing and naming what you feel. It is not therapy, treatment, or
advice.*
