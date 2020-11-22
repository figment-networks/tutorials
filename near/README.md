# Near Tutorials

This directory contains the tutorials for interacting with Near blockchain using
the official javascript SDK.

## Requirements

- Node.js 12+

## Overview

Following tutorials are available:

- [1: Connect to Node](/near/1_connect_to_node/main.js)
- [2: Create an account](/near/2_create_account/main.js)
- [3: Query node](/near/3_query_node/main.js)
- [4: Send a transaction](/near/4_send_transaction/main.js)
- [5: Work with contracts](/near/5_contracts/main.js)

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
