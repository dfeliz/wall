import { useState, useEffect } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';

import './App.css';
import idl from './idl.json';
import { TEXTS, LINKS } from './constants';
import { useConnection } from './hooks/useConnection';

const { SystemProgram } = web3;

const arr = Object.values(JSON.parse(process.env.REACT_APP_KEY_PAIR)._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)
const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl('devnet');

const opts = {
  preflightCommitment: "processed"
}

const App = () => {
  const { walletAddress, connectWallet } = useConnection();
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);


  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  const getGifList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      
      console.log("Got the account", account)
      setGifList(account.gifList)
  
    } catch (error) {
      console.log("Error in getGifList: ", error)
      setGifList(null);
    }
  }

  const handleInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();
  
    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const sendGif = async () => {
    if (inputValue.length < 7) {
      console.log("No valid gif link given!")
      return
    }

    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
  
      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputValue)
  
      setInputValue('');
      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
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
    console.log("Gif list: ", gifList);
    if (gifList == null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    }
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
            onChange={handleInputChange}
          />
          <button type="submit" className="cta-button submit-gif-button">
            Submit
          </button>
        </form>
        <div className="gif-grid">
          {gifList.map((item, index) => (
            <div className="gif-item" key={index}>
              <img src={item.gifLink} alt="gifLink" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="App">
			<div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">???? Cat GIF Portal</p>
          <p className="sub-text">
            View some cat gifs in the metaverse ???
          </p>
          {!walletAddress ? renderNotConnectedContainer() : renderConnectedContainer() }
        </div>
        <div className="footer-container">
          <a
            className="footer-text"
            href={LINKS.TWITTER.SELF}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TEXTS.SELF}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
