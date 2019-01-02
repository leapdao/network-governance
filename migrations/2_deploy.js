/* eslint-disable no-console */
const fs = require('fs');
const truffleConfig = require('../truffle.js');

const MinGov = artifacts.require('MinGov');

const logError = err => { if (err) { console.log(err); } }

function abiFileString(abi) {
  return `module.exports = ${JSON.stringify(abi)}`;
}

function writeAbi(name, abi) {
  fs.writeFile(`./build/nodeFiles/${name}.js`, abiFileString(abi), logError);
}

module.exports = (deployer, network, accounts) => {
  const admin = accounts[1];

  const proposalTime = 10;

  let data;

  deployer.then(async () => {
    const minGov = await deployer.deploy(MinGov, proposalTime, {from: admin});

    try {
      fs.mkdirSync('./build/nodeFiles');
    } catch(error) {
      // we don;t care
    }

    writeAbi('minGov', MinGov.abi);

    console.log("Generated node files in /build/nodeFiles");
  })
}