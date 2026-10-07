#!/bin/sh
set -eu

version=8.30.1
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
case "$(uname -s):$(uname -m)" in
  Darwin:arm64)
    platform=darwin_arm64
    checksum=b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5
    ;;
  Darwin:x86_64)
    platform=darwin_x64
    checksum=dfe101a4db2255fc85120ac7f3d25e4342c3c20cf749f2c20a18081af1952709
    ;;
  Linux:x86_64)
    platform=linux_x64
    checksum=551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb
    ;;
  Linux:aarch64|Linux:arm64)
    platform=linux_arm64
    checksum=e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080
    ;;
  *)
    echo "Unsupported platform. Install Gitleaks $version manually." >&2
    exit 1
    ;;
esac

download_dir=$(mktemp -d)
trap 'rm -rf "$download_dir"' EXIT HUP INT TERM
archive="gitleaks_${version}_${platform}.tar.gz"
curl --proto '=https' --tlsv1.2 -fsSL --retry 3 \
  "https://github.com/gitleaks/gitleaks/releases/download/v${version}/${archive}" \
  -o "$download_dir/$archive"

if command -v sha256sum >/dev/null 2>&1; then
  actual=$(sha256sum "$download_dir/$archive")
else
  actual=$(shasum -a 256 "$download_dir/$archive")
fi
actual=${actual%% *}
if [ "$actual" != "$checksum" ]; then
  echo 'Gitleaks download checksum mismatch; installation stopped.' >&2
  exit 1
fi

mkdir -p "$root/.tools"
tar -xzf "$download_dir/$archive" -C "$download_dir" gitleaks
install -m 755 "$download_dir/gitleaks" "$root/.tools/gitleaks"
"$root/.tools/gitleaks" version
