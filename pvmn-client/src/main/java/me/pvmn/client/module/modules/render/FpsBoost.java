package me.pvmn.client.module.modules.render;

import me.pvmn.client.module.Category;
import me.pvmn.client.module.Module;
import me.pvmn.client.module.setting.BooleanSetting;
import me.pvmn.client.module.setting.ModeSetting;
import net.minecraft.client.settings.GameSettings;

/**
 * FPS optimization module.
 *
 * <p>This applies the safe, high-impact vanilla render settings that recover
 * most of the easy frame budget (particles, clouds, fancy graphics, mipmaps,
 * entity rendering distance) without stripping gameplay-relevant visuals. The
 * "Keep Visuals" toggle protects things players usually care about (smooth
 * lighting, item/block visuals) so you don't end up with a broken-looking game.</p>
 *
 * <p>Honest scope note: this is NOT a drop-in clone of Sodium. Sodium replaces
 * Minecraft's entire chunk renderer; that cannot be done from a settings-level
 * mod. What you get here is the realistic, no-downside slice of those gains.</p>
 */
public class FpsBoost extends Module {

    public final ModeSetting level = new ModeSetting("Level", "Balanced", "Balanced", "Aggressive");
    public final BooleanSetting keepVisuals = new BooleanSetting("Keep Visuals", true);

    // Snapshot of the player's settings so disabling cleanly restores them.
    private boolean savedFancyGraphics;
    private int savedParticles;
    private int savedClouds;
    private int savedMipmap;
    private int savedRenderDistance;
    private boolean savedSmoothLighting; // 0 = off, >0 = on (ao field is int in 1.8.9)
    private boolean hasSnapshot;

    public FpsBoost() {
        super("FPS Boost", "Applies safe vanilla optimizations to recover frames.", Category.RENDER);
        addSettings(level, keepVisuals);
    }

    @Override
    public void onEnable() {
        GameSettings settings = mc.gameSettings;
        if (settings == null) {
            return;
        }

        snapshot(settings);

        // Particles: minimal in both modes (huge win, low visual cost).
        settings.particleSetting = 2; // 0 = all, 1 = decreased, 2 = minimal

        // Mipmaps off removes a chunk-rebuild cost on lower-end GPUs.
        settings.mipmapLevels = 0;

        if (level.is("Aggressive")) {
            settings.fancyGraphics = false; // FAST graphics
            settings.clouds = 0;            // 0 = off, 1 = fast, 2 = fancy
            settings.renderDistanceChunks = Math.min(settings.renderDistanceChunks, 8);
        }

        if (!keepVisuals.getValue()) {
            // Only sacrifice smooth lighting when the user explicitly opts out
            // of "Keep Visuals" — it is the single biggest "important effect".
            settings.ambientOcclusion = 0; // 0 = off
        }

        reloadRenderers();
    }

    @Override
    public void onDisable() {
        GameSettings settings = mc.gameSettings;
        if (settings == null || !hasSnapshot) {
            return;
        }
        settings.fancyGraphics = savedFancyGraphics;
        settings.particleSetting = savedParticles;
        settings.clouds = savedClouds;
        settings.mipmapLevels = savedMipmap;
        settings.renderDistanceChunks = savedRenderDistance;
        settings.ambientOcclusion = savedSmoothLighting ? 2 : 0;
        hasSnapshot = false;
        reloadRenderers();
    }

    /** Rebuild chunk renderers so changes take effect — but only once a world
     *  is loaded. During startup renderGlobal is null and no reload is needed. */
    private void reloadRenderers() {
        if (mc.renderGlobal != null) {
            mc.renderGlobal.loadRenderers();
        }
    }

    private void snapshot(GameSettings settings) {
        savedFancyGraphics = settings.fancyGraphics;
        savedParticles = settings.particleSetting;
        savedClouds = settings.clouds;
        savedMipmap = settings.mipmapLevels;
        savedRenderDistance = settings.renderDistanceChunks;
        savedSmoothLighting = settings.ambientOcclusion > 0;
        hasSnapshot = true;
    }
}
