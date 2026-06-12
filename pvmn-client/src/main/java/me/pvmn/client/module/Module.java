package me.pvmn.client.module;

import me.pvmn.client.module.setting.Setting;
import net.minecraft.client.Minecraft;
import org.lwjgl.input.Keyboard;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Base class for every feature in the client.
 *
 * <p>Adding a new module is intentionally trivial: extend this class, call
 * {@code super(...)} with a name/description/category, optionally register
 * settings in the constructor, override {@link #onEnable()} / {@link #onDisable()}
 * and/or add {@code @SubscribeEvent} methods. Then register one instance in
 * {@link ModuleManager}. The ClickGUI and config system pick it up automatically.</p>
 */
public abstract class Module {

    protected final Minecraft mc = Minecraft.getMinecraft();

    private final String name;
    private final String description;
    private final Category category;
    private final List<Setting<?>> settings = new ArrayList<>();

    private int keyBind = Keyboard.KEY_NONE;
    private boolean enabled;

    public Module(String name, String description, Category category) {
        this.name = name;
        this.description = description;
        this.category = category;
    }

    /** Register settings that should show up under this module in the ClickGUI. */
    protected void addSettings(Setting<?>... toAdd) {
        Collections.addAll(settings, toAdd);
    }

    public void toggle() {
        setEnabled(!enabled);
    }

    public void setEnabled(boolean enabled) {
        if (this.enabled == enabled) {
            return;
        }
        this.enabled = enabled;
        if (enabled) {
            onEnable();
        } else {
            onDisable();
        }
    }

    /** Called once when the module switches on. */
    public void onEnable() {
    }

    /** Called once when the module switches off. */
    public void onDisable() {
    }

    public boolean isEnabled() {
        return enabled;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public Category getCategory() {
        return category;
    }

    public List<Setting<?>> getSettings() {
        return settings;
    }

    public int getKeyBind() {
        return keyBind;
    }

    public void setKeyBind(int keyBind) {
        this.keyBind = keyBind;
    }

    public String getKeyBindName() {
        return keyBind == Keyboard.KEY_NONE ? "None" : Keyboard.getKeyName(keyBind);
    }
}
