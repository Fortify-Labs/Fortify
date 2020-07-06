#!/usr/bin/env bash

helm repo add akhq https://akhq.io/
helm repo update

helm install akhq akhq/akhq -f ./setup/akhq.yaml -n fortify
