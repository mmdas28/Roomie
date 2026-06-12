package me.pvmn.client.util;

import me.pvmn.client.PvmnClient;
import me.pvmn.client.module.Module;
import me.pvmn.client.module.setting.Setting;
import net.minecraft.client.Minecraft;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.Properties;

/**
 * Flat properties-based persistence for module state. Stored under
 * {@code .minecraft/pvmn/config.properties}. Kept dependency-free on purpose so
 * the jar ships with nothing but the mod itself.
 */
public class ConfigManager {

    private final PvmnClient client;
    private final File configFile;

    public ConfigManager(PvmnClient client) {
        this.client = client;
        File dir = new File(Minecraft.getMinecraft().mcDataDir, "pvmn");
        if (!dir.exists()) {
            dir.mkdirs();
        }
        this.configFile = new File(dir, "config.properties");
    }

    public void save() {
        Properties props = new Properties();
        for (Module module : client.getModuleManager().getModules()) {
            String prefix = "module." + module.getName();
            props.setProperty(prefix + ".enabled", Boolean.toString(module.isEnabled()));
            props.setProperty(prefix + ".bind", Integer.toString(module.getKeyBind()));
            for (Setting<?> setting : module.getSettings()) {
                props.setProperty(prefix + ".setting." + setting.getName(), setting.serialize());
            }
        }
        try (FileOutputStream out = new FileOutputStream(configFile)) {
            props.store(out, "pvmn.exe configuration");
        } catch (Exception e) {
            System.err.println("[pvmn.exe] Failed to save config: " + e.getMessage());
        }
    }

    public void load() {
        if (!configFile.exists()) {
            return;
        }
        Properties props = new Properties();
        try (FileInputStream in = new FileInputStream(configFile)) {
            props.load(in);
        } catch (Exception e) {
            System.err.println("[pvmn.exe] Failed to load config: " + e.getMessage());
            return;
        }

        for (Module module : client.getModuleManager().getModules()) {
            String prefix = "module." + module.getName();

            String bind = props.getProperty(prefix + ".bind");
            if (bind != null) {
                try {
                    module.setKeyBind(Integer.parseInt(bind));
                } catch (NumberFormatException ignored) {
                }
            }

            for (Setting<?> setting : module.getSettings()) {
                String raw = props.getProperty(prefix + ".setting." + setting.getName());
                if (raw != null) {
                    setting.deserialize(raw);
                }
            }

            // Apply enabled state last so onEnable() sees restored settings.
            String enabled = props.getProperty(prefix + ".enabled");
            if (enabled != null) {
                module.setEnabled(Boolean.parseBoolean(enabled));
            }
        }
    }
}
