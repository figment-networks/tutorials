# First smart contract in Rust: Fungible Token

Learn how to get started with Rust and create your first token.

## Introduction

Rust and Assembly Script are the 2 officially supported languages by NEAR. Compared to the latter one, Rust has a more mature and stable ecosystem and it's pledged to be more secure. We can use all Rust native libraries and tools to develop smart contracts. Finally, smart contract written in Rust are usually faster.

### Prerequisites

Before starting make sure you get a first steps with Rust:

+ [Install](https://www.rust-lang.org/tools/install) Rust.
+ Rust compiler is accessible (type `rustc`) - if not you have to [configure](https://www.rust-lang.org/tools/install) the PATH environment variable.
+ Get familiar with Rust, eg: [Learn Rust in 20 minutes](https://learnxinyminutes.com/docs/rust/). Look [here](https://www.rust-lang.org/learn) for more resources.
+ In this tutorial we will use `make` to execute commands.
+ Once Rust is installed in our system, we need to add Web Assembly target compilation. By default Rust installs a native target for your CPU. We want to produce WASM code instead:

      rustup target add wasm32-unknown-unknown

## Creating a project

We start with creating a Cargo project. Cargo is the Rust package manager and project manager - it downloads dependencies and compiles your project. Cargo is distributed by default with Rust, so if you followed the instructions above and have `rustc` installed locally you should have `cargo` available in your terminal.

    cargo new --lib fungible_token

This will create a `Cargo.toml` file which is a config file for your project. It contains information about project name, author, version, dependencies, compilation option and many more. Open and edit the file (In the comments you will find description about ):

```toml
[package]
name = "fungible_token"
version = "0.1.0"
authors = ["Your Name <email@example.com>"]
# Rust language edition
edition = "2018"

# A Rust project can be compiled as a lib or as an executable. Smart contract are not
# executable - it's a library code run by the NEAR WASM runtime. The instructions below
# instruments cargo to produce a static library.
# More information: https://doc.rust-lang.org/reference/linkage.html
[lib]
crate-type = ["cdylib", "rlib"]

# Here we list dependencies. near-sdk will already provide us everything we need to build
# a smart contract
[dependencies]
near-sdk = "2.0.0"

# compilation profile for a release target
[profile.release]
codegen-units = 1
# optimize for binary size ("z" would additionally turn off loop vectorization)
opt-level = "s"
# link time optimization
lto = true
debug = false
panic = "abort"
```

The `cargo new --lib` will create a sample `src/lib.rs` file, which is a default entry point for library crate (in application crate the default entry point is `src/main.rs`).


## Fungible Token

NEAR smart-contract standards are governed by the Near Enhancement Proposal ([NEP](https://github.com/nearprotocol/NEPs)) process - which is similar to Ethereum Improvement Proposal (EIP). Standards refer to various common interfaces and APIs that are used by smart contarct developers on top of the NEAR Protocol. For example, such standards include SDK for Rust, API for fungible tokens or how to manage user's social graph.
Smart contract standards are stored in [/specs/Standards](https://github.com/nearprotocol/NEPs/tree/master/specs/Standards).

[NEP-21](https://github.com/nearprotocol/NEPs/blob/master/specs/Standards/Tokens/FungibleToken.md) is the first approved standards - it's an interface for Fungible Tokens. In essence it's a port of Ethereum ERC-20 standard.

### NEP-21 Design Goals

NEAR Protocol uses an asynchronous sharded Runtime. It also creates some challenges for cross-contract development. For example, if one contract wants to query some information from the state of another contract (e.g. current balance), by the time the first contract receive the balance the real balance can change. It means in the async system, a contract can't rely on the state of other contract and assume it's not going to change.

+ NEP-21 smart-contract doesn't require any async calls to use or notify other smart contracts. Instead, it assumes that all interaction is done by other smart contracts.
+ NEP-21 interface is a simple and minimal: it only provides functionality to manage token balances. It doesn't provide interface for token metadata (name, symbol, decimals), minting nor burning. That functionality can be customized and it's not governed by the standard.

In next tutorials we will look at other fungible token proposals and discuss some advantages and disadvantages.

### Arithmetic in NEAR

TODO: describe numbers and arithmetic operations and exceptions. Explain why we use JSON.

`U128` is a helper type from `near-sdk` used for an easy conversion between a decimal string and a `u128` number.


### Interface

Below we introduce the NEP-21 interface with function description.

```rust
/// Increments the `allowance` for `escrow_account_id` by `amount` on the account of the caller of this contract
/// (`predecessor_id`) who is the balance owner.
/// Requirements:
/// * Caller of the method has to attach deposit enough to cover storage difference at the
///   fixed storage price defined in the contract.
#[payable]
pub fn inc_allowance(&mut self, escrow_account_id: AccountId, amount: U128);

/// Decrements the `allowance` for `escrow_account_id` by `amount` on the account of the caller of this contract
/// (`predecessor_id`) who is the balance owner.
/// Requirements:
/// * Caller of the method has to attach deposit enough to cover storage difference at the
///   fixed storage price defined in the contract.
#[payable]
pub fn dec_allowance(&mut self, escrow_account_id: AccountId, amount: U128);

/// Transfers the `amount` of tokens from `owner_id` to the `new_owner_id`.
/// Requirements:
/// * `amount` should be a positive integer.
/// * `owner_id` should have balance on the account greater or equal than the transfer `amount`.
/// * If this function is called by an escrow account (`owner_id != predecessor_account_id`),
///   then the allowance of the caller of the function (`predecessor_account_id`) on
///   the account of `owner_id` should be greater or equal than the transfer `amount`.
/// * Caller of the method has to attach deposit enough to cover storage difference at the
///   fixed storage price defined in the contract.
#[payable]
pub fn transfer_from(&mut self, owner_id: AccountId, new_owner_id: AccountId, amount: U128);


/// Transfer `amount` of tokens from the caller of the contract (`predecessor_id`) to
/// `new_owner_id`.
/// Act the same was as `transfer_from` with `owner_id` equal to the caller of the contract
/// (`predecessor_id`).
/// Requirements:
/// * Caller of the method has to attach deposit enough to cover storage difference at the
///   fixed storage price defined in the contract.
#[payable]
pub fn transfer(&mut self, new_owner_id: AccountId, amount: U128);

/****************/
/* VIEW METHODS */
/****************/

/// Returns total supply of tokens.
pub fn get_total_supply(&self) -> U128;

/// Returns balance of the `owner_id` account.
pub fn get_balance(&self, owner_id: AccountId) -> U128;

/// Returns current allowance of `escrow_account_id` for the account of `owner_id`.
///
/// NOTE: Other contracts should not rely on this information, because by the moment a contract
/// receives this information, the allowance may already be changed by the owner.
/// So this method should only be used on the front-end to see the current allowance.
pub fn get_allowance(&self, owner_id: AccountId, escrow_account_id: AccountId) -> U128;
```

#### Code explanation

Comment starting with three slashes `///` or `/** */` is a doc string - used to describe object and generate documentation.

All interface functions must be public - by definition, a standard interface specifies an API for the smart contract, hence it must be public. Private functions are never a part of a standard interface.

Trait method implementation must have `&self` as a first argument (reference to the smart contract object).

Functions which handle a transaction call and allow for a state mutation must mark the `self` as mutable with `&mut` prefix.

`#[...]` is an [attribute](https://doc.rust-lang.org/reference/attributes.html) - metadata applied to some module, crate or item. This metadata can be used to/for: conditional compilation of code, disable lints (warnings) or control plugins, enable compiler features (macros, glob imports, etc.), link to a foreign library, mark functions as unit tests. Here, the `#[payable]` is a makro attribute, which will do extra processing for the function to enable receiving NEAR payments.


### Implementation

TODO


## Deploy and initialize the contract
init-nearswap:
	@echo near sent ${NMASTER_ACC} ${NCLP_ACC} 200
	@echo near call ${NCLP_ACC} new "{\"owner\": \"$NMASTER_ACC\"}" --accountId ${NCLP_ACC}


## Interact with a smart contract

TODO
