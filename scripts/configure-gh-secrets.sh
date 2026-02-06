#!/bin/bash

set -e

GH_ROLE_ARN=$(
    aws iam get-role \
        --role-name gh-actions-role \
        --query 'Role.Arn' \
        --output text
)

gh secret set AWS_ROLE_ARN --body "$GH_ROLE_ARN"
