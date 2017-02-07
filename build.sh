#!/bin/sh

docker build -t garnetalpha-on.azurecr.io/radius-acct:latest -f Dockerfile.acct .
docker build -t garnetalpha-on.azurecr.io/radius-auth:latest -f Dockerfile.auth .
docker build -t garnetalpha-on.azurecr.io/radius-boot:latest -f Dockerfile.boot .
docker build -t garnetalpha-on.azurecr.io/radius-web:latest  -f Dockerfile.wapi .
