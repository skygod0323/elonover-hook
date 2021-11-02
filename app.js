/**
 * To run this example please read README.md file
 */
var Express = require('express');
var Webhook = require('coinbase-commerce-node').Webhook;
/**
 * Past your webhook secret from Settings/Webhook section
 */
var webhookSecret = '2361566a-0642-4704-8fa7-64b787bfb97f';
var router = Express.Router();
var dbConn  = require('./lib/db');
var app = Express();

function rawBody(req, res, next) {
	req.setEncoding('utf8');

	var data = '';

	req.on('data', function (chunk) {
		data += chunk;
	});

	req.on('end', function () {
		req.rawBody = data;

		next();
	});
}

async function getTokenInfo() {
  return new Promise((resolve, reject) => {
    var query = "SELECT * FROM settings;";
    dbConn.query(query ,function(err,rows) {
      if(err) {
          console.log(err);
          resolve({
            result: false
          })
      } else {
        var res = {};
        if (rows.length > 0) {
          for (let i=0; i < rows.length; i++) {
            res[rows[i]['key']] = rows[i]['value'];
          }

          resolve({
            result: true,
            data: res
          });
        } else {
          resolve({
            result: false
          });
        }
      }
    });
  })
}

const sendToken =  async (toAddress, amount) => {
    var Web3 = require('web3')
    var web3 = new Web3(new Web3.providers.HttpProvider('https://bsc-dataseed1.binance.org'))

    console.log('get token setting info .....')
    var res = await getTokenInfo();
    if (!res.result) return;
    if (!res.data.wallet_address || !res.data.private_key || !res.data.contract_address || !res.data.contract_abi) return;
  
    // var myAddress = '0xF3B64A1F3bA023daf36415C7385EEAf64f6142C8';
    // var privateKey = 'd51c403373d3a7f3daba2afd14ee418898beb9c94484a0b42b61305d02d232fb';  
    // var abiArray = [{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"symbol","type":"string"},{"internalType":"uint8","name":"decimals","type":"uint8"},{"internalType":"uint256","name":"initialBalance","type":"uint256"},{"internalType":"address payable","name":"feeReceiver","type":"address"}],"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}];
    // var contractAddress = '0xcB424ba2e5C127dAcfeC1Dc0E520A76b4cce327F';
  
    var myAddress = res.data.wallet_address;
    var privateKey = res.data.private_key;
    var abiArray = JSON.parse(res.data.contract_abi);
    var contractAddress = res.data.contract_address;

    var count;
  
    await web3.eth.getTransactionCount(myAddress).then(function (v) { 
      count = v 
    })
  
    web3.eth.accounts.wallet.add(privateKey);
    contract = new web3.eth.Contract(abiArray, contractAddress)
  
    var txCount = '0x' + (await web3.eth.getTransactionCount(myAddress) + 0).toString(16)
    console.log('txCount: ', txCount)
  
    try {
      let receipt = await contract.methods.transfer(toAddress, web3.utils.numberToHex(web3.utils.toWei(amount, 'ether'))).send({ 
        from: myAddress,
        gasPrice: '10000000000',
        gas: '51000',
      });

      let res = {
        success: true,
        block: receipt.blockNumber,
        txHash: receipt.transactionHash
      };

      console.log(res);

      return res;

    } catch(err) {
      return {
        success: false
      }
    }
}

function updatePurchaseStatus(code, tx) {
  if (tx.success) {
    let block = tx.block;
    let txHash = tx.txHash;
    let query = `UPDATE purchases 
                  SET block = '${block}', tx_hash = '${txHash}', purchase_status = 'success' 
                  WHERE payment_code = '${code}';`
    dbConn.query(query ,function(err, result) {
      if(err) {
        console.log(err);
      } else {
        console.log('updated');
      }
    });
  } else {
    let query = `UPDATE purchases 
                  SET purchase_status = 'cancelled' 
                  WHERE payment_code = '${code}';`
    dbConn.query(query ,function(err, result) {
      if(err) {
        console.log(err);
      } else {
        console.log('updated');
      }
    });
  }
}

function updatePaymentStatus(code, status) {

  let query = `UPDATE purchases 
                SET payment_status = '${status}' 
                WHERE payment_code = '${code}';`
  dbConn.query(query ,function(err, result) {
    if(err) {
      console.log(err);
    } else {
      console.log('updated');
    }
  });
}

async function tokenProcess(code) {
  var query = "SELECT * FROM purchases WHERE payment_code ='" + code + "' LIMIT 1;";
  dbConn.query(query ,function(err,rows)     {
    if(err) {
        console.log(err);
    } else {
        if (rows.length > 0) {
          receiver = rows[0]['wallet_address'];
          amount = rows[0]['token_amount'];

          sendToken(receiver, amount).then(res => {
            updatePurchaseStatus(code, res);
          });
        }
    }
  });
}

router.post('/', function (request, response) {
	var event;

	console.log(request.headers);

	try {
		event = Webhook.verifyEventBody(
			request.rawBody,
			request.headers['x-cc-webhook-signature'],
			webhookSecret
		);
	} catch (error) {
		console.log('Error occured', error.message);
		return response.status(401).send('Webhook Error:' + error.message);
	}

	

  eventId = event.id;
  eventCode = event.data.code;
  eventType = event.type;

  if (eventType == 'charge:confirmed') {
    updatePaymentStatus(eventCode, 'confirmed');
    tokenProcess(eventCode);
    console.log('payment confirmed');
    console.log('Success', event.id);
  } else if (eventType == 'charge:failed'){
    updatePaymentStatus(eventCode, 'cancelled');
    updatePurchaseStatus(eventCode, {success: false});
  }

	response.status(200).send('Signed Webhook Received: ' + event.id);
});

app.use(rawBody);
app.use(router);

//tokenProcess('5BFE89C9');
// updatePaymentStatus('5BFE89C9', 'confirmed');
// updatePurchaseStatus('5BFE89C9', {success: false});

//sendToken('0xa576962697FDC53108118c7AAd4A06eEE48974fD', '33');

app.listen(3000, function () {
	console.log('App listening on port 3000!');
});