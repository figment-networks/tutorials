build:
# more about flags: https://github.com/near-examples/simulation-testing#gotchas
# env setting instruments cargo to optimize the the build for size (link-args=-s)
	@env 'RUSTFLAGS=-C link-arg=-s' cargo +stable build --lib --target wasm32-unknown-unknown --release

build-doc:
	cargo doc

deploy:
	near deploy --wasmFile target/wasm32-unknown-unknown/release/escrow.wasm --accountId $(NCLP_ACC)  --initFunction "new" --initArgs "{\"owner\": \"$NMASTER_ACC\"}"
