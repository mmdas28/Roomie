package me.pvmn.client.util;

/**
 * Central color palette for the Raven B++ inspired look: a near-black surface
 * with a single cool accent, kept deliberately minimal and high-contrast.
 */
public final class Theme {

    private Theme() {
    }

    // Surfaces
    public static final int BACKGROUND = 0xF00E0E12; // panel body
    public static final int HEADER = 0xFF15151B;     // panel header
    public static final int MODULE_BG = 0x00000000;  // transparent row
    public static final int MODULE_HOVER = 0x33FFFFFF;
    public static final int OUTLINE = 0xFF000000;

    // Accent (purple/indigo — the classic "Raven" cool tone)
    public static final int ACCENT = 0xFF7A5CFF;
    public static final int ACCENT_DIM = 0xFF4B3CA0;

    // Text
    public static final int TEXT = 0xFFE8E8F0;
    public static final int TEXT_DIM = 0xFF8A8A99;
    public static final int TEXT_ENABLED = 0xFFFFFFFF;

    /** Linearly blend two ARGB colors. {@code t} in [0,1]. */
    public static int blend(int a, int b, float t) {
        t = Math.max(0F, Math.min(1F, t));
        int aa = (a >> 24) & 0xFF, ar = (a >> 16) & 0xFF, ag = (a >> 8) & 0xFF, ab = a & 0xFF;
        int ba = (b >> 24) & 0xFF, br = (b >> 16) & 0xFF, bg = (b >> 8) & 0xFF, bb = b & 0xFF;
        int ca = (int) (aa + (ba - aa) * t);
        int cr = (int) (ar + (br - ar) * t);
        int cg = (int) (ag + (bg - ag) * t);
        int cb = (int) (ab + (bb - ab) * t);
        return (ca << 24) | (cr << 16) | (cg << 8) | cb;
    }

    /** Apply an opacity (0-100) to the alpha channel of a color. */
    public static int withOpacity(int color, double opacityPercent) {
        int alpha = (int) (255 * Math.max(0, Math.min(100, opacityPercent)) / 100.0);
        return (alpha << 24) | (color & 0x00FFFFFF);
    }
}
