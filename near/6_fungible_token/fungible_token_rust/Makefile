# runs all tests
test:
	@cargo +nightly test

test-debug:
	@RUST_BACKTRACE=1 cargo +nightly test  -- --nocapture

# runs only unit tests
test-unit:
	@cargo +nightly test --lib -- --nocapture


build:
	@env 'RUSTFLAGS=-C link-arg=-s' cargo +stable build --lib --target wasm32-unknown-unknown --release


deploy-nearswap:
	near deploy --wasmFile target/wasm32-unknown-unknown/release/fungible_token.wasm --accountId $(MY_ACCOUNT)
