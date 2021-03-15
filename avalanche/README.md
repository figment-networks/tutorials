# Avalanche Tutorials

This directory contains the tutorials for interacting with Avalanche blockchain using
the official javascript SDK.

## Requirements

- Node.js 12+

## Overview

Following tutorials are available:

- [1: Connect to Node](/avalanche/1_connect_to_node/main.js)
- [2: Create an account](/avalanche/2_create_account/main.js)
- [3: Query node](/avalanche/3_query_node/main.js)
- [4: Send a transaction](/avalanche/4_send_transaction/main.js)
- [5: Cross-chain transfer](/avalanche/5_interchain_swap/main.js)

## Setup

First, make sure you have the right version of Node installed:

```bash
node -v
```

Next, install all the dependecies:

```bash
npm install
```

Create an environment variables file:

```bash
cp .env.example .env
```

Make sure to provide a NEAR account name and DataHub API Key.

You're good to go.

## Running

To execute example code for each tutorial you can run command:

```bash
npm run STEP # where step is on of: 1,2,3,4,5
```

Where STEPS is one of:

- `1`: Connect to node
- `2`: Create an account
- `3`: Query node
- `4`: Send a transaction
- `5`: Create cross-chain transfer