#!/bin/sh

docker build -t garnetalpha-on.azurecr.io/radius-acct:latest -f Dockerfile.acct .
docker build -t garnetalpha-on.azurecr.io/radius-auth:latest -f Dockerfile.auth .
docker build -t garnetalpha-on.azurecr.io/radius-boot:latest -f Dockerfile.boot .
docker build -t garnetalpha-on.azurecr.io/radius-api:latest  -f Dockerfile.wapi .

docker push garnetalpha-on.azurecr.io/radius-acct:latest
docker push garnetalpha-on.azurecr.io/radius-auth:latest
docker push garnetalpha-on.azurecr.io/radius-boot:latest
docker push garnetalpha-on.azurecr.io/radius-api:latest

