const Parsec = artifacts.require('./Parsec.sol');
const Controller = artifacts.require('./Controller.sol');
const hexToString = require('./helpers/hexToString');

contract('Parsec', (accounts) => {
  let parsec;
  let parsecProxy;
  let controller;

  before(async () => {
    parsecProxy = await Parsec.new();
    controller = await Controller.new();
    await parsecProxy.transferDelegation(controller.address);
    parsec = Controller.at(parsecProxy.address);
    await parsec.initialize(400000000);
  });

  it('it should delegate call to controller to read data', async () => {
    let del = await parsecProxy.delegation();
    assert.equal(del, controller.address);

    let balance0 = await parsec.balanceOf(accounts[0]);
    assert.equal(balance0.toNumber(), 1);
    
    let cap = await parsec.cap();
    assert.equal(cap.toNumber(), 400000000);
  });

  it('should start with a totalSupply of 1', async function () {
    let totalSupply = await parsec.totalSupply();
    assert.equal(totalSupply.toNumber(), 1);
  });

  it('should mint a given amount of tokens to a given address', async function () {
    const result = await parsec.mint(accounts[0], 100);
    let balance0 = await parsec.balanceOf(accounts[0]);
    assert.equal(balance0.toNumber(), 101);
    let totalSupply = await parsec.totalSupply();
    assert.equal(totalSupply.toNumber(), 101);
  });

});
