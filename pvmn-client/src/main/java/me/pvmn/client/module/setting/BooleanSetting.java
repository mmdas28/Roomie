package me.pvmn.client.module.setting;

/** A simple on/off toggle. */
public class BooleanSetting extends Setting<Boolean> {

    public BooleanSetting(String name, boolean defaultValue) {
        super(name, defaultValue);
    }

    public void toggle() {
        setValue(!getValue());
    }

    @Override
    public String serialize() {
        return Boolean.toString(getValue());
    }

    @Override
    public void deserialize(String raw) {
        setValue(Boolean.parseBoolean(raw));
    }
}
