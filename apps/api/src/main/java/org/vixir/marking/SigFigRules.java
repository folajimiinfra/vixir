package org.vixir.marking;

/**
 * Significant-figure and rounding consistency checks (Req 10.4).
 * Pure — no Spring, no I/O.
 */
public final class SigFigRules {

    private SigFigRules() {}

    /**
     * Returns true if |stated - recomputed| / |recomputed| ≤ 0.005 (0.5 %) after the stated
     * value is rounded to the precision it was given in.
     * @param stated      value the student wrote
     * @param recomputed  value computed from raw readings
     */
    public static boolean tableCheck(double stated, double recomputed) {
        if (Math.abs(recomputed) < 1e-15) return Math.abs(stated) < 1e-10;
        double relError = Math.abs(stated - recomputed) / Math.abs(recomputed);
        return relError <= 0.005;
    }

    /**
     * Returns the number of significant figures in a decimal string representation
     * such as "3.140", "0.00620", "1200.0".
     */
    public static int sigFigs(String valueStr) {
        if (valueStr == null || valueStr.isBlank()) return 0;
        String s = valueStr.trim().replaceFirst("^[+-]", "").replaceFirst("[eE].*", "");
        // Strip leading zeros and decimal point
        String digits = s.replace(".", "");
        int start = 0;
        while (start < digits.length() && digits.charAt(start) == '0') start++;
        if (start == digits.length()) return 1; // "0.000" = 1 sig fig
        // Count from first non-zero digit to end (trailing zeros after decimal point are significant)
        return digits.length() - start;
    }

    /**
     * Returns true if the student's stated value has the expected number of decimal places.
     * @param valueStr  the string as written (e.g. "3.14")
     * @param expected  number of decimal places required
     */
    public static boolean correctDecimalPlaces(String valueStr, int expected) {
        if (valueStr == null) return false;
        int dotIdx = valueStr.indexOf('.');
        if (dotIdx < 0) return expected == 0;
        int actual = valueStr.length() - dotIdx - 1;
        return actual == expected;
    }
}
