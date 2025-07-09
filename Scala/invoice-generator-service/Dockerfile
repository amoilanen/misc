# Multi-stage build for Scala application
FROM openjdk:17-jdk-slim as builder

# Install sbt
RUN apt-get update && apt-get install -y curl
RUN curl -L -o sbt.deb https://repo.scala-sbt.org/scalasbt/debian/sbt-1.11.3.deb
RUN dpkg -i sbt.deb
RUN rm sbt.deb

# Set working directory
WORKDIR /app

# Copy build files
COPY build.sbt ./
COPY project/ ./project/

# Download dependencies
RUN sbt update

# Copy source code
COPY src/ ./src/

# Build the application
RUN sbt assembly

# Production stage
FROM openjdk:17-jre-slim

# Install necessary packages
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy the built jar from builder stage
COPY --from=builder /app/target/scala-3.7.1/invoice-generator-service-assembly-0.1.0-SNAPSHOT.jar ./app.jar

# Copy configuration files
COPY src/main/resources/application.conf ./config/application.conf
COPY src/main/resources/logback.xml ./config/logback.xml

# Create logs directory
RUN mkdir -p logs && chown -R appuser:appuser /app

# Switch to app user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/v1/health || exit 1

# Run the application
ENTRYPOINT ["java", "-Dconfig.file=./config/application.conf", "-Dlogback.configurationFile=./config/logback.xml", "-jar", "app.jar"] 