FROM eclipse-temurin:17-jdk AS builder

WORKDIR /app

# Install sbt
RUN apt-get update && apt-get install -y curl && \
    curl -fL https://github.com/sbt/sbt/releases/download/v1.11.3/sbt-1.11.3.tgz | tar xz -C /usr/local && \
    ln -s /usr/local/sbt/bin/sbt /usr/local/bin/sbt

# Copy project files
COPY build.sbt .
COPY project/ project/

# Download dependencies (cached layer)
RUN sbt update

# Copy source code
COPY src/ src/

# Build fat JAR
RUN sbt assembly

# Runtime image
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=builder /app/target/scala-3.7.1/invoice-generator-service-assembly-0.1.0-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
