#!/bin/sh
flatpak-builder --force-clean --user --install-deps-from=flathub --repo=repo --install builddir org.andrewbenington.OpenHome.yaml
# sed -i "s/sha256: .*/sha256: $(sha256sum -b $DEB_LOCATION  | awk '{print $1}')/" org.andrewbenington.OpenHome.yaml