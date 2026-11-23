package org.vixir.school;

import java.security.SecureRandom;
import java.util.Locale;
import java.util.random.RandomGenerator;
import org.springframework.stereotype.Component;

/** Class join codes like PHY-SS3-7KQ2 (backend-api Req 4.1). Pure, so it is property-tested with jqwik. */
@Component
public final class JoinCodeGenerator {
    /** No 0/O, 1/I/L — easy to read aloud and type on a phone. */
    public static final String ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    private final RandomGenerator random;

    public JoinCodeGenerator() { this(new SecureRandom()); }
    public JoinCodeGenerator(RandomGenerator random) { this.random = random; }

    public String next(String subject, String level) {
        var sb = new StringBuilder();
        for (int i = 0; i < 4; i++) sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        return prefix(subject) + "-" + level.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "") + "-" + sb;
    }

    static String prefix(String subject) {
        var s = subject.toUpperCase(Locale.ROOT).replaceAll("[^A-Z]", "");
        return s.length() >= 3 ? s.substring(0, 3) : (s + "XXX").substring(0, 3);
    }
}
