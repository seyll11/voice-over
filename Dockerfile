# ---------- Stage 1: build (Maven + JDK 25, profile production untuk Vaadin) ----------
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline -Pproduction || true
COPY src ./src
RUN mvn -B clean package -Pproduction -DskipTests

# ---------- Stage 2: runtime ----------
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENV JAVA_TOOL_OPTIONS="-Xms128m -Xmx300m -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k -XX:MaxMetaspaceSize=128m" \
    VAADIN_PRODUCTIONMODE=true \
    SPRING_DEVTOOLS_RESTART_ENABLED=false \
    VAADIN_LAUNCHBROWSER=false
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
