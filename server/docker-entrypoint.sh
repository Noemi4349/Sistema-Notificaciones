#!/bin/bash

echo "Iniciando microservicio con perfil: ${SPRING_PROFILE:-produccion}"

exec java \
    -Djava.security.egd=file:/dev/./urandom \
    -jar /opt/app/app.jar \
    --spring.profiles.active=${SPRING_PROFILE:-produccion}