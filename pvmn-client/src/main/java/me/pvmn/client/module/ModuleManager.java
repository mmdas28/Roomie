package me.pvmn.client.module;

import me.pvmn.client.module.modules.render.ClickGuiModule;
import me.pvmn.client.module.modules.render.FpsBoost;
import me.pvmn.client.module.modules.render.FullBright;
import me.pvmn.client.module.modules.render.HudModule;
import net.minecraftforge.common.MinecraftForge;

import java.util.ArrayList;
import java.util.List;

/**
 * Owns every module instance and exposes lookups used by the ClickGUI and config.
 *
 * <p>To ship a new module: create the class, then add one line to
 * {@link #registerModules()}. Nothing else is required.</p>
 */
public class ModuleManager {

    private final List<Module> modules = new ArrayList<>();

    public ModuleManager() {
        registerModules();
    }

    private void registerModules() {
        register(new ClickGuiModule());
        register(new FpsBoost());
        register(new FullBright());
        register(new HudModule());
    }

    private void register(Module module) {
        modules.add(module);
        // Registering on the event bus lets a module use @SubscribeEvent hooks.
        // Each hook is responsible for checking module.isEnabled() itself.
        MinecraftForge.EVENT_BUS.register(module);
    }

    public List<Module> getModules() {
        return modules;
    }

    public List<Module> getModulesIn(Category category) {
        List<Module> result = new ArrayList<>();
        for (Module module : modules) {
            if (module.getCategory() == category) {
                result.add(module);
            }
        }
        return result;
    }

    public Module getByName(String name) {
        for (Module module : modules) {
            if (module.getName().equalsIgnoreCase(name)) {
                return module;
            }
        }
        return null;
    }
}
