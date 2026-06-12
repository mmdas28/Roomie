package me.pvmn.client;

import me.pvmn.client.gui.clickgui.ClickGui;
import me.pvmn.client.module.Module;
import me.pvmn.client.module.modules.render.ClickGuiModule;
import net.minecraft.client.Minecraft;
import net.minecraftforge.fml.common.eventhandler.SubscribeEvent;
import net.minecraftforge.fml.common.gameevent.InputEvent;
import org.lwjgl.input.Keyboard;

/**
 * Global keyboard router. Forge only fires {@link InputEvent.KeyInputEvent}
 * while the player is in-world (no GuiScreen open), which is exactly when we
 * want binds and the ClickGUI toggle to respond.
 */
public class EventHandlers {

    @SubscribeEvent
    public void onKeyInput(InputEvent.KeyInputEvent event) {
        // Only react to the rising edge of a key press, never key-release.
        if (!Keyboard.getEventKeyState()) {
            return;
        }

        final int key = Keyboard.getEventKey();
        if (key == Keyboard.KEY_NONE) {
            return;
        }

        final Minecraft mc = Minecraft.getMinecraft();
        final ClickGui clickGui = PvmnClient.INSTANCE.getClickGui();

        for (Module module : PvmnClient.INSTANCE.getModuleManager().getModules()) {
            if (module.getKeyBind() != key) {
                continue;
            }

            // The ClickGUI's bind opens the menu instead of toggling a feature.
            if (module instanceof ClickGuiModule) {
                mc.displayGuiScreen(clickGui);
            } else {
                module.toggle();
            }
        }
    }
}
