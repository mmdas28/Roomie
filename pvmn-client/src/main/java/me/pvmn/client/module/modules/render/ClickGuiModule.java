package me.pvmn.client.module.modules.render;

import me.pvmn.client.module.Category;
import me.pvmn.client.module.Module;
import me.pvmn.client.module.setting.ModeSetting;
import me.pvmn.client.module.setting.NumberSetting;
import org.lwjgl.input.Keyboard;

/**
 * Represents the ClickGUI itself. Its keybind (default Right-Shift) opens the
 * menu rather than toggling a feature; see EventHandlers. The bind is fully
 * customizable in-game via the ClickGUI (right-click this entry, then "Bind").
 */
public class ClickGuiModule extends Module {

    public final ModeSetting theme = new ModeSetting("Theme", "Raven", "Raven", "Midnight", "Mono");
    public final NumberSetting opacity = new NumberSetting("Opacity", 85, 30, 100, 1);

    public ClickGuiModule() {
        super("ClickGUI", "Opens the pvmn.exe menu.", Category.CLIENT);
        setKeyBind(Keyboard.KEY_RSHIFT);
        addSettings(theme, opacity);
    }
}
