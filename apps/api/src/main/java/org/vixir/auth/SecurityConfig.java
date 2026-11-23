package org.vixir.auth;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import java.time.Instant;
import java.util.Objects;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Stateless JWT security (Req 1–2).
 * Access tokens are HS256 signed with VIXIR_JWT_SECRET.
 * Method-level security (@PreAuthorize) enforces ownership in services.
 *
 * Two chains: /api/v1/internal/** (Vix agent) accepts only service JWTs signed with VIXIR_SERVICE_SECRET
 * that carry scope=vix-agent and an expiry; everything else accepts user access tokens.
 * Keep the two secrets different, or a token for one audience would verify for the other.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    @Order(1)
    SecurityFilterChain internal(HttpSecurity http,
                                 @Value("${vixir.service-secret}") String serviceSecret) throws Exception {
        http
            .securityMatcher("/api/v1/internal/**")
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // The default converter maps the "scope" claim to SCOPE_<value> authorities.
            .authorizeHttpRequests(auth -> auth.anyRequest().hasAuthority("SCOPE_vix-agent"))
            .oauth2ResourceServer(o -> o.jwt(j -> j.decoder(hmacDecoder(serviceSecret))));
        return http.build();
    }

    @Bean
    @Order(2)
    SecurityFilterChain api(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public paths — Req 2.1
                .requestMatchers(
                    "/api/v1/ping",
                    "/api/v1/auth/**",
                    "/actuator/health",
                    "/actuator/health/**",
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()
                // Public reads — Req 2.1
                .requestMatchers(HttpMethod.GET, "/api/v1/experiments/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/vix/tours/**").permitAll()
                // Anonymous practice — Req 7.5
                .requestMatchers(HttpMethod.POST, "/api/v1/attempts/anonymous").permitAll()
                // Everything else requires a valid token
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));
        return http.build();
    }

    @Bean
    JwtDecoder jwtDecoder(@Value("${vixir.jwt-secret}") String secret) {
        return hmacDecoder(secret);
    }

    /** HS256 decoder that also rejects tokens without an expiry (the default only checks exp when present). */
    private static JwtDecoder hmacDecoder(String secret) {
        var key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        var decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<Jwt>(
                JwtValidators.createDefault(),
                new JwtClaimValidator<Instant>("exp", Objects::nonNull)));
        return decoder;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(@Value("${vixir.web-origins}") String origins) {
        var cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(Arrays.stream(origins.split(",")).map(String::trim).toList());
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of(
            "Authorization", "Content-Type", "X-Request-Id", "Idempotency-Key"));
        cfg.setAllowCredentials(true);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
