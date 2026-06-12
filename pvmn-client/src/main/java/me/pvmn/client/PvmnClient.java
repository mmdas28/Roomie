package me.pvmn.client;

import me.pvmn.client.gui.clickgui.ClickGui;
import me.pvmn.client.module.ModuleManager;
import me.pvmn.client.util.ConfigManager;
import net.minecraftforge.common.MinecraftForge;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.common.Mod.EventHandler;
import net.minecraftforge.fml.common.event.FMLInitializationEvent;

/**
 * Main entry point for pvmn.exe.
 *
 * <p>This is a normal Forge mod: build it to a jar, drop the jar into your
 * {@code .minecraft/mods} folder and launch the 1.8.9 Forge profile. The mod
 * loads inside the game's JVM, so there is no external injection step.</p>
 *
 * <p>The client name shown in-game ("pvmn.exe") is intentionally distinct from
 * the jar file name.</p>
 */
@Mod(modid = PvmnClient.MOD_ID, name = PvmnClient.NAME, version = PvmnClient.VERSION, clientSideOnly = true)
public class PvmnClient {

    public static final String MOD_ID = "pvmn";
    /** The display name of the client. NOT the jar file name. */
    public static final String NAME = "pvmn.exe";
    public static final String VERSION = "1.0.0";

    public static PvmnClient INSTANCE;

    private ModuleManager moduleManager;
    private ClickGui clickGui;
    private ConfigManager configManager;

    @EventHandler
    public void init(FMLInitializationEvent event) {
        INSTANCE = this;

        moduleManager = new ModuleManager();
        clickGui = new ClickGui();
        configManager = new ConfigManager(this);

        // Register the global event router. Individual modules are registered
        // by the ModuleManager so their @SubscribeEvent hooks fire too.
        MinecraftForge.EVENT_BUS.register(new EventHandlers());

        // Restore the user's saved toggles, binds and settings.
        configManager.load();

        // Persist on a clean shutdown.
        Runtime.getRuntime().addShutdownHook(new Thread(() -> configManager.save()));
    }

    public ModuleManager getModuleManager() {
        return moduleManager;
    }

    public ClickGui getClickGui() {
        return clickGui;
    }

    public ConfigManager getConfigManager() {
        return configManager;
    }
}
