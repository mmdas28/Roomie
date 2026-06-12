package me.pvmn.client.module.setting;

/** A numeric slider bounded by min/max and snapped to an increment. */
public class NumberSetting extends Setting<Double> {

    private final double min;
    private final double max;
    private final double increment;

    public NumberSetting(String name, double defaultValue, double min, double max, double increment) {
        super(name, defaultValue);
        this.min = min;
        this.max = max;
        this.increment = increment;
    }

    @Override
    public void setValue(Double value) {
        // Clamp then snap to the nearest increment step.
        double clamped = Math.max(min, Math.min(max, value));
        double snapped = Math.round(clamped / increment) * increment;
        super.setValue(snapped);
    }

    public double getMin() {
        return min;
    }

    public double getMax() {
        return max;
    }

    public int getValueInt() {
        return (int) Math.round(getValue());
    }

    @Override
    public String serialize() {
        return Double.toString(getValue());
    }

    @Override
    public void deserialize(String raw) {
        try {
            setValue(Double.parseDouble(raw));
        } catch (NumberFormatException ignored) {
            // Keep the default on malformed input.
        }
    }
}
