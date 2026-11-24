# Build from the repo root: docker build -f apps/api/Dockerfile .
FROM eclipse-temurin:21-jdk AS build
WORKDIR /repo/apps/api
COPY apps/api/gradlew apps/api/settings.gradle.kts apps/api/build.gradle.kts ./
COPY apps/api/gradle ./gradle
RUN ./gradlew --no-daemon dependencies > /dev/null
COPY apps/api/src ./src
RUN ./gradlew --no-daemon bootJar -x test

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN groupadd --system app && useradd --system --gid app app
COPY --from=build /repo/apps/api/build/libs/*.jar app.jar
COPY packages/experiments /app/experiments
RUN chown -R app:app /app
USER app
ENV VIXIR_EXPERIMENTS_DIR=/app/experiments
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
