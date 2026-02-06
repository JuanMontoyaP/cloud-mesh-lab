#!/bin/bash

set -e

GITHUB_ORG="JuanMontoyaP"
GITHUB_REPO="cloud-mesh-lab"
ROLE_NAME="gh-actions-role"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
OIDC_PROVIDER_URL="token.actions.githubusercontent.com"

echo "🔧 Setting up GitHub Actions OIDC for AWS..."
echo "AWS Account: $AWS_ACCOUNT_ID"

EXISTING_PROVIDER=$(
    aws iam list-open-id-connect-providers \
    --query "OpenIDConnectProviderList[?ends_with(Arn, '$OIDC_PROVIDER_URL')]" \
    --output text
)

if [ -z "$EXISTING_PROVIDER" ]; then
    echo "Creating OIDC provider"
    THUMBPRINT=$(
        echo | \
            openssl s_client \
            -servername token.actions.githubusercontent.com \
            -connect token.actions.githubusercontent.com:443 2>/dev/null | \
            openssl x509 -fingerprint -sha1 -noout | \
            cut -d'=' -f2 | \
            tr -d ':' | \
            tr '[:upper:]' '[:lower:]'
    )

    aws iam create-open-id-connect-provider \
        --url "https://$OIDC_PROVIDER_URL" \
        --client-id-list "sts.amazonaws.com" \
        --thumbprint-list "$THUMBPRINT"
else
    echo "OIDC provider already exist: $EXISTING_PROVIDER"
fi

# Create trust policy
echo "Creating IAM Role trust policy..."
cat > /tmp/trust-policy.json <<-EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/${OIDC_PROVIDER_URL}"
            },
            "Action": ["sts:AssumeRoleWithWebIdentity"],
            "Condition": {
                "StringEquals": {
                    "${OIDC_PROVIDER_URL}:aud": "sts.amazonaws.com"
                },
                "StringLike": {
                    "${OIDC_PROVIDER_URL}:sub": [
                        "repo:${GITHUB_ORG}/${GITHUB_REPO}:ref:refs/heads/*",
                        "repo:${GITHUB_ORG}/${GITHUB_REPO}:ref:refs/tags/*",
                        "repo:${GITHUB_ORG}/${GITHUB_REPO}:pull_request"
                    ]
                }
            }
        }
    ]
}
EOF

if aws iam get-role --role-name "$ROLE_NAME" 2>/dev/null; then
    echo "Updating existing IAM Role"
    aws iam update-assume-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-document file:///tmp/trust-policy.json
else
    echo "Creating IAM Role"
    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --description "Role for GitHub Actions OIDC"
fi

