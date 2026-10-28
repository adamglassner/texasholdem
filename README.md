# Texas Hold'em: Pecos Creek Saloon

No-limit Texas Hold'em against three computer players at a Southern saloon table. An Ironite game.

**Play money only.** Chips have no cash value: no real money, no purchases, no accounts. You start with 2,000 chips and the house restocks you for free if you run out.

## The game

- Play against Dusty Walker, Miss Lula Mae and Cody Briggs, each with their own style.
- Blinds of 10 and 20, with the dealer button moving every hand.
- Check, Bet, Call, Raise or Fold, with Min, Half Pot, Pot and All-in shortcuts and a bet slider.
- Side pots are worked out automatically when someone is all-in.
- At showdown every hand is named and the winning five cards light up. A hand helper names your best hand as the cards come out.
- How to Play and Hand Rankings guides built in.
- Original art, music and sound effects, all drawn and synthesized by the game itself.

Keys: `K` check, `B` bet, `C` call, `R` raise, `F` fold, `Enter` next hand, `M` music on/off, `F11` full screen.

Chips, stats and settings are saved in `%APPDATA%\Ironite\TexasHoldem`, outside the install folder, so updates and reinstalls keep them.

## Repository layout

| Path | What it is |
| --- | --- |
| `web/` | The game itself (HTML, CSS, JavaScript, fonts). `poker.js` is the hand evaluator, `game.js` the table logic and computer players, `art.js` and `music.js` the generated art and music. |
| `shell/` | Go wrapper that serves `web/` locally and opens it in an app-mode Microsoft Edge window. |
| `tools/mkres/` | Small tool that embeds the icon and version info into the .exe. |
| `installer/` | Inno Setup script and wizard art for `TexasHoldem-Setup-v<version>.exe`. |
| `icon-1024.png` | Game icon. |
| `README.txt`, `CREDITS.txt` | Text files shipped next to the .exe. |

The version comes from the top entry of `web/CHANGELOG.md`.

## Building

**Windows:** install [Go](https://go.dev/dl/) 1.24+ (`winget install GoLang.Go`) and optionally Inno Setup 6.3+ (`winget install JRSoftware.InnoSetup`), then double-click `build.bat`. It writes `dist\Games\TexasHoldem\TexasHoldem.exe`, and with Inno Setup installed, `Output\TexasHoldem-Setup-v1.0.0.exe`.

**macOS / Linux / WSL:** `./build.sh` cross-compiles the same Windows .exe into `dist/Games/TexasHoldem/`. The setup itself has to be compiled on Windows with `ISCC.exe installer\TexasHoldemSetup.iss`.

The setup installs into the same `Games\TexasHoldem` folder as the combined Ironite installer, so Ironite Launcher picks it up automatically.

To try the game in a browser without building, serve the `web/` folder (for example `python -m http.server -d web`) and open `http://localhost:8000`. In a plain browser your chips are saved in the browser's local storage instead of AppData.

## License

Copyright (c) 2026 Ironite. All rights reserved. Fonts are under the SIL Open Font License (`web/fonts/OFL.txt`).
