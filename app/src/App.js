import { useEffect, useState } from "react";
import twitterLogo from "./assets/twitter-logo.svg";
import "./App.css";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, Provider, web3, BN } from "@project-serum/anchor";
import idl from "./idl.json";
import kp from "./keypair.json";

// Constants
const TWITTER_HANDLE = "anshul_go87";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram } = web3;

// Use created account key for baseaccount
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

// Get our program's id form the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devent.
const cluster = "devnet";
const network = clusterApiUrl(cluster);

// Control's how we want to acknowledge when a trasnaction is "done".
const opts = {
  preflightCommitment: "processed",
};

const App = () => {
  // State
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [gifList, setGifList] = useState([]);

  // Actions
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet found!");
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            "Connected with Public Key:",
            response.publicKey.toString()
          );

          /*
           * Set the user's publicKey in state to be used later!
           */
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert("Solana object not found! Get a Phantom Wallet 👻");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log("Connected with Public Key:", response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection,
      window.solana,
      opts.preflightCommitment
    );
    return provider;
  };

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!");
      return;
    }
    console.log("Gif link:", inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF sucesfully sent to program", inputValue);

      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error);
    }
  };

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't be initialized.
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button
            className="cta-button submit-gif-button"
            onClick={createGifAccount}
          >
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      );
    }
    // Otherwise, we're good! Account exists. User can submit GIFs.
    else {
      return (
        <div className="connected-container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }}
          >
            <input
              type="text"
              placeholder="Enter gif link!"
              value={inputValue}
              onChange={onInputChange}
            />
            <button type="submit" className="cta-button submit-gif-button">
              Submit
            </button>
          </form>
          <div className="gif-grid">
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <div className="vote">
                  <button
                    className="vote-button vote-up-button"
                    onClick={upVote}
                    value={index}
                  >
                    +
                  </button>
                  <span className="vote-counter">
                    {item.votes.toString()} votes
                  </span>
                  <button
                    className="vote-button vote-down-button"
                    onClick={downVote}
                    value={index}
                  >
                    -
                  </button>
                </div>
                <div>
                  <img src={item.gifLink} alt={`gif-${index}`} />
                  <a
                    href={`https://explorer.solana.com/address/${item.userAddress.toString()}?cluster=${cluster}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <font color="grey">{item.userAddress.toString()}</font>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      );

      console.log("Got the account", account);
      setGifList(account.gifList);
    } catch (error) {
      console.log("Error in getGifs: ", error);
      setGifList(null);
    }
  };

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping");
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      });
      console.log(
        "Created a new BaseAccount w/ address:",
        baseAccount.publicKey.toString()
      );
      await getGifList();
    } catch (error) {
      console.log("Error creating BaseAccount account:", error);
    }
  };

  const upVote = async (event) => {
    try {
      event.preventDefault();

      const target = event.target;
      const index = target.value;

      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.upVote(new BN(index), {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("Upvote successfully sent to program", index);

      await getGifList();
    } catch (error) {
      console.error("Error sending up vote: ", error);
    }
  };

  const downVote = async (event) => {
    try {
      event.preventDefault();

      const target = event.target;
      const index = target.value;

      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.downVote(new BN(index), {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("Downvote successfully sent to program", index);

      await getGifList();
    } catch (error) {
      console.error("Error sending down vote: ", error);
    }
  };

  // UseEffects
  useEffect(() => {
    window.addEventListener("load", async (event) => {
      await checkIfWalletIsConnected();
    });
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching GIF list...");
      getGifList();
    }
  }, [walletAddress]);

  return (
    <div className="App">
      {/* This was solely added for some styling fanciness */}
      <div className={walletAddress ? "authed-container" : "container"}>
        <div className="header-container">
          <p className="header">Dance Moves Portal</p>
          <p className="sub-text">
            View your collection of amazing dance moves in the metaverse ✨
          </p>
          {/* Add the condition to show this only if we don't have a wallet address */}
          {!walletAddress && renderNotConnectedContainer()}
          {/* We just need to add the inverse here! */}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`Created by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
