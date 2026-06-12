package me.pvmn.client.module.modules.render;

import me.pvmn.client.module.Category;
import me.pvmn.client.module.Module;

/**
 * Maxes out the gamma so dark areas (caves, night) are fully lit. Restores the
 * previous gamma on disable. A small but classic quality-of-life render module —
 * also a clean example of the simplest possible module.
 */
public class FullBright extends Module {

    private float savedGamma;
    private boolean hasSnapshot;

    public FullBright() {
        super("FullBright", "Lights up dark areas by maximizing gamma.", Category.RENDER);
    }

    @Override
    public void onEnable() {
        if (mc.gameSettings == null) {
            return;
        }
        savedGamma = mc.gameSettings.gammaSetting;
        hasSnapshot = true;
        mc.gameSettings.gammaSetting = 100.0F;
    }

    @Override
    public void onDisable() {
        if (mc.gameSettings == null || !hasSnapshot) {
            return;
        }
        mc.gameSettings.gammaSetting = savedGamma;
        hasSnapshot = false;
    }
}
