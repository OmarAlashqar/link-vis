#!/bin/bash

if [ -f "./pre-deploy.sh" ]; then
    source ./pre-deploy.sh
fi

if [ "$REMOTE" == "" ] ;then
  echo "Make sure you set the REMOTE environment variable, exiting..."
  exit 1
fi

echo "What version should this deployment be?"
read VERSION

echo "Version ($VERSION), are you sure? [y/N]"
read SURE

if [ "$SURE" == "${SURE#[Yy]}" ] ;then
  echo "Cancelling deployment..."
  exit 1
fi

docker build -t oalashqar/link-vis-server:$VERSION .
docker push oalashqar/link-vis-server:$VERSION

ssh $REMOTE "docker pull oalashqar/link-vis-server:$VERSION && docker tag oalashqar/link-vis-server:$VERSION dokku/link-vis-server:$VERSION && dokku deploy link-vis-server $VERSION"