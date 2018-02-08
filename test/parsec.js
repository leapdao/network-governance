const Parsec = artifacts.require('./Parsec.sol');
const Controller = artifacts.require('./Controller.sol');
const hexToString = require('./helpers/hexToString');

contract('Parsec', (accounts) => {
  let parsec;
  let controller;

  beforeEach(async () => {
    let parsecProxy = await Parsec.new();
    controller = await Controller.new();
    await parsecProxy.transferOwnership(controller.address);
    parsec = Controller.at(parsecProxy.address);
    await parsec.initialize();
  });

  it('it should delegate call to controller and allow transfer', async () => {

    let initialized = await parsec.getInitializationBlock();
    console.log(initialized.toNumber());

  });
});
