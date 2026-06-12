package me.pvmn.client.gui.clickgui;

import me.pvmn.client.module.Module;
import me.pvmn.client.module.modules.render.ClickGuiModule;
import me.pvmn.client.module.setting.BooleanSetting;
import me.pvmn.client.module.setting.ModeSetting;
import me.pvmn.client.module.setting.NumberSetting;
import me.pvmn.client.module.setting.Setting;
import me.pvmn.client.util.Theme;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.FontRenderer;
import net.minecraft.client.gui.Gui;

/**
 * One module row plus its expandable settings. Both {@link #render} and
 * {@link #mouseClicked} walk the layout in the exact same order so hit-testing
 * always matches what is drawn.
 */
public class ModuleButton {

    private static final int MODULE_HEIGHT = 13;
    private static final int SETTING_HEIGHT = 12;

    private final Module module;
    private boolean open;

    public ModuleButton(Module module) {
        this.module = module;
    }

    /** @return the Y coordinate immediately below this button (and its settings). */
    public int render(ClickGui gui, int x, int y, int mouseX, int mouseY) {
        FontRenderer font = Minecraft.getMinecraft().fontRendererObj;
        boolean hovered = isOver(x, y, Panel.WIDTH, MODULE_HEIGHT, mouseX, mouseY);

        int bg = Theme.withOpacity(Theme.BACKGROUND, gui.getOpacity());
        Gui.drawRect(x, y, x + Panel.WIDTH, y + MODULE_HEIGHT, bg);
        if (hovered) {
            Gui.drawRect(x, y, x + Panel.WIDTH, y + MODULE_HEIGHT, Theme.MODULE_HOVER);
        }
        // Enabled state shown by an accent bar on the left edge.
        if (module.isEnabled()) {
            Gui.drawRect(x, y, x + 2, y + MODULE_HEIGHT, Theme.ACCENT);
        }

        int textColor = module.isEnabled() ? Theme.TEXT_ENABLED : Theme.TEXT_DIM;
        font.drawStringWithShadow(module.getName(), x + 6, y + 3, textColor);

        // A small marker hints there are settings to expand.
        if (!module.getSettings().isEmpty() || module instanceof ClickGuiModule) {
            font.drawStringWithShadow(open ? "v" : ">", x + Panel.WIDTH - 9, y + 3, Theme.TEXT_DIM);
        }

        int rowY = y + MODULE_HEIGHT;
        if (open) {
            for (Setting<?> setting : module.getSettings()) {
                rowY = renderSetting(gui, setting, x, rowY);
            }
            rowY = renderBindRow(gui, x, rowY);
        }
        return rowY;
    }

    /** @return next Y if not consumed, or -1 if this button handled the click. */
    public int mouseClicked(ClickGui gui, int x, int y, int mouseX, int mouseY, int button) {
        if (isOver(x, y, Panel.WIDTH, MODULE_HEIGHT, mouseX, mouseY)) {
            if (button == 0) {
                module.toggle();
            } else if (button == 1) {
                open = !open;
            }
            return -1;
        }

        int rowY = y + MODULE_HEIGHT;
        if (open) {
            for (Setting<?> setting : module.getSettings()) {
                if (isOver(x, rowY, Panel.WIDTH, SETTING_HEIGHT, mouseX, mouseY)) {
                    handleSettingClick(gui, setting, x, rowY, mouseX, button);
                    return -1;
                }
                rowY += SETTING_HEIGHT;
            }
            // Bind row
            if (isOver(x, rowY, Panel.WIDTH, SETTING_HEIGHT, mouseX, mouseY)) {
                gui.bindingModule = module;
                return -1;
            }
            rowY += SETTING_HEIGHT;
        }
        return rowY;
    }

    // ---- setting rendering --------------------------------------------------

    private int renderSetting(ClickGui gui, Setting<?> setting, int x, int y) {
        FontRenderer font = Minecraft.getMinecraft().fontRendererObj;
        Gui.drawRect(x, y, x + Panel.WIDTH, y + SETTING_HEIGHT, Theme.withOpacity(Theme.BACKGROUND, gui.getOpacity()));

        if (setting instanceof BooleanSetting) {
            BooleanSetting b = (BooleanSetting) setting;
            font.drawStringWithShadow(setting.getName(), x + 8, y + 2, Theme.TEXT_DIM);
            int boxColor = b.getValue() ? Theme.ACCENT : Theme.ACCENT_DIM;
            Gui.drawRect(x + Panel.WIDTH - 14, y + 2, x + Panel.WIDTH - 6, y + SETTING_HEIGHT - 2, boxColor);
        } else if (setting instanceof ModeSetting) {
            ModeSetting m = (ModeSetting) setting;
            font.drawStringWithShadow(setting.getName() + ": " + m.getValue(), x + 8, y + 2, Theme.TEXT_DIM);
        } else if (setting instanceof NumberSetting) {
            NumberSetting n = (NumberSetting) setting;
            String label = setting.getName() + ": " + formatNumber(n.getValue());
            font.drawStringWithShadow(label, x + 8, y + 1, Theme.TEXT_DIM);
            int barX = x + 8;
            int barWidth = Panel.WIDTH - 16;
            int barY = y + SETTING_HEIGHT - 3;
            float frac = (float) ((n.getValue() - n.getMin()) / (n.getMax() - n.getMin()));
            Gui.drawRect(barX, barY, barX + barWidth, barY + 1, Theme.ACCENT_DIM);
            Gui.drawRect(barX, barY, barX + (int) (barWidth * frac), barY + 1, Theme.ACCENT);
        }
        return y + SETTING_HEIGHT;
    }

    private int renderBindRow(ClickGui gui, int x, int y) {
        FontRenderer font = Minecraft.getMinecraft().fontRendererObj;
        Gui.drawRect(x, y, x + Panel.WIDTH, y + SETTING_HEIGHT, Theme.withOpacity(Theme.BACKGROUND, gui.getOpacity()));
        boolean binding = gui.bindingModule == module;
        String value = binding ? "..." : module.getKeyBindName();
        font.drawStringWithShadow("Bind: " + value, x + 8, y + 2, binding ? Theme.ACCENT : Theme.TEXT_DIM);
        return y + SETTING_HEIGHT;
    }

    private void handleSettingClick(ClickGui gui, Setting<?> setting, int x, int rowY, int mouseX, int button) {
        if (setting instanceof BooleanSetting) {
            ((BooleanSetting) setting).toggle();
        } else if (setting instanceof ModeSetting) {
            ((ModeSetting) setting).cycle();
        } else if (setting instanceof NumberSetting) {
            NumberSetting n = (NumberSetting) setting;
            int barX = x + 8;
            int barWidth = Panel.WIDTH - 16;
            SliderState state = new SliderState(n, barX, barWidth);
            state.update(mouseX);
            gui.draggingSlider = state; // dragging continues in ClickGui.mouseClickMove
        }
    }

    private String formatNumber(double value) {
        if (value == Math.floor(value)) {
            return Integer.toString((int) value);
        }
        return String.format("%.2f", value);
    }

    private boolean isOver(int x, int y, int w, int h, int mouseX, int mouseY) {
        return mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
    }

    /** Tracks an in-progress slider drag, including its bar geometry. */
    public static class SliderState {
        private final NumberSetting setting;
        private final int barX;
        private final int barWidth;

        SliderState(NumberSetting setting, int barX, int barWidth) {
            this.setting = setting;
            this.barX = barX;
            this.barWidth = barWidth;
        }

        public void update(int mouseX) {
            double frac = Math.max(0, Math.min(1, (mouseX - barX) / (double) barWidth));
            double range = setting.getMax() - setting.getMin();
            setting.setValue(setting.getMin() + frac * range);
        }
    }
}
