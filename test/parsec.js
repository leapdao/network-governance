const Parsec = artifacts.require('./Parsec.sol');
const Controller = artifacts.require('./Controller.sol');
const hexToString = require('./helpers/hexToString');

contract('Parsec', (accounts) => {
  let parsec;
  let controller;

  beforeEach(async () => {
    parsec = await Parsec.new();
    controller = await Controller.new(parsec.address);
    await parsec.transferOwnership(controller.address);
    var initializeData = ((web3.eth.contract(controller.abi)).at(controller.address)).Initialize.getData();
    await web3.eth.sendTransaction({from: accounts[0], to: parsec.address, data: initializeData, gas: 4500000});
  });

  it('it should delegate call to controller and allow transfer', async () => {

    var initializedData = ((web3.eth.contract(controller.abi)).at(controller.address)).getInitializationBlock.getData();
    const initialized = await web3.eth.call({from: accounts[1], to: parsec.address, data: initialized, gas: 4500000});

    console.log(initialized);

  });
});
