# pvmn.exe

A lightweight **Minecraft 1.8.9 Forge** client with a Raven B++ inspired
ClickGUI, customizable keybinds, an HUD, and safe FPS optimizations.

> The in-game client name is **pvmn.exe**. That is intentionally different from
> the jar file name (`pvmn-client-1.0.0.jar`).

## How it loads (no injection)

This is a standard Forge mod. It loads inside Minecraft's own JVM when the game
starts — there is no separate program that attaches to a running `javaw.exe`.
Process-injection "ghost clients" exist mainly to hide from anti-cheat /
screenshare; this project deliberately does not do that. To use it:

1. Install the **Minecraft Forge 1.8.9** profile.
2. Build the jar (below) and drop it into `.minecraft/mods/`.
3. Launch the Forge 1.8.9 profile.

## Building

Requires **JDK 8** (1.8.9 will not build or run on newer JDKs).

```bash
cd pvmn-client
./gradlew setupDecompWorkspace   # first time only, downloads + deobfuscates MC
./gradlew build                  # output: build/libs/pvmn-client-1.0.0.jar
```

(Use `gradlew.bat` on Windows. If you don't have the Gradle wrapper checked in,
run `gradle wrapper --gradle-version 4.10.3` once — that's the last wrapper that
plays nicely with ForgeGradle 2.3 for 1.8.9.)

## Using it in-game

- Press **Right-Shift** to open the ClickGUI (rebindable — see below).
- **Left-click** a module to toggle it.
- **Right-click** a module to expand its settings.
- **Drag a panel header** to move it; **right-click the header** to collapse it.
- **Bind row:** click `Bind: …` under any module, then press a key. `Esc`
  clears the bind. The ClickGUI's own open key is set the same way.
- Settings and toggles are saved to `.minecraft/pvmn/config.properties` on close.

## Included modules

| Module     | Category | What it does                                                        |
|------------|----------|---------------------------------------------------------------------|
| ClickGUI   | Client   | Opens the menu. Default bind: Right-Shift. Has Theme/Opacity settings.|
| FPS Boost  | Render   | Applies safe vanilla optimizations (particles, clouds, graphics, mipmaps, render distance). "Keep Visuals" protects smooth lighting. |
| FullBright | Render   | Maxes gamma to light up caves/night; restores on disable.           |
| HUD        | Render   | "pvmn.exe" watermark + sorted enabled-module arraylist.             |

### A note on "like Sodium"

Sodium replaces Minecraft's entire chunk renderer, which is not something a
settings-level mod can do. **FPS Boost** instead applies the realistic,
no-downside slice of those gains and keeps gameplay-important visuals (smooth
lighting, block/item rendering) intact via the "Keep Visuals" toggle.

## Adding your own module (the "easy menu")

1. Create a class extending `Module`:

```java
public class MyModule extends Module {
    public final BooleanSetting example = new BooleanSetting("Example", true);

    public MyModule() {
        super("MyModule", "Describe it here.", Category.MISC);
        addSettings(example);
    }

    @Override public void onEnable()  { /* ... */ }
    @Override public void onDisable() { /* ... */ }
}
```

2. Register it with one line in `ModuleManager#registerModules()`:

```java
register(new MyModule());
```

That's it — the ClickGUI panel, settings UI, keybinding, and config persistence
all pick it up automatically.
