package me.pvmn.client.module.modules.render;

import me.pvmn.client.PvmnClient;
import me.pvmn.client.module.Category;
import me.pvmn.client.module.Module;
import me.pvmn.client.module.setting.BooleanSetting;
import me.pvmn.client.util.Theme;
import net.minecraft.client.gui.FontRenderer;
import net.minecraft.client.gui.Gui;
import net.minecraft.client.gui.ScaledResolution;
import net.minecraftforge.client.event.RenderGameOverlayEvent;
import net.minecraftforge.fml.common.eventhandler.SubscribeEvent;

import java.util.ArrayList;
import java.util.List;

/**
 * In-game overlay: a "pvmn.exe" watermark plus a sorted arraylist of enabled
 * modules. Enabled by default so the client is visible out of the box.
 */
public class HudModule extends Module {

    public final BooleanSetting watermark = new BooleanSetting("Watermark", true);
    public final BooleanSetting arrayList = new BooleanSetting("ArrayList", true);

    public HudModule() {
        super("HUD", "Renders the watermark and enabled-module list.", Category.RENDER);
        addSettings(watermark, arrayList);
        setEnabled(true);
    }

    @SubscribeEvent
    public void onRenderOverlay(RenderGameOverlayEvent.Text event) {
        if (!isEnabled() || mc.gameSettings.showDebugInfo) {
            return;
        }

        ScaledResolution res = new ScaledResolution(mc);
        FontRenderer font = mc.fontRendererObj;

        if (watermark.getValue()) {
            font.drawStringWithShadow("pvmn", 3, 3, Theme.ACCENT);
            int xOffset = 3 + font.getStringWidth("pvmn");
            font.drawStringWithShadow(".exe", xOffset, 3, Theme.TEXT);
        }

        if (arrayList.getValue()) {
            renderArrayList(res, font);
        }
    }

    private void renderArrayList(ScaledResolution res, FontRenderer font) {
        List<String> names = new ArrayList<>();
        for (Module module : PvmnClient.INSTANCE.getModuleManager().getModules()) {
            if (module.isEnabled() && !(module instanceof ClickGuiModule)) {
                names.add(module.getName());
            }
        }
        // Longest name on top — the familiar staircase layout.
        names.sort((a, b) -> font.getStringWidth(b) - font.getStringWidth(a));

        int y = 2;
        for (String name : names) {
            int width = font.getStringWidth(name);
            int x = res.getScaledWidth() - width - 3;
            Gui.drawRect(x - 2, y, res.getScaledWidth(), y + font.FONT_HEIGHT + 1, Theme.BACKGROUND);
            // Accent tab on the right edge.
            Gui.drawRect(res.getScaledWidth() - 1, y, res.getScaledWidth(), y + font.FONT_HEIGHT + 1, Theme.ACCENT);
            font.drawStringWithShadow(name, x, y + 1, Theme.TEXT_ENABLED);
            y += font.FONT_HEIGHT + 1;
        }
    }
}
