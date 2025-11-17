FROM openjdk:22-slim

ARG APP_NAME
ARG APP_VERSION

WORKDIR /opt/app

COPY ${APP_NAME}/.mvn ./.mvn
COPY ${APP_NAME}/mvnw .
COPY ${APP_NAME}/pom.xml .
RUN chmod +x mvnw

RUN ./mvnw dependency:go-offline -B

COPY ${APP_NAME}/src ./src

RUN ./mvnw clean package -DskipTests && \
    ls -la target/ && \
    find target -name "*.jar" -type f -not -name "*sources.jar" -not -name "*javadoc.jar" -exec cp {} /opt/app/app.jar \;

EXPOSE 8761

COPY ${APP_NAME}/docker-entrypoint.sh /opt/app/entrypoint.sh
RUN chmod +x /opt/app/entrypoint.sh

ENTRYPOINT ["/opt/app/entrypoint.sh"]

