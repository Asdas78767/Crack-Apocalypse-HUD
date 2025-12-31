# Crack Apocalypse HUD

CRT-styled Tampermonkey overlay that listens for AI text blocks formatted with a `[T9]` prefix and renders them as a tactical interface (profile, stats, environment sensors, squad status, and mission progress) on top of any page.

## Quick start (demo)
Open `demo.html` in a browser to see the HUD parse the sample `[T9]` payload and render the overlay. The HUD script is plain JavaScript, so it runs without a build step.

## Using as a userscript
1. Install Tampermonkey (or a compatible userscript manager).
2. Create a new userscript and paste the contents of `tampermonkey-hud.user.js`, or drag the file into your browser to import it.
3. Ensure the AI output includes a block like:
   ```
   [T9]
   PROFILE: Name=Echo Grey | Job=Fixer | FundsB=12800
   STATS: Health=78/100 (A), Armor=64/100 (B), Stamina=54/100 (C)
   ENV: Time=23:41 | Location=Outer Wall S7 | Danger=High
   SQUAD: Raven=Alive, Ghost=Down, Hex=Missing, Viper=Dead
   MISSION: Breach S7 GATE // Progress=42%
   ```
4. The HUD will detect the newest `[T9]` block in the page text and update the overlay in real time.

No external dependencies or build tools are required.
