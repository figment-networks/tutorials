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

## Smart contract basics

NEAR smart contracts are compiled to WebAssmebly and executed in a runtime based on Wasmer (super lightweight containers based on WebAssembly that can run anywhere).
Hence, smart contracts can be written in any language which compiles to the web assembly. In practice, at the time of writing, only two languages have official tooling and SDK support, which makes the development easy and straight forward. That is: Rust and AssemblyScript. It's worth to mention that NEAR is a gold sponsor of the AssemblyScript language with a mission to make it solid and easy for web developers.

The NEAR runtime is a subsystem of the NEAR blockcchain responsible for processing transactions and execute state transition. It provides to the wasmer the following functionality:
+ Account abstraction
+ Transaction context
+ Smart contract storage

When receiving a transaction, runtime must unmarshal the transaction details, extract function arguments, load and call appropriate smart contract.

### Smart contract ABI

The runtime itself doesn't have any limitation about function argument serialization. It sees everything as bytes. It's a smart contract responsibility to appropriately handle the function arguments. Initially, there was an effort to use Borsh encoding for argument serialization. However this created a issues for interoperability with other WebAssembly languages and additional complexity for JavaScript and off-chain applications. NEAR goal is to provide easy connectivity with web2 apps and multi language support, so the idea to use Borsh, as a recommended serialization, turned down. Instead, JSON is a recommended solution and has a great support in SDK.
Both official SDKs (for Rust and AssemblyScript) provide bunch of useful types which wrap complex types as strings and convert them into the "native" types. For example, in the following function all arguments

```rust
pub fn transfer(&mut self, recipient: ValidAccountId, amount: U128, msg: String, data: String) U128
```

+ `ValidAccountId` is an `AccountId` wrapper (which in turn is an alias to `String`)
+ `amount` is a `String` wrapper which provides a safe conversion method to a `u128` numerical byte.
+ `msg` - smart contract designer is using `String` to handle a textual argument.
+ `data` - here, our intention is to use an arbitrary data. For this we recommend to use base64 encoding of byte. If the smart contract needs to interpret that bytes, it can easily decode the string into bytes.

To make it clear about argument encoding (eg: msg vs data vs date), a smart contract designer must provide API documentation, explaining the use and encoding of each argument.


### Operational Semantic in NEAR

All smart contract functions has to be **deterministic**. A deterministic model will always produce the same output from a given starting condition or initial state. The following operations are known to be **not deterministic** and will **fail** during the runtime (meaning: they will pass compilation and tests):
+ floating point arithmetic
+ random numbers
+ any I/O calls, system calls, and off-chain data


**CAUTION**: Don't use any of the operation which may produce non deterministic vale.

Below we will describe ways how to handle use-cases for smart contracts which require the aforementioned functionality

#### Arithmetic

Computing almost any physical phenomena requires real number arithmetic. "Under graduate" finance also operates on decimal numbers. We see that it's very important to have a support for something more than integers. The solutions are: big integers (eg 128 or 256 bit integers), big integer numbers (memory limited integer numbers), rational numbers (rational number `x` is represented as a pair of integers: `(a, b)` such that `x = a/b`). The former solution offers much better performance, and is a recommended solution. The last two options are handled using libraries. Below we will describe the patterns for using big integers.

Big integer types in rust (such as `u128` or `i128`) offer a very efficient integer operations.
Near SDK offers provides a JSON related types (`U64`, `U128`, `I64`, `I128`) which allow to easily convert between decimal string representation and a native numeric representation. Moreover it also provides a `impl_str_type` to define "bigger integers"
```
use uint::construct_uint;

construct_uint! {
    /// 256-bit unsigned integer.
    pub struct u256(4);
}


use near_sdk::json_types::impl_str_type;
impl_str_type!(U256, u256);
```

The common pattern is following. We design a numerical value with a "virtual" decimal dot. We basically denominate a bigger unit  with a smaller unit. For example, instead of saying USD 1200.4 we will say USCent 120040. The virtual "dot" will set a numerical precision for all our operations. In the example above, our USD precision is 2. If we want to have higher precision, we need to use bigger numbers.

The NEAR native token is denominated with yocot NEARs. So 1 NEAR is stored as 1e24 (1 Septillion = 1 and 24 zeros). This allow us to have a big precision for arithmetic operations as division. We can easily compute `1 NEAR / 3` with a deterministic result and with high precision. In examples below, we will append `d` to a numerical values denominated with a smaller units.

NOTE: Bitcoin and Ethereum is using the same mechanism. BTC is denominated using 1e9 and ETH 1e18.

NEAR smart contracts by default are compiled with overflow check. So, when multiplying such a big numbers we have an overflow risk. If we use `u128` to store the integer values, then the maximum number we can use is roughly 3.4e38.
Example: Let's use a numerical system denominated in 1e24 (same as the NEAR token), so `1d = 1e24`. Multiplying `1000d * 3000d` will create overflow:
```
4d * 3d = 4e24 * 3e24 = 12e48 = 1.2e49
```

To solve this problem we can use a bigger number type (eg: `u256`). This has one downside: bigger numbers consume more storage space, which will be more expensive. Other solution is to temporarily convert a number in a bigger type, do arithmetic operations, and then convert it back:
```
fn calc(a: u128, b: u128, c: u128) -> u128 {
    let numerator = u256::from(a) * u256::from(b);
    let result = numberator / u256::from(c);
    return r.as_u128()
}
```

We will see in the future tutorials, that most of the token designs use `u128` and fallback to `u256` to handle multiplication.


#### Random numbers

Random numbers must be generated in a deterministic way, but it also have to be not predictable. A common solution is to use a hash of one of the psuedo-random values available in the runtime (eg a hash of the `H(signature || block_id)`, where `H` is a hash function). This technique, unfortunately, is susceptible for miner extractable value (MEV), which is a subject of a different article.

NEAR is designing a Verifiable Random Function, which will generate a not predictable, deterministic value not  susceptible for MEV.

#### Off chain data

Off chain data is usually handled by an oracle system. A security and trust of that data is dependent on the economics of the oracle system.


## Fungible Token

NEAR smart-contract standards are governed by the Near Enhancement Proposal ([NEP](https://github.com/nearprotocol/NEPs)) process - which is similar to Ethereum Improvement Proposal (EIP). Standards refer to various common interfaces and APIs that are used by smart contarct developers on top of the NEAR Protocol. For example, such standards include SDK for Rust, API for fungible tokens or how to manage user's social graph.
Smart contract standards are stored in [/specs/Standards](https://github.com/nearprotocol/NEPs/tree/master/specs/Standards).

[NEP-21](https://github.com/nearprotocol/NEPs/blob/master/specs/Standards/Tokens/FungibleToken.md) is the first approved standards - it's an interface for Fungible Tokens. In essence it's a port of Ethereum ERC-20 standard.

### NEP-21 Design Goals

NEAR Protocol uses an asynchronous sharded Runtime. It also creates some challenges for cross-contract development. For example, if one contract wants to query some information from the state of another contract (e.g. current balance), by the time the first contract receive the balance the real balance can change. It means in the async system, a contract can't rely on the state of other contract and assume it's not going to change.

+ NEP-21 smart-contract doesn't require any async calls to use or notify other smart contracts. Instead, it assumes that all interaction is done by other smart contracts.
+ NEP-21 interface is a simple and minimal: it only provides functionality to manage token balances. It doesn't provide interface for token metadata (name, symbol, decimals), minting nor burning. That functionality can be customized and it's not governed by the standard.

In next tutorials we will look at other fungible token proposals and discuss some advantages and disadvantages.


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
