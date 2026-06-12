package me.pvmn.client.gui.clickgui;

import me.pvmn.client.PvmnClient;
import me.pvmn.client.module.Category;
import me.pvmn.client.module.Module;
import me.pvmn.client.module.modules.render.ClickGuiModule;
import net.minecraft.client.gui.GuiScreen;
import org.lwjgl.input.Keyboard;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * The Raven B++ inspired ClickGUI. One draggable panel per {@link Category},
 * each holding its modules. Left-click toggles a module, right-click expands its
 * settings. Modules and settings are discovered automatically, so adding a new
 * one never requires touching this class.
 */
public class ClickGui extends GuiScreen {

    private final List<Panel> panels = new ArrayList<>();

    /** Non-null while the user is rebinding a module's key. */
    public Module bindingModule;
    /** Non-null while the user is dragging a numeric slider. */
    public Object draggingSlider;

    @Override
    public void initGui() {
        if (!panels.isEmpty()) {
            return; // Preserve panel positions across re-opens.
        }
        int x = 6;
        for (Category category : Category.values()) {
            panels.add(new Panel(category, x, 6));
            x += Panel.WIDTH + 6;
        }
    }

    public double getOpacity() {
        ClickGuiModule module = (ClickGuiModule) PvmnClient.INSTANCE.getModuleManager().getByName("ClickGUI");
        return module == null ? 100 : module.opacity.getValue();
    }

    @Override
    public void drawScreen(int mouseX, int mouseY, float partialTicks) {
        // Subtle dim so the world stays readable behind the menu.
        drawGradientRect(0, 0, width, height, 0x55000000, 0x88000000);
        for (Panel panel : panels) {
            panel.render(this, mouseX, mouseY);
        }
        super.drawScreen(mouseX, mouseY, partialTicks);
    }

    @Override
    protected void mouseClicked(int mouseX, int mouseY, int mouseButton) throws IOException {
        for (Panel panel : panels) {
            if (panel.mouseClicked(this, mouseX, mouseY, mouseButton)) {
                return;
            }
        }
        super.mouseClicked(mouseX, mouseY, mouseButton);
    }

    @Override
    protected void mouseReleased(int mouseX, int mouseY, int state) {
        for (Panel panel : panels) {
            panel.mouseReleased();
        }
        draggingSlider = null;
        super.mouseReleased(mouseX, mouseY, state);
    }

    @Override
    protected void mouseClickMove(int mouseX, int mouseY, int clickedMouseButton, long timeSinceLastClick) {
        for (Panel panel : panels) {
            panel.onDrag(mouseX, mouseY);
        }
        if (draggingSlider instanceof ModuleButton.SliderState) {
            ((ModuleButton.SliderState) draggingSlider).update(mouseX);
        }
    }

    @Override
    protected void keyTyped(char typedChar, int keyCode) throws IOException {
        // Live rebinding: the next key pressed becomes the module's bind.
        if (bindingModule != null) {
            bindingModule.setKeyBind(keyCode == Keyboard.KEY_ESCAPE ? Keyboard.KEY_NONE : keyCode);
            bindingModule = null;
            return;
        }
        // Right-Shift (or whatever the ClickGUI is bound to) also closes the menu.
        Module clickGui = PvmnClient.INSTANCE.getModuleManager().getByName("ClickGUI");
        if (keyCode == Keyboard.KEY_ESCAPE || (clickGui != null && keyCode == clickGui.getKeyBind())) {
            mc.displayGuiScreen(null);
            return;
        }
        super.keyTyped(typedChar, keyCode);
    }

    @Override
    public boolean doesGuiPauseGame() {
        return false;
    }

    @Override
    public void onGuiClosed() {
        // Persist toggles/binds/settings whenever the menu closes.
        PvmnClient.INSTANCE.getConfigManager().save();
    }
}
