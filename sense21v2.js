const fs = require('fs');
const Web3 = require('web3');
const EosJs = require('eosjs');
const check = require('./utils/Check');
const blackHoleFile = require('./blackhole/build/contracts/BlackHoleEosAccount.json');
const createWormHole = require('./oracle/TeleportOracle.js');

console.log("ERC20 teleporting starts ...");

const getParams = () => {
    const argv = require('minimist')(process.argv.slice(2), {
        default: {
            config: 'configLocal.json'
        }
    });

    const configFile = argv.config;
    check(fs.existsSync(configFile), "configuration file: " + configFile);
    const config = JSON.parse(fs.readFileSync(configFile));
    return config;
}

const params = getParams();

const eosioTokenKey = params.eosiotoken.private_key;
const eosProvider = params.eosiotoken.http_endpoint;
const ethereumProvider = params.blackhole.websocket_provider;
const eosioTokenAddress = params.eosiotoken.account;
const blackHoleAddress = params.blackhole.address;
console.log("Current blackhole contract: ", blackHoleAddress);
const decimals = params.blackhole.decimals;
const eosDecimals = 4;
const exchangeMultiplier = 3.01369863;
const symbol = params.blackhole.symbol;
const chainId = params.eosiotoken.chain_id;
const eosTokenSymbol = params.eosiotoken.symbol;
const eosIssuer = params.eosiotoken.issuer;
const teleportMemo = "Welcome to SENSE on EOS!";

check(Web3.utils.isAddress(blackHoleAddress), "blackhole account: " + blackHoleAddress);
check(eosioTokenAddress, "eosio.token account: " + eosioTokenAddress);
check(eosioTokenKey, 'eosio.token key: ' + eosioTokenKey);
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

//const input = fs.readFileSync(blackHoleFile);
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

