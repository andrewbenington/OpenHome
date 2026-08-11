# From https://wiki.nixos.org/wiki/Tauri
{
	description = "OpenHome development environment";

	inputs = {
		nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
	};

	outputs = {
		self,
		nixpkgs,
	}: let
		supportedSystems = [
			"x86_64-linux"
			"aarch64-linux"
		];

		forEachSystem = nixpkgs.lib.genAttrs supportedSystems;
	in {
		devShells =
			forEachSystem (system: let
					pkgs = import nixpkgs {inherit system;};
				in {
					default =
						pkgs.mkShell {
							nativeBuildInputs = with pkgs; [
								pkg-config
								wrapGAppsHook4
								cargo
								cargo-tauri
								nodejs
								rustc
								pnpm
								python3
								wasm-pack
								lld
							];

							buildInputs = with pkgs; [
								librsvg
								webkitgtk_4_1
							];

							shellHook = ''
								export XDG_DATA_DIRS="$GSETTINGS_SCHEMAS_PATH"
							'';
						};
				});
	};
}
