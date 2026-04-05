FROM eclipse-temurin:21-jre

WORKDIR /live-stock-checker


COPY target/live-stock-checker-0.0.1-SNAPSHOT.jar /app/stoxy_backend.jar

ENTRYPOINT ["java", "-jar", "/app/stoxy_backend.jar"]


# Notes:
# Docker's COPY rule — if destination ends with / it treats it as a folder. If it doesn't end with / it treats it as the filename.
# thats why this is folders COPY /target/live-stock-checker-0.0.1-SNAPSHOT.jar /stoxyFinance/target/jar/ and inside this
# the file gets copied where as COPY /target/live-stock-checker-0.0.1-SNAPSHOT.jar /stoxyFinance/target/jar this means copy
# the first file into this destination file with the name jar
# COPY <source-path> <destination-path>