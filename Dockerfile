# In multi-stage builds only the last stage is used for running,
# where as the previous or inital stages are for building jar or compiling
# other operations!


# STAGE 1: Building the Application
FROM  maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /stoxyFinance

COPY pom.xml pom.xml

RUN mvn dependency:resolve

COPY src /stoxyFinance/src

RUN mvn clean -DskipTests package

# STAGE 2: Running the application
FROM eclipse-temurin:21-jre-alpine AS app

WORKDIR /stoxyFinance

COPY --from=builder /stoxyFinance/target/stoxy-backend.jar app/stoxy_backend.jar


ENTRYPOINT ["java","-XX:MaxRAMPercentage=75.0", "-jar", "/stoxyFinance/app/stoxy_backend.jar"]


# Notes:
# Docker's COPY rule — if destination ends with / it treats it as a folder. If it doesn't end with / it treats it as the filename.
# thats why this is folders COPY /target/live-stock-checker-0.0.1-SNAPSHOT.jar /stoxyFinance/target/jar/ and inside this
# the file gets copied where as COPY /target/live-stock-checker-0.0.1-SNAPSHOT.jar /stoxyFinance/target/jar this means copy
# the first file into this destination file with the name jar
# COPY <source-path> <destination-path>

# To copy from previous stages:
# COPY --from=<stage_alias> <source_path_in_that_stage> <destination_path_in_current_stage>