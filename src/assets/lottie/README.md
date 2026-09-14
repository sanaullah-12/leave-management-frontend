# Lottie animations for section banners

Animations used by the section banners. Each one is remapped onto the theme
accent at load time by `lib/lottieTheme`, so a downloaded file stops carrying
its author's palette - see the note on recolouring below.

## Which banner uses which file

Animations are keyed to a *subject*, not to a route. Several screens share one
file on purpose: every payroll screen runs `payroll.json`, Profile and
Customize both run `setting.json`, and everything an employee requests time
away through - leave, policy and work from home - runs `leave.json`. A visitor
landing on Payslips should recognise it as payroll on sight, which is the
opposite of what six unrelated drawings would achieve.

Sharing also means the JSON is fetched and parsed once per session however many
of those screens get visited.

| File | Section variants |
| ---- | ---------------- |
| `DataDashboard.json` | `dashboard` |
| `Team.json` | `team`, `employees`, `departments` |
| `attendence.json` | `attendance` - the Attendance screen and the Late arrivals console |
| `leave.json` | `leave`, `policies`, `workFromHome` |
| `CALENDAR.json` | `calendar` |
| `announcements.json` | `announcements` |
| `reports.json` | `reports` |
| `payroll.json` | `payroll` - all six payroll screens |
| `documents.json` | `documents` |
| `employeevoice.json` | `voice` |
| `notifications.json` | `notifications` |
| `setting.json` | `settings`, `profile` |

`notification.json` is a byte-identical copy of `notifications.json`. Nothing
references it, so it never reaches a bundle - it is safe to delete, and worth
deleting rather than letting the two drift.

The hand-drawn SVGs in `src/components/ui/illustrations/` are no longer wired to
any variant. They are kept as the zero-dependency fallback for a banner that
should not pay for a player.

## Adding one

1. Download the `.json` from LottieFiles (or wherever) while signed in.
2. Save it here, named for its subject, e.g. `announcements.json`.
3. Add a row to the licence register below: the file, where it came from, the
   author and the exact licence. A file without a row is a file nobody can
   audit later.
4. Declare it and point one or more variants at it in
   `src/components/ui/illustrations/index.tsx` - the procedure is documented at
   the top of that file and is a few lines.

`LottieIllustration` already handles the rest: it code-splits both the player
and the JSON so neither reaches the bundle for pages that do not use them, and
it freezes on the first frame when the visitor prefers reduced motion.

## Licence register

Every file below was supplied directly by the project owner rather than fetched
here, so `lottiefiles.com` returns **HTTP 403** to automated requests and the
per-asset licence pages cannot be read programmatically. Shipping an asset whose
licence has not been read into a production HR application is not a call worth
making silently, so the source and licence columns are left for whoever
downloaded them.

| File | Source URL | Author | Licence |
| ---- | ---------- | ------ | ------- |
| `DataDashboard.json` | _added by the project owner_ | _to record_ | **_to record_** |
| `Team.json` | _added by the project owner_ | _to record_ | **_to record_** |
| `announcements.json` | _added by the project owner_ | _to record_ | **_to record_** |
| `attendence.json` | _added by the project owner_ | _to record_ | **_to record_** |
| `CALENDAR.json` | _added by the project owner_ | _to record_ | **_to record_** |
| `documents.json` | _added by the project owner_ | _to record_ | **_to record_** |
| `employeevoice.json` | _added by the project owner_ | _to record_ | **_to record_** |
| `leave.json` | _added by the project owner_ | _to record_ | **_to record_** |
| `notification.json` | _unreferenced duplicate_ | - | - |
| `notifications.json` | _added by the project owner_ | _to record_ | **_to record_** |
| `payroll.json` | _added by the project owner_ | _to record_ | **_to record_** |
| `reports.json` | _added by the project owner_ | _to record_ | **_to record_** |
| `setting.json` | _added by the project owner_ | _to record_ | **_to record_** |

## Recolouring

`LottieIllustration` runs every animation through `recolorLottie` before
playing it. Saturated colours are rotated onto the theme accent's hue, keeping
their own saturation and lightness so the drawing's internal contrast
survives; near-neutral colours (outlines, paper, grey shading) are left alone.

The accent it recolours to comes from `useThemeAccentRgb`, which watches the
class on `<html>` rather than reading `--blue-600` during render. ThemeContext
applies that class in an effect, and a parent's effect runs *after* its
children's, so a render-time read returns the *previous* theme - the artwork
would sit one switch behind the banner it is painted on.

Three limits worth knowing:

- Recolouring only reaches vector fills and strokes. Embedded raster images
  keep the colours they were drawn with, and three files carry them:
  `leave.json` (12), `notifications.json` (9) and `reports.json` (5). Prefer a
  fully vector animation when picking a replacement.
- `minLightness` floors how dark a colour may end up, because banners are
  saturated and dark art otherwise disappears into the gradient. Banners pass
  0.34, the default - the ground was lightened a rung, so artwork needs to keep
  more of its own depth rather than less.
- Recolouring never touches an opaque backdrop, because white is near-neutral
  and so counts as line work. A full-canvas solid is removed instead, by
  `stripBackdropLayers` - see below.
- Near-neutral colours are deliberately skipped, so an animation drawn entirely
  in greys will not pick up the accent at all.

## Exported backdrops

Illustration exports often carry a full-canvas solid as the artboard's paper;
`attendence.json` ships a 1509x1509 white one. On a banner that reads as a
white card sitting on the gradient.

`stripBackdropLayers` (in `lib/lottieTheme`) drops any layer-type-1 solid at
least as large as the canvas, on every animation, before it is played. Smaller
solids are kept - those are blocks of colour the drawing meant to have. So a
replacement asset that ships with paper needs no special handling, and the JSON
on disk is left exactly as downloaded.

## Note on the LottieFiles free tier

Most free LottieFiles assets are covered by the **Lottie Simple License
(FL 9.15.21)**, which broadly permits use inside a larger work such as an app
but does not permit redistributing the animation on its own. Check the licence
shown on the individual asset page - it varies per upload - and record what it
actually says in the table above.
