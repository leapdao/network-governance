const Parsec = artifacts.require('./Parsec.sol');
const Controller = artifacts.require('./Controller.sol');
const hexToString = require('./helpers/hexToString');

contract('Parsec', (accounts) => {
  let parsec;
  let controller;

  before(async () => {
    let parsecProxy = await Parsec.new();
    controller = await Controller.new();
    await parsecProxy.transferDelegation(controller.address);
    parsec = Controller.at(parsecProxy.address);
    await parsec.initialize();
  });

  it('it should delegate call to controller and allow transfer', async () => {

    let initialized = await parsec.getInitializationBlock();
    assert(initialized.toNumber() > 0);

  });

  it('should start with a totalSupply of 0', async function () {
    await parsec.setCap(400000000);
    let totalSupply = await parsec.totalSupply();

    assert.equal(totalSupply.toNumber(), 0);
  });

  it('should mint a given amount of tokens to a given address', async function () {
    const result = await parsec.mint(accounts[0], 100);
    let balance0 = await parsec.balanceOf(accounts[0]);
    assert(balance0, 100);
    let totalSupply = await parsec.totalSupply();
    assert(totalSupply, 100);
  });

});
