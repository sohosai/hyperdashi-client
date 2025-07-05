{
  description = "HyperDashi Frontend Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_20
            bun
            nodePackages.typescript
            nodePackages.typescript-language-server
            nodePackages.vscode-langservers-extracted
          ];

          shellHook = ''
            echo "🚀 HyperDashi Frontend Development Environment"
            echo "Node: $(node --version)"
            echo "Bun: $(bun --version)"
            echo "TypeScript: $(tsc --version)"
            echo ""
            echo "Ready to develop with Preact + TypeScript + MUI!"
          '';
        };
      });
}