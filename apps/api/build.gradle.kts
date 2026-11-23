plugins {
    java
    id("org.springframework.boot") version "4.2.0"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "org.vixir"
version = "0.1.0"

java {
    toolchain { languageVersion = JavaLanguageVersion.of(21) }
}

repositories { mavenCentral() }

dependencies {
    // Web, validation, JPA, Security, Actuator
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
    implementation("org.springframework.boot:spring-boot-starter-actuator")

    // Database migrations
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")

    // OpenAPI / Swagger
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.9")

    // JWT encoding (issuing access + refresh tokens)
    implementation("com.nimbusds:nimbus-jose-jwt:9.40")

    // Password hashing — argon2id
    implementation("org.bouncycastle:bcprov-jdk18on:1.79")

    // JSON schema validation for experiment configs
    implementation("com.networknt:json-schema-validator:1.5.6")

    // Rate limiting — implemented via in-process token bucket (no extra dep needed)

    // LiveKit server SDK (room token + agent dispatch)
    // Using nimbus-jose-jwt directly for token generation to avoid SDK version coupling
    // implementation("io.livekit:livekit-server:0.9.0")

    // JSON serialisation helpers
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")

    // Postgres driver + Micrometer/Prometheus
    runtimeOnly("org.postgresql:postgresql")
    runtimeOnly("io.micrometer:micrometer-registry-prometheus")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.testcontainers:junit-jupiter")
    testImplementation("org.testcontainers:postgresql")
    testImplementation("net.jqwik:jqwik:1.10.2")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
    useJUnitPlatform { includeEngines("junit-jupiter", "jqwik") }
}
