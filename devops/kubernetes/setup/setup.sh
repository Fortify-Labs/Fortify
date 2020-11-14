#!/usr/bin/env bash

helm repo add akhq https://akhq.io/
helm repo add traefik https://helm.traefik.io/traefik
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo update

helm install akhq akhq/akhq -f ./setup/akhq.yaml -n fortify
helm install traefik traefik/traefik -f ./setup/traefik.yaml -n kube-system
helm install vault hashicorp/vault -f ./setup/vault.yaml
