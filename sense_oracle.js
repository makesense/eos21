require('dotenv').config()
const fs = require('fs');
const Web3 = require('web3');
const EosJs = require('eosjs');
const check = require('./utils/Check');
const blackHoleFile = require('./blackhole/build/contracts/BlackHoleEosAccount.json');
const createWormHole = require('./oracle/TeleportOracle.js');

console.log("ERC20 teleporting starts ...");

// ETH CONFIGS
const ethereumProvider = process.env.ETH_WEBSOCKET_PROVIDER;
const blackHoleAddress = process.env.MIGRATION_CONTRACT;
console.log("Current blackhole contract: ", blackHoleAddress);
const decimals = process.env.ETH_DECIMALS;
const symbol = process.env.ETH_SYMBOL;

// EOS CONFIGS
const eosProvider = process.env.EOS_API_ENDPOINT;
const chainId = process.env.EOS_CHAIN_ID;
const eosioTokenKey = process.env.EOS_ACTIVE_PK;
const eosioTokenAddress = process.env.EOS_TOKEN_CONTRACT;
const eosDecimals = 4;
const exchangeMultiplier = process.env.EOS_EXCHANGE_RATE;
const eosTokenSymbol = process.env.EOS_TOKEN_SYMBOL;
const eosIssuer = process.env.EOS_TOKEN_ISSUER;
const teleportMemo = "Welcome to SENSE on EOS!";

check(Web3.utils.isAddress(blackHoleAddress), "migration contract: " + blackHoleAddress);
check(eosioTokenAddress, "eosio.token account: " + eosioTokenAddress);
check(ethereumProvider, "Ethereum provider: " + ethereumProvider);
check(eosProvider, "EOS provider: " + eosProvider);
check(symbol, "ERC20 symbol: " + symbol);
check(decimals, "ERC20 decimals: " + decimals);
check(chainId, "chain_id: " + chainId);
check(eosTokenSymbol, "EOS Token Symbol: " + eosTokenSymbol);
check(eosIssuer, "EOS Token Issuer");

eosConfig = {
    chainId: chainId, // 32 byte (64 char) hex string
    keyProvider: [eosioTokenKey], // WIF string or array of keys..
    httpEndpoint: eosProvider,
    expireInSeconds: 60,
    broadcast: true,
    verbose: false, // API activity
    sign: true,
    authorization: eosIssuer + '@active'
};

const contract = blackHoleFile;
const abi = contract.abi;
const websocketProvider = new Web3.providers.WebsocketProvider(ethereumProvider);
const web3 = new Web3(websocketProvider);
const blackHole = new web3.eth.Contract(abi, blackHoleAddress);
const eos = EosJs(eosConfig);

// Prepare EOS instance

// Open up ETH Event Handler
createWormHole({blackHole,
  onData: event => {
    const { amount, note } = event.returnValues;
    const receivingAccount = note;
    const amountFloat = (amount/10**decimals);
    const amtToIssue = Math.ceil(amountFloat * exchangeMultiplier).toFixed(eosDecimals);
    console.log("Amount to issue on EOS: ", amtToIssue);
    const amountWithSymbol = amtToIssue + " " + eosTokenSymbol;
    console.log("(EVENT) amount=" + amountWithSymbol + ", to=" + note);

    eos.contract(eosioTokenAddress)
      .then(eosioToken => {
        eosioToken.transfer(eosIssuer, receivingAccount, amountWithSymbol, teleportMemo)
          .then( result => {console.log(result)})
          .catch(console.error); // Implement notifier to team of failed txn
      })
  }
});

