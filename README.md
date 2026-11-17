**[▶ CLICK HERE FOR THE DEMO](https://site-03c3b4999edb4f28b4919b715e0bdeb0.freebuff.page/)**

# Holographic Particle Accelerator

A WebGL2 particle animation. Thousands of points fly in from a sphere and assemble a real 3D
ball — or a cube, a torus, an atom, a helix, a pyramid, a star, a spear, the equalizer, its square
grid, or a mesh you bring in from Blender — then keep turning, hold, and rebuild. The controls live
in a panel docked down the right-hand side of the same window: **Home** opens it, **Home** closes
it. It runs the same on a phone as on a desktop.

Written by **Jackrabbit72380**. No libraries, no build step.

| File | Purpose |
| :--- | :--- |
| `index.html` | The animation, with the controller docked on the right. Flags below. |
| `controller.html` | The same panel in a window of its own, for a second screen. |
| `src/engine.js` | The whole engine — every shape, buffers, shaders, `window.HPA`. |
| `src/controller.js` | Every section of the panel, in the order it appears. |
| `src/dock.js`, `src/placement.js` | Home opens and closes the panel; Home also cycles its five places; Escape closes it. |
| `src/relay.js`, `src/attached.js` | The particle window is offered to its opener, so a reloaded panel re-attaches. |
| `src/close-x.js`, `src/guide-close.js`, `src/guide-notes.js` | The × that closes the guide, and the guide window's own section. |
| `src/build.js`, `src/canvas-fit.js` | The build stamp at the bottom right, and the canvas box the engine measures. |
| `src/reset.js`, `src/show.js` | `HPA.reset()` and `HPA.show()`. |
| `src/export.js`, `src/import.js` | Model out, and a Blender OBJ / PLY mesh in. |
| `src/blob.js`, `src/axes.js`, `src/show-switches.js` | The blob target, the turn switches, and Show as four switches. |
| `src/layers.js`, `src/starfield.js` | The Layers panel — Target and Background — and a starfield as a source for either. |
| `src/reverse.js`, `src/target-load.js` | Build up, turn three times, dissolve out; one Load… for pictures and meshes. |
| `src/capture-set.js`, `src/record-start.js` | WebM and MP4 with one length, Export, and one whole build from frame one. |
| `src/caption-names.js`, `src/model-tilt.js` | The caption taken from what you loaded, and the 90° fix for Z-up models. |
| `src/panel-compact.js`, `src/panel-copy.js` | Notes behind each section's "i" pill, the panel's wording, and the status line's capital. |
| `src/style.css`, `src/controller.css`, `src/mobile.css` | Styling, and the phone layout in one small-screen query. |
| `res/hpa-glyph.svg` | Optional flat target — a picture, so it stays flat. |

Each script does one job against the page it finds, so the panel can be reshaped without touching
`src/engine.js` or `src/controller.js` — the engine and the sections stay as written.

## Run

```bash
python3 -m http.server 3000
```

Open `http://localhost:3000/`, press **Home** — the controller slides in from the right, and the
animation keeps running behind it. `file://` will not work: reading a mask image needs HTTP.

The panel is the same code in both places. `src/controller.js` reaches the engine through a player
handle and calls `window.HPA` on it; docked, that window is the one it is in, so `src/dock.js`
hands it a stand-in (`window.HPA_PLAYER = { HPA: window.HPA }`). Home is only taken when a text
field does not need it, so typing a caption keeps its own Home key.

### Where the panel sits

**Home** moves the panel round five places: **right**, **left**, **top**, **bottom**, **window**,
and back. Top and bottom are wide and short, so the sections lay out across them in columns; in
window the panel is not docked at all and opens in a 1280 × 720 window of its own. The placement is
remembered, and the ↻ beside the status moves it on — its label and tooltip name the place.

**Close guide** — the × at the far right of the panel's bar, and of the guide window's bar — puts
the panel away without moving it, as does **Escape**, and Home brings it back. The × and the ↻ are
small squares rather than words, so the bar never spends its row on either. Escape closes an open
note first.

### The separate window

Open `controller.html` — or a second screen, alongside the animation — and press **Open particle
window**. Both pages are same-origin, so the panel holds a live reference to the window returned by
`window.open` and calls `window.HPA` on it directly: no embedding, no iframe, no message protocol.
The panel re-checks the link every 700 ms, so closing the particle window shows *particle window
closed* instead of silently doing nothing. Reloading the panel does not cost the animation:
`src/relay.js` keeps offering the player window to its opener, so the panel finds it again and says
*Reconnected — animation kept running*. If popups are blocked the panel says so.

### On a phone

The same page, unreduced: the panel fills the width and its bars wrap instead of pushing the last
button off the edge, the sections stack in one column, and buttons and sliders are sized for a
thumb. The canvas is measured from `innerWidth` / `innerHeight` — the pixels the engine itself
uses — so the picture is never stretched by an address bar hiding or arriving, and turning the
phone re-fits at once.

## The shape

Every target is real geometry with depth, so each one can be walked round: turn it and the far
side comes into view, **Tilt** it and you see the top, inside view puts the camera among its
points. The one exception is a picture — an image you load, or the shipped glyph — which is flat.

| Target | What it is |
| :--- | :--- |
| **Ball** | A sphere sampled on its surface — 24 meridians, 12 parallels and a skin between them (~10 800 points, radius 2.07). |
| **Cube** | Six flat faces with the twelve edges and eight corners built up denser (~12 000 points, half-extent 2.07). |
| **Torus** | A ring with a solid tube, points spread evenly over the surface (1.52 ring, 0.66 tube). |
| **Atom** | A nucleus ball with three elliptical orbits upright in different planes, an electron riding each. |
| **Helix** | A double helix along X, two strands with rungs between them. |
| **Pyramid** | A square pyramid: four triangular sides, a base, ridges and corners denser. |
| **Star** | A five-pointed star with real thickness — the rim drawn back to a point on each face. |
| **Spear** | Pommel, ferrule, wrapped shaft, socket collar and a leaf blade along X. |
| **Equalizer (audio bars)** | A flat disc of 64 columns that rise with the spectrum. |
| **Grid (audio bars)** | The same 64 bars as an 8 × 8 square grid on a plane. |
| **Blob (3D, audio)** | A sphere knotted and dented by the spectrum, smoothed along its own surface. |
| **Imported mesh** | A Blender OBJ / PLY turned into a point cloud over its triangles. |
| **Glyph, any image** | A picture sampled as a silhouette — flat, with a thin slab of depth. |

All of them are sized against `MASK_HEIGHT` (4.6), so changing target does not change how big the
thing is on screen, and all arrive from the middle outward as the assembly runs. Each is a function
in `src/engine.js` returning `[{ x, y, z, wait }, …]`, registered on `HPA.shapes`.

## Layers

The panel's first section is the layer selector. **Layer → Target** shows the target's own
settings, **Layer → Background** the background's; each has an **On / Off** switch, its own source,
and the same four properties: size, turn, brightness and band height.

Target off is a blank shape, because the engine has no opacity for the target and a shape with no
points is the one thing that draws nothing. Background off is `LAYER_SRC: 'off'`.

**Starfield** is a source rather than a section: pick it under the layer's **Source**, then set
**Stars**, **Spread**, **Depth** and **Fly speed**, and choose **Still frame**, **Fly at camera** or
**New field**. As a background it flies past; as the target the camera moves into it.

## Title

The words under the shape are yours: **Title → Caption text**, live as you type. **Caption size**
is the slider below it, and `?nocaption` at the end of the URL hides the line.

## Turning

The turn never stops. The assembly winds the shape in and eases it to **Settle angle** (0–360°), so
the pose it finishes at is one you pick; from there an accumulated spin carries it round forever,
and because the angle is accumulated per frame rather than read from a clock, it never jumps when a
cycle rebuilds the shape.

**Turn**, **Tumble** and **Roll** are the three axes — Y, X and Z — as switches, so any pair, or all
three, can run at once. **Infinite rotation** (in Camera, or **Timing → Rebuild loop** off — the
same setting) drops the hold, fade and rebuild: the shape assembles once and turns forever. With it
off the cycle runs assemble, hold, fade, rebuild over and over, and the endless turn carries on
underneath.

| Control | What it does |
| :--- | :--- |
| **Spin speed** | Turns per second of the endless turn — one turn is 360°. 0 freezes the pose; below 0 turns the other way. |
| **Turn / Tumble / Roll** | The axes the endless turn goes round: Y, X and Z, as on/off switches. |
| **Infinite rotation** | Assemble once and turn forever, no fade and no rebuild. |
| **Settle angle** | The yaw the assembly comes to rest at, in degrees. |
| **Rebuild loop** | On: assemble, hold, fade, rebuild forever. Off: assemble once and keep turning. |
| **Reverse** | Build up, turn three times, dissolve out, start over: the hold becomes three whole turns. |

That accumulation is why **Reset** has to zero it: restoring the settle angle alone is not enough,
because the turn already banked would be added on top. `HPA.reset()` calls `HPA.resetRotation()`, so
a reset really is the fresh-page pose.

## Camera

| Control | What it does |
| :--- | :--- |
| **Zoom** | Camera distance, 0.35×–6× on the slider; the mouse wheel goes down to 0.15×. Pull back below 1× for room, push in past it to move through the target. |
| **Outside view** | Orbit camera looking in at the object. |
| **Inside view** | Camera sits just inside the target's own shell, so the shape wraps around you. |
| **Tilt** | Pitch of the object in degrees. 0° is dead head-on; positive tips the top away from you. |
| **Pivot X / Y / Z** | The point the turn goes around, in world units out from the middle of the target. 0 is the target's own centre. |
| **Pivot: centre** | Puts the axis back at 0, 0, 0. |
| **Pivot: base** | Drops the axis on the floor of the target's bounding box, centred in X and Z. |
| **Pan left / right**, **Pan up / down** | Slides the view in world units, as far as ±6. |
| **Arrow keys** | In the particle window, nudge the view 0.25 at a press, 1.0 with shift. |
| **Head-on** | Puts the tilt and both pan offsets back to zero. |

The pitch used to be a fixed lean, which is why shapes always looked viewed from above. It now comes
from **Tilt** (default 0°), and the old slow wobble is available separately as `SWAY`.

### Where it turns, and which way

**Pivot** is the point the turn goes around. Built-in shapes are built around their own middle, so 0
is right for them. An imported model is centred on its bounding box too, which is usually not where
you want the axis: a figure reads right spinning on its feet, a sword on its hilt. Drag **Pivot Y**
until the axis sits where you want (a target spanning 4.6 units wants about −2 for its base), or
press **Pivot: base** and let the panel read the target's points.

**Turn axis** is the direction it turns. The shipped Y turntable is right for a ball, a spear, a
statue, and wrong for anything flat: a sheet lying down has almost no height to read, so a Y turn
spins it inside its own plane. **X** tumbles it end over end and **Z** rolls it side to side — which
one depends on how the file was exported (Blender's OBJ / PLY export is Y up, so a map modelled on
Blender's floor arrives lying in XZ). Nothing is resampled by changing it, and a negative **Spin
speed** sends the turn the other way without moving the camera.

Both are part of the model matrix: **M = T(P) · R · T(−P)**, where R is the pitch you set with Tilt
times the turn about the chosen axis. Moving either does not resample anything, **Export → .obj**
still writes the model where it really sits, and Reset puts the pivot back to 0, 0, 0 and the axis to
Y.

## Show

The **Show** section runs the animation by itself, as four switches, one at a time.

| Switch | What it does |
| :--- | :--- |
| **Inside spin** | Camera inside the ball, rebuild loop off, endless spin carrying the view round forever. |
| **Music visualizer** | Zoom rises and falls with the audio level, the tint walks the wheel; how hard is **Zoom pulse**. |
| **Rainbow** | The tint sweeps the wheel on its own — a turn every five seconds at rest, faster as **Colour drift** rises. |
| **Off** | Hands the picture back: original tint and zoom return, the camera goes back outside. |

| Preset | Character |
| :--- | :--- |
| **Pulse** | Punchy zoom on the level, steady target, slow colour. |
| **Drift** | Softer zoom, much faster colour travel. |
| **Chaos** | Strong zoom, fast colour, and a new target and tint every **Shuffle every** seconds (4–40 s) — but never sooner than one full turn at the current **Spin speed**. |

Shuffle picks shapes with the panel's own **Random** button. The minimum interval is worked out from
the particle window's own `ROTATE_SPEED`: at 0.064 turns/s a turn takes about 16 s, so even 4 s
changes the shape once per turn. **Inside spin** and **Off** move the camera too, so Camera's
*Outside view* / *Inside view* buttons light up to match.

## Controller

All of the panel is built in `src/controller.js` — one block per section, in the order below — and
the sections added since are the separate small scripts in the file table.

| Section | What it does |
| :--- | :--- |
| **Reset** | The wide button at the top of the panel, above every section. |
| **Layers** | Layer → Target or Background, each with its own on/off, source and four properties. |
| **Target** | Ball, cube, torus, atom, helix, pyramid, star, spear, the audio planes, the blob, imported mesh, the glyph or any image: **Load…**, **Rebuild**, **Random**, and the layer's **On / Off**. |
| **Title** | The caption under the shape and its size. |
| **Particles** | Density, point size, slab depth, spin turns, dust motes. |
| **Camera** | Spin speed and turn switches, infinite rotation, zoom, settle angle, tilt, pivot, pan, views. |
| **Show** | Inside spin, music visualizer and rainbow as switches, their presets, the shuffle timer. |
| **Band height** | How far the spectrum moves whatever is on screen. |
| **Timing** | Assembly, hold and fade durations, the rebuild loop toggle, and **Reverse**. |
| **Look** | Tint, glow falloff, chromatic rim. |
| **Effects** | Grid, scanlines, vignette, camera shake — on/off. |
| **Audio response** | Microphone, system audio or a local audio file; the level drives size and brightness. |
| **Capture** | **WebM** and **MP4**, both for the length set by **Video length** (1–30 s), and **Record from start** for one whole build. |
| **Export** | The target as a model file: **.obj** or **.ply**. |

Every section's explanation lives behind the small **i** in its heading, so the panel is controls and
nothing else; click the pill and the note opens over the section, and Escape or a click elsewhere
closes it. The build the page is running is stamped at the bottom right.

**Reset** puts every setting back to the shipped defaults — in the engine and in the panel — and
starts the assembly over: ball target, the shipped caption, 0.064 turns/s on Y, settle angle 0°,
tilt 0°, pivot 0, 0, 0, no pan, rebuild loop on, tint `#a1d6ff`, show mode off, and the accumulated
turn back to zero. Everything applies live except density, depth, dust and the visualizer mode,
which rebuild the particle buffer; video is captured from the canvas only, so the caption overlay is
not in the frame.

### Model export

**Export → .obj** or **Export → .ply** writes the target you are looking at — any shape, a loaded
image or an imported mesh — as a point cloud: one vertex per particle, world units, Y up, no faces.
Blender imports either in one step (File → Import → Wavefront `.obj`, or New Stanford `.ply`);
instance a sphere or metaball on the points to give them body.

There is no `.blend` export, and it is not missing: a `.blend` is a dump of Blender's memory plus the
DNA schema of the version that wrote it, and no writer exists outside Blender itself.

### Model import

**Target → Load…**, or drop the file on the page, reads a mesh from Blender — **Wavefront `.obj`** or
**Stanford `.ply`** (ASCII or little-endian binary, with or without faces) — as a **3D point cloud**,
not a front-view picture.

The mesh is centred on its bounding box and fitted to the size of the built-in shapes by its longest
side, its triangles are sampled area-weighted up to ~18 000 points (so a Blender cube arrives as a
solid cube rather than eight dots), and files with no faces come in as their vertices. Because the
points keep their Z, the import behaves like any shape: turning shows the far side, **Tilt** shows
the top, inside view walks into it, and **Export** writes the same points out. Zoom frames the whole
model as it loads, and inside view is placed relative to its size. A model that arrives Z-up gets the
**90° tilt** box, which appears with the file dialog.

A `.blend` cannot be read for the same reason it cannot be written; the one step that gets one in is
**File → Export → Wavefront (.obj)** in Blender.

## Audio planes

**Target → Equalizer (audio bars)** replaces the shape with a flat disc of 64 bars on a plane; the
plane turns with the model and each bar rises with its own frequency band. **Grid (audio bars)** is
the same 64 bands as an 8 × 8 square. Both are modes rather than masks (`MODE: 'equalizer'` /
`'grid'`), which is why picking one swaps the mode and leaves the last shape in place.

**Band height** is not only theirs: any other target pushes its points outward along their own radius
instead — each point answers the band for the angle it sits at round the turn axis, and the outer
surface answers harder than the middle, so the music runs round the shape. With no audio nothing
moves.

| Source | How |
| :--- | :--- |
| **System audio** | Chrome / Edge on Windows or Linux: pick a screen or window and tick **Share system audio**. macOS does not offer this. |
| **Microphone** | Works everywhere; on a Mac route system sound into a loopback device and select it. |
| **Audio file** | An MP3 / WAV / OGG / M4A, played through the page on loop. |

Only the level is used — RMS, plus the 64 bands — nothing is recorded, stored or uploaded.
Sensitivity scales the response; the meter shows the live level.

## Engine API

`index.html` exposes `window.HPA`, which is what the panel calls:

```js
HPA.set({ COLOR: [1, 0.4, 0.2], POINT_SIZE: 42 });  // any CONFIG key
HPA.set({ LABEL: 'Your title', CAPTION_SCALE: 1.4 }); // the line under the shape, and its size
HPA.set({ VIEW: 'inside', ZOOM: 2.4 });             // camera
HPA.set({ TILT: 0, PAN_X: 0, PAN_Y: 0 });           // head-on, centred
HPA.set({ ROTATE_SPEED: Math.PI, LOOP: false });    // radians per second + turn forever
HPA.set({ SPIN_AXIS: 'z' });                        // 'y' turntable | 'x' tumble | 'z' roll
HPA.set({ STOP_ANGLE: 90, PIVOT_Y: -2.07 });        // settle yaw, and turning on the base
HPA.set({ MODE: 'equalizer' });                     // 'shape' | 'equalizer' | 'grid'
HPA.set({ LAYER_SRC: 'starfield:layer' });          // the background layer's source, or 'off'
HPA.setMask('torus');                               // a shape name, 'mesh', or an image URL
HPA.setPointCloud(points);                          // any [{x, y, z}, …] as the target, in 3D
HPA.shapes.spiral = () => points;                   // another shape, if you want one
HPA.fitZoom();                                      // the zoom that frames the whole target
HPA.rebuild();                                      // resample and restart
HPA.resetRotation();                                // endless turn back to the settle angle
HPA.reset();                                        // shipped settings back, assemble again
HPA.show({ mode: 'rainbow' });                      // 'off' | 'inside' | 'visualizer' | 'rainbow'
HPA.show({ mode: 'visualizer', preset: 'chaos', pulse: 0.6, drift: 0.4 });
HPA.show.reset();                                   // autopilot off, picture restored
HPA.geometry();                                     // the target's points, [{x, y, z}, …]
HPA.exportModel('obj');                             // download the target ('obj' | 'ply')
HPA.importModel(file);                              // OBJ / PLY mesh in, as 3D points
HPA.setAudio(0.7);                                  // 0..1, drives size and glow
HPA.setSpectrum(bands);                             // Float32Array(64), 0..1 per band
HPA.capture('image/png');                           // data URL
HPA.record({ ms: 5000, mime: 'video/webm' });       // Promise<Blob>
HPA.snapshot();                                     // counts, config and the turn so far
```

`ROTATE_SPEED` is radians per second in the API; the panel's **Spin speed** shows turns per second,
so 0.064 turns/s is the default 0.40 rad/s. `LOOP: false` is the Infinite rotation checkbox.

## Flags

| Flag | Effect |
| :---: | :--- |
| `?4k` / `?2k` / `?sd` | Render scale |
| `?halfspeed` / `?quarterspeed` | Animation speed |
| `?nocaption` | Hide the caption overlay |
| `?nocontrols` | Ignore `postMessage` (standalone playback) |

## Defaults

`CONFIG` at the top of `src/engine.js`: 3D ball target, 260-sample mask, 6 000 dust motes, 7 s
assembly, 12 s hold, 1.2 s fade, 0.40 rad/s (0.064 turns/s) endless spin about Y from a 0° settle
angle, tilt 0°, pivot 0, 0, 0, no pan, loop on, tint `#a1d6ff`, caption `Holographic Particle
Accelerator`.
