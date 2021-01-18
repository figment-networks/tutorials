use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    env,
    json_types::{ValidAccountId, U128},
    near_bindgen, AccountId, Balance, Promise,
};

const ONE: u128 = 1e24 as u128;

#[cfg(target = "wasm32")]
#[global_allocator]
static ALLOC: near_sdk::wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Escrow {
    pub cost: Balance,
    pub buyer: AccountId,
    pub seller: AccountId,
    pub notary: AccountId,
}

impl Default for Escrow {
    fn default() -> Self {
        env::panic(b"The contract is not initialized.");
    }
}

#[near_bindgen]
impl Escrow {
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
        assert!(cost > ONE, "Cost must be at least 1 NEAR");
        Self {
            cost,
            buyer: buyer.into(),
            seller: seller.into(),
            notary: notary.into(),
        }
    }

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
        Promise::new(self.notary.clone()).transfer(ONE);
        if cancel {
            Promise::new(self.buyer.clone()).transfer(self.cost - ONE);
        } else {
            Promise::new(self.seller.clone()).transfer(self.cost - ONE);
        }
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
