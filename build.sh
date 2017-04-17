#!/bin/sh

docker build -t garnetalpha-on.azurecr.io/radius-acct:latest -f Dockerfile.acct .
docker build -t garnetalpha-on.azurecr.io/radius-auth:latest -f Dockerfile.auth .

docker push garnetalpha-on.azurecr.io/radius-acct:latest
docker push garnetalpha-on.azurecr.io/radius-auth:latest

