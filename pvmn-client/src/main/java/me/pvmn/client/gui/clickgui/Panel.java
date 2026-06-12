package me.pvmn.client.gui.clickgui;

import me.pvmn.client.PvmnClient;
import me.pvmn.client.module.Category;
import me.pvmn.client.module.Module;
import me.pvmn.client.util.Theme;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.FontRenderer;
import net.minecraft.client.gui.Gui;

import java.util.ArrayList;
import java.util.List;

/** A single draggable category window in the ClickGUI. */
public class Panel {

    public static final int WIDTH = 96;
    public static final int HEADER_HEIGHT = 14;

    private final Category category;
    private final List<ModuleButton> buttons = new ArrayList<>();

    private int x;
    private int y;
    private boolean open = true;

    private boolean dragging;
    private int dragOffsetX;
    private int dragOffsetY;

    public Panel(Category category, int x, int y) {
        this.category = category;
        this.x = x;
        this.y = y;
        for (Module module : PvmnClient.INSTANCE.getModuleManager().getModulesIn(category)) {
            buttons.add(new ModuleButton(module));
        }
    }

    public void render(ClickGui gui, int mouseX, int mouseY) {
        FontRenderer font = Minecraft.getMinecraft().fontRendererObj;
        int bgColor = Theme.withOpacity(Theme.HEADER, gui.getOpacity());

        // Header
        Gui.drawRect(x, y, x + WIDTH, y + HEADER_HEIGHT, bgColor);
        Gui.drawRect(x, y + HEADER_HEIGHT - 1, x + WIDTH, y + HEADER_HEIGHT, Theme.ACCENT);
        font.drawStringWithShadow(category.getDisplayName(), x + 5, y + 3, Theme.TEXT);
        String chevron = open ? "-" : "+";
        font.drawStringWithShadow(chevron, x + WIDTH - 9, y + 3, Theme.TEXT_DIM);

        if (!open) {
            return;
        }

        int rowY = y + HEADER_HEIGHT;
        for (ModuleButton button : buttons) {
            rowY = button.render(gui, x, rowY, mouseX, mouseY);
        }
    }

    public boolean mouseClicked(ClickGui gui, int mouseX, int mouseY, int button) {
        // Header interactions: left = drag, right = collapse/expand.
        if (isOverHeader(mouseX, mouseY)) {
            if (button == 0) {
                dragging = true;
                dragOffsetX = mouseX - x;
                dragOffsetY = mouseY - y;
            } else if (button == 1) {
                open = !open;
            }
            return true;
        }

        if (!open) {
            return false;
        }

        int rowY = y + HEADER_HEIGHT;
        for (ModuleButton moduleButton : buttons) {
            int consumedTo = moduleButton.mouseClicked(gui, x, rowY, mouseX, mouseY, button);
            if (consumedTo < 0) {
                return true; // handled
            }
            rowY = consumedTo;
        }
        return false;
    }

    public void onDrag(int mouseX, int mouseY) {
        if (dragging) {
            x = mouseX - dragOffsetX;
            y = mouseY - dragOffsetY;
        }
    }

    public void mouseReleased() {
        dragging = false;
    }

    private boolean isOverHeader(int mouseX, int mouseY) {
        return mouseX >= x && mouseX <= x + WIDTH && mouseY >= y && mouseY <= y + HEADER_HEIGHT;
    }
}
