package me.pvmn.client.module;

/**
 * Module categories. Each category becomes one draggable panel in the ClickGUI.
 * Add a value here and the panel appears automatically.
 */
public enum Category {
    RENDER("Render"),
    PLAYER("Player"),
    MOVEMENT("Movement"),
    MISC("Misc"),
    CLIENT("Client");

    private final String displayName;

    Category(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
