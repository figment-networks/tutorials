# Intro to NEAR Rust Smart Contracts

Learn how to get started with Rust and create a first smart contract. The contract we will create will represent a simple escrow account. During the initialization, we will set 3 addresses: buyer, seller and a notary. Buyer will deposit NEAR tokens, notary will be able to unlock it and send it to the seller.

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

    cargo new --lib escrow

This will create a `Cargo.toml` file which is a config file for your project. It contains information about project name, author, version, dependencies, compilation option and many more. Open and edit the file (In the comments you will find description about ):

```toml
[package]
name = "escrow"
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
# always use the latest near-sdk version. You can find more about the SDK and it's version
# in rust crates: https://lib.rs/crates/near-sdk
near-sdk = "2.0.1"

# compilation profile for a release target
[profile.release]
codegen-units = 1
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

## Escrow Smart Contract

We will start by describing an interface. Later we will implement all functions. When describing the interface we will explain methods and all constructions.

The use-case we are implementing is following:

1. Buyer and Seller come into a trade agreement. They choose a notary which will verify a process and unlock payment.
2. Someone will deploy the escrow smart contract setting the `cost` attribute to the trade value. The `cost` must equal the trade value + 1 NEAR. The latter one is the commission for the Notary.
3. Buyer deposits the required amount of NEAR for the trade payment.
4. Notary verifies the delivery of the trade and unlock the payment:
   * if the process was correct, the locked deposit will go to the seller
   * otherwise, the deposit will go back to the seller.
   * Notary will take 1 NEAR commission.


### Interface

```rust
/// A static method to creates a new, initialized smart contract instance.
#[init]
pub fn new(cost: U128, buyer: ValidAccountId, seller: ValidAccountId, notary: ValidAccountId) -> Self;

/// Creates a new deposit. MUST be called by the `self.buyer`.
/// Panics when:
/// * attached deposit is <= 1 NEAR (1e24 yoctoNEAR)
/// * is called by someone else than `buyer`
/// * or when different amount than expected is provided.
#[payable]
pub fn deposit(&mut self);


/// Allows `notary` to withdraw deposit to seller when cancel=false or back to the buyer
/// otherwise.
pub fn unlock(&mut self, cancel: bool);


/****************/
/* VIEW METHODS */
/****************/

/// Returns true if the trade is finalized and deposit is withdrawn.
pub fn isFinalized(&self) -> bool;
```

### NOTES

* `&self` function argument. Each read-only structure method must take `&self` as a first argument - it allows to self reference the object. We call such functions *view methods* because they can be called without a transaction (eg `near view` - using the near-cli java script tool) - they allow to view a state of a smart contract.
* `&mut self` function argument. It's self reference to the object which allows mutation. These methods can be used only in transactions.
* `#[payment]` is an [attribute](https://doc.rust-lang.org/rust-by-example/attribute.html) - a general, free-form metadatum that provides special instructions for the compiler or makro processor. Here, this attribute `method means that a function expects payment in NEAR (we call it attachment). So this function can take NEAR attached to the transaction.
* `#[init]` is a marker attribute it does not generate code by itself.


### Implementation

We start the library code by importing other packages. Here we will import the NEAR function argument types used in smart contracts:

```rust
use near_sdk::{
  borsh::{self, BorshDeserialize, BorshSerialize},
  json_types::U128,
  env, near_bindgen, wee_alloc, ValidAccountId
};
```

* `borsh` is a object serialization library. It's used to serialize objects into bytes when saving or restoring from a storage.
* `env` is a special object which allows accessing transaction and runtime attributes.
* `we_alloc` is used for specifying memory allocation and management.
* `json_types::U128** is a helper datatype used to easily decode numbers from a decimal string. As we noted above, we need to support big numbers. However, most of the dapps are written in JavaScript and the maximum natural number we can create in JavaScript without loosing precision is around `2^53`. This might not be a case of JavaScript. Other languages may have similar limitation or may not agree on a binary serialization. Hence, NEAR recommends to use numbers as decimal strings.
* `ValidAccountId` is a wrapper for an `AccountId` which performs validation during serialization and deserializiation.

Next we will configure the memory allocator. This is only needed when we compile to WASM for a smart-contract release.

```rust
#[cfg(target = "wasm32")]
#[global_allocator]
static ALLOC: near_sdk::wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
```

We define our smart contract _main_ structure. Each smart contracts are represented as an object.

```rust
/// Our smart contract structure definition
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Escrow {
    pub cost: Balance,
    pub buyer: AccountId,
    pub seller: AccountId,
    pub notary: AccountId,
}
```

* `#[near_bindgen]` marks the structure as a smart contract. There must be only one smart contract in a library.
* `#[derive(BorshDeserialize, BorshSerialize)]` is a Rust attribute, which instruments a compiler to automatically derive and create methods to serialize and deserialize objects - which is needed to load a smart contract from the blockchain storage.


`#[near_bindgen]` requires us to implement `Default` trait for our smart contract structure:

```rust
impl Default for Escrow {
    fn default() -> Self {
        env::panic(b"The contract is not initialized.");
    }
}
```


Finally we implement the smart contract functionality

```rust
#[near_bindgen]
impl Escrow {

    /// new is a constructor - it creates and initializes a smart contract
    #[init]
    pub fn new(
        cost: U128,
        buyer: ValidAccountId,
        seller: ValidAccountId,
        notary: ValidAccountId,
    ) -> Self {
        // protect for resetting a contract state
        assert!(!env::state_exists(), "Already initialized");
        let cost = u128::from(cost);
        assert!(cost > ONE, "Cost must be at least 1 NEAR to compensate a notary");

        Self {
            cost,
            buyer: buyer.into(),
            seller: seller.into(),
            notary: notary.into(),
        }
    }

    /// deposit receives NEAR so it must be marked with `#[payable]`
    #[payable]
    pub fn deposit(&mut self) {
        assert!(
            env::predecessor_account_id() == self.buyer,
            "Only buyer can make a deposit"
        );
        assert!(
            env::attached_deposit() == self.cost,
            format!(
                "Wrong deposit. Expected: {}, given: {}",
                self.cost,
                env::attached_deposit()
            )
        );
    }

    /// Allows `notary` to withdraw deposit to seller when cancel=false or back to the buyer
    /// otherwise.
    pub fn unlock(&mut self, cancel: bool) {
        assert!(
            env::predecessor_account_id() == self.buyer,
            "Only notary can make a deposit"
        );

        /// We transfer NEAR using the Promise API.
        Promise::new(self.notary.clone()).transfer(ONE);
        if cancel {
            Promise::new(self.buyer.clone()).transfer(self.cost - ONE);
        } else {
            Promise::new(self.seller.clone()).transfer(self.cost - ONE);
        }
    }
}
```

NEAR tokens can be transferred using a high level Promise object (for more details check the SDK [documentation](https://docs.rs/near-sdk/2.0.1/near_sdk/struct.Promise.html)) or using a low level
`env::promise*` [API](https://nomicon.io/RuntimeSpec/Components/BindingsSpec/PromisesAPI.html).



## Building and deploying smart contracts

To build the smart contract we use cargo:

    @env 'RUSTFLAGS=-C link-arg=-s' cargo +stable build --lib --target wasm32-unknown-unknown --release

The first part (`@env 'RUSTFLAGS=-C link-arg=-s'`) sets ENV variable to instrument rust compiler and linker to optimize the build for size. Then, the parameters after `cargo` call are:
+ `+stable` specify to use the stable branch of Rust compiler
+ `--lib` - we build a library
+ `--target wasm32-unknown-unknown` - set compiler target (compile to WASM)
+ `--release` - use release profile for building the final binary.

The best way to build and deploy and interact with smart contract is to use a [near-cli](https://www.npmjs.com/package/near-cli) application. You can install it using `yarn` or `npm`

We deploy smart contract:

    near deploy --wasmFile target/wasm32-unknown-unknown/release/escrow.wasm --accountId "deployer_account"  --initFunction "new" --initArgs '{"buyer": "buyer.testnet", "seller": "seler.testnet", "notary": "notary.testnet", cost: "5000000000000000000000000"}'

We set the `initFunction` and `initArgs` parameters to initialize the smart contract while deploying it (otherwise the `default` function will be used). The big number (1 and 25 zeros) is 5 NEAR.

Now we can make a deposit:

    near call deposit --amount b"5000000000000000000000000" --accountId "buyer.testnet"

And notary can move the payment

    near call unlock '{"cancel": false}' --accountId "notary"


## Tips

If you already have one account, you can create a sub-accounts:

    near create-account subaccountname.$NEAR_ACCT --masterAccount $NEAR_ACCT

You can remove an account and pass all NEAR to some other account:

    near delete subaccountname.$NEAR_ACCT $BENEFICIARY --accountId subaccountname.$NEAR_ACCT
