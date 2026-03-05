{
  description = "Bovett Production Infrastructure";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    # We bring in disko to handle the hard drive formatting
    disko = {
      url = "github:nix-community/disko";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, disko, flake-utils, ... }: 
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        packages.default = pkgs.callPackage ./default.nix { 
          nodejs = pkgs.nodejs_24;
        };

        devShells.default = pkgs.mkShell {
          buildInputs = [
            pkgs.nodejs_24
            pkgs.pnpm
            pkgs.svelte-language-server
            pkgs.typescript-language-server
            pkgs.typescript
            pkgs.prettier
          ];
          
          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
          '';
        };
      }
    ) // (import ./deployment.nix { inherit nixpkgs disko; });
}
