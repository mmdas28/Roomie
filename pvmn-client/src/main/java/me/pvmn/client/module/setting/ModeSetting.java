package me.pvmn.client.module.setting;

import java.util.Arrays;
import java.util.List;

/** A cyclable list of named choices (e.g. "Low" / "Medium" / "High"). */
public class ModeSetting extends Setting<String> {

    private final List<String> modes;

    public ModeSetting(String name, String defaultMode, String... modes) {
        super(name, defaultMode);
        this.modes = Arrays.asList(modes);
    }

    /** Advance to the next mode, wrapping around at the end. */
    public void cycle() {
        int index = modes.indexOf(getValue());
        index = (index + 1) % modes.size();
        setValue(modes.get(index));
    }

    public boolean is(String mode) {
        return getValue().equalsIgnoreCase(mode);
    }

    public List<String> getModes() {
        return modes;
    }

    @Override
    public String serialize() {
        return getValue();
    }

    @Override
    public void deserialize(String raw) {
        if (modes.contains(raw)) {
            setValue(raw);
        }
    }
}
