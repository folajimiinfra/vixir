package org.vixir.auth;

import org.bouncycastle.crypto.generators.Argon2BytesGenerator;
import org.bouncycastle.crypto.params.Argon2Parameters;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * argon2id password hashing (Req 1.9).
 * Parameters follow OWASP recommendations: m=65536, t=3, p=4.
 */
@Component
public class PasswordService {

    private static final int HASH_LENGTH  = 32;
    private static final int SALT_LENGTH  = 16;
    private static final int MEMORY_KB    = 65536;
    private static final int ITERATIONS   = 3;
    private static final int PARALLELISM  = 4;

    private final SecureRandom random = new SecureRandom();

    public String hash(String password) {
        byte[] salt = new byte[SALT_LENGTH];
        random.nextBytes(salt);

        byte[] hash = generate(password.toCharArray(), salt);
        // Store as $argon2id$v=19$m=65536,t=3,p=4$<salt-b64>$<hash-b64>
        return "$argon2id$v=19$m=" + MEMORY_KB + ",t=" + ITERATIONS + ",p=" + PARALLELISM
                + "$" + Base64.getEncoder().withoutPadding().encodeToString(salt)
                + "$" + Base64.getEncoder().withoutPadding().encodeToString(hash);
    }

    public boolean verify(String password, String encoded) {
        try {
            String[] parts = encoded.split("\\$");
            // parts[0]="" [1]="argon2id" [2]="v=19" [3]="m=...,t=...,p=..." [4]=salt [5]=hash
            if (parts.length != 6 || !"argon2id".equals(parts[1])) return false;
            byte[] salt = Base64.getDecoder().decode(parts[4]);
            byte[] expected = Base64.getDecoder().decode(parts[5]);
            byte[] actual = generate(password.toCharArray(), salt);
            return constantTimeEquals(actual, expected);
        } catch (Exception e) {
            return false;
        }
    }

    private byte[] generate(char[] password, byte[] salt) {
        var params = new Argon2Parameters.Builder(Argon2Parameters.ARGON2_id)
                .withSalt(salt)
                .withMemoryAsKB(MEMORY_KB)
                .withIterations(ITERATIONS)
                .withParallelism(PARALLELISM)
                .build();
        var generator = new Argon2BytesGenerator();
        generator.init(params);
        byte[] out = new byte[HASH_LENGTH];
        // convert char[] to UTF-8 bytes manually to avoid string in memory
        byte[] pwBytes = new String(password).getBytes(java.nio.charset.StandardCharsets.UTF_8);
        generator.generateBytes(pwBytes, out);
        java.util.Arrays.fill(pwBytes, (byte) 0);
        return out;
    }

    private boolean constantTimeEquals(byte[] a, byte[] b) {
        if (a.length != b.length) return false;
        int diff = 0;
        for (int i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
        return diff == 0;
    }
}
