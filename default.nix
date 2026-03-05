{ pkgs ? import <nixpkgs> {},
  nodejs ? pkgs.nodejs_24,
  typescript ? pkgs.typescript,
  ...
}:

pkgs.stdenv.mkDerivation (finalAttrs: {
  pname = "bovett-workspace";
  version = "0.1.0";

  src = ./.;

  nativeBuildInputs = [
    nodejs
    pkgs.pnpm
    pkgs.pnpmConfigHook
    pkgs.svelte-language-server
    typescript
  ];

  CI = "true";

  buildPhase = ''
    runHook preBuild
    pnpm build
    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall
    mkdir -p $out/bin
    cp -r apps/web/build $out/
    echo '#!${pkgs.bash}/bin/bash' > $out/bin/bovett
    echo "${nodejs}/bin/node $out/build/index.js \"$@\"" >> $out/bin/bovett
    chmod +x $out/bin/bovett
    runHook postInstall
  '';

  pnpmDeps = pkgs.fetchPnpmDeps {
    inherit (finalAttrs) pname version src;
    fetcherVersion = 2;
    hash = "sha256-VRurGFtIrXE5z7RCR8c8xZlIFbwdZST2ChorrEYcD/k=";
  };
})
