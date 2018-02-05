const Parsec = artifacts.require('./Parsec.sol');
const Controller = artifacts.require('./Controller.sol');

contract('Parsec', (accounts) => {
  let parsec;
  let controller;

  beforeEach(async () => {
    parsec = await Parsec.new();
    controller = await Controller.new(parsec.address);
    await parsec.transferOwnership(controller.address);
  });

  it('it should delegate call to controller and allow transfer', async () => {
    var controllerContract = web3.eth.contract(controller.abi);
    var controllerContractInstance = controllerContract.at(controller.address);
    var assignData = controllerContractInstance.assignTokens.getData(accounts[0], 10000000000000);
    await web3.eth.sendTransaction({from: accounts[0], to: parsec.address, data: assignData, gas: 4500000});

    var transferData = controllerContractInstance.transfer.getData(accounts[1], 10000000000000);
    await web3.eth.sendTransaction({from: accounts[0], to: parsec.address, data: transferData, gas: 4500000});
  });
});
