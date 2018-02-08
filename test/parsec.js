const Parsec = artifacts.require('./Parsec.sol');
const Controller = artifacts.require('./Controller.sol');

contract('Parsec', (accounts) => {
  let parsec;
  let parsecProxy;
  let controller;

  beforeEach(async () => {
    parsecProxy = await Parsec.new();
    controller = await Controller.new();
    parsec = Controller.at(parsecProxy.address);
  });

  it('it should be initialized properly', async () => {
    // initialize contract
    await parsec.initialize(controller.address, 400000000);
    // check total supply
    let totalSupply = await parsec.totalSupply();
    assert.equal(totalSupply.toNumber(), 0);
    // check cap
    let cap = await parsec.cap();
    assert.equal(cap.toNumber(), 400000000);
    // check wiring to proxy
    let del = await parsecProxy.delegation();
    assert.equal(del, controller.address);
    // check wiring to proxy
    let addr = await parsec.thisAddr();
    assert.equal(addr, controller.address);
  });

  it('should mint a given amount of tokens to a given address', async function () {
    // initialize contract
    await parsec.initialize(controller.address, 100);
    // mint some tokens
    const result = await parsec.mint(accounts[0], 100);
    // validate balance
    let balance0 = await parsec.balanceOf(accounts[0]);
    assert.equal(balance0.toNumber(), 100);
    // validate supply
    let totalSupply = await parsec.totalSupply();
    assert.equal(totalSupply.toNumber(), 100);
  });

  it('should allow to update controller', async function () {
    // initialize contract
    await parsec.initialize(controller.address, 200);
    // mint some tokens
    let result = await parsec.mint(accounts[0], 100);
    // validate supply
    let totalSupply = await parsec.totalSupply();
    assert.equal(totalSupply.toNumber(), 100);
    // deploy new controller
    let newController = await Controller.new();
    await parsecProxy.transferDelegation(newController.address);
    // check wiring
    let delegation = await parsecProxy.delegation();
    assert.equal(delegation, newController.address);
    // mint some more tokens on top
    result = await parsec.mint(accounts[0], 100);
    // validate supply
    totalSupply = await parsec.totalSupply();
    assert.equal(totalSupply.toNumber(), 200);
  });
});
