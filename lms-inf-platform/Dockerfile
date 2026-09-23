FROM maven:3.9.9-eclipse-temurin-24 AS build

WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

FROM eclipse-temurin:24-jdk

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Runtime only: leave room in the 512 MiB container for native JVM memory,
# class metadata, thread stacks and HTTP/database buffers (not just the heap).
# Render environment variables can override these defaults when scaling up.
ENV JAVA_TOOL_OPTIONS="-Xms64m -Xmx192m -Xss512k -XX:MaxMetaspaceSize=128m -XX:ReservedCodeCacheSize=32m -XX:MaxDirectMemorySize=16m -XX:+UseSerialGC -XX:ActiveProcessorCount=2 -XX:+ExitOnOutOfMemoryError"
ENV SPRING_PROFILES_INCLUDE=render

EXPOSE 10000

CMD ["sh", "-c", "exec java -Dserver.address=0.0.0.0 -Dserver.port=${PORT:-10000} -jar app.jar"]
