package org.vixir.marking;

/**
 * Ordinary least-squares linear regression y = a + b*x.
 * Pure — no Spring, no I/O (Req 10.10).
 */
public final class Regression {

    private Regression() {}

    public record Result(double slope, double intercept, int n) {}

    /**
     * Fits y = intercept + slope * x over the supplied paired arrays.
     * Requires at least 2 distinct x values; throws IllegalArgumentException otherwise.
     */
    public static Result fit(double[] x, double[] y) {
        if (x.length != y.length || x.length < 2) {
            throw new IllegalArgumentException("Need at least 2 data points");
        }
        int n = x.length;
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (int i = 0; i < n; i++) {
            sumX  += x[i];
            sumY  += y[i];
            sumXY += x[i] * y[i];
            sumX2 += x[i] * x[i];
        }
        double denom = n * sumX2 - sumX * sumX;
        if (Math.abs(denom) < 1e-15) {
            throw new IllegalArgumentException("All x values are identical; cannot fit a line");
        }
        double slope     = (n * sumXY - sumX * sumY) / denom;
        double intercept = (sumY - slope * sumX) / n;
        return new Result(slope, intercept, n);
    }
}
