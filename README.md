## Features of the dapp

- View Popular Dance Moves Gifs
- Vote for your favorite Gifs
- Add link of your favorite dance gif on the portal

All the data including links of gifs and vote information is saved on solana blockchain.

Note: To make it work switch the network of phantom wallet to devnet.

## To run the dapp

`cd app`

`yarn install` (Run this command only once)

`yarn start`

## To re-build smart contract after modification

In Root folder:

`yarn install` (Run this command only once)

Then after each update in smart contract (present in programs/myepicproject/lib.rs) run:

`anchor build`

Get the new program id:

`solana address -k target/deploy/myepicproject-keypair.json`

Update this new program id in

1> Anchor.toml

`myepicproject = "new program id"`

2> lib.rs

`declare_id!("new program id");`

Build Again:

`anchor build`

Copy the content of idl file (target/idl/myepicproject.json) to app/src/idl.json file
