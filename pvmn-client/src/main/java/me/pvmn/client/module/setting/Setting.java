package me.pvmn.client.module.setting;

/**
 * A single configurable value attached to a module. Subclasses define how the
 * value is rendered/edited in the ClickGUI and how it serializes to config.
 */
public abstract class Setting<T> {

    private final String name;
    protected T value;

    public Setting(String name, T defaultValue) {
        this.name = name;
        this.value = defaultValue;
    }

    public String getName() {
        return name;
    }

    public T getValue() {
        return value;
    }

    public void setValue(T value) {
        this.value = value;
    }

    /** Serialize the current value to a flat string for config storage. */
    public abstract String serialize();

    /** Restore the value from a previously serialized string. */
    public abstract void deserialize(String raw);
}
