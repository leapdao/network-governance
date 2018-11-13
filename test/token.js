const Token = artifacts.require('./Token.sol');
const Controller = artifacts.require('./Controller.sol');
const { assertRevert } = require('./helpers/assertThrow')

contract('Token', (accounts) => {
  let token;
  let tokenProxy;
  let controller;

  beforeEach(async () => {
    tokenProxy = await Token.new();
    controller = await Controller.new();
    token = Controller.at(tokenProxy.address);
  });

  it('should be initializable through proxy', async () => {
    // initialize contract
    await token.initialize(controller.address, 400000000);
    // check total supply
    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply.toNumber(), 0);
    // check cap
    let cap = await token.cap();
    assert.equal(cap.toNumber(), 400000000);
    // check wiring to proxy
    let del = await tokenProxy.delegation();
    assert.equal(del, controller.address);
    // check wiring to proxy
    let addr = await token.thisAddr();
    assert.equal(addr, controller.address);
  });

  it('should not be initializable without proxy', async () => {
    // try to call initialize() without delegatecall
    return assertRevert(async () => {
        await controller.initialize(controller.address, 400000000);
    });
  });

  it('should mint a given amount of tokens to a given address', async function () {
    // initialize contract
    await token.initialize(controller.address, 100);
    // mint some tokens
    const result = await token.mint(accounts[0], 100);
    // validate balance
    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0.toNumber(), 100);
    // validate supply
    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply.toNumber(), 100);
  });

  it('should allow to update controller', async function () {
    // initialize contract
    await token.initialize(controller.address, 200);
    // mint some tokens
    let result = await token.mint(accounts[0], 100);
    // validate supply
    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply.toNumber(), 100);
    // deploy new controller
    let newController = await Controller.new();
    await tokenProxy.transferDelegation(newController.address);
    // check wiring
    let delegation = await tokenProxy.delegation();
    assert.equal(delegation, newController.address);
    // mint some more tokens on top
    result = await token.mint(accounts[0], 100);
    // validate supply
    totalSupply = await token.totalSupply();
    assert.equal(totalSupply.toNumber(), 200);
  });

  it('changes owner after transfer', async function () {
    // initialize contract
    await token.initialize(controller.address, 200);

    let other = accounts[1];
    await token.transferOwnership(other);
    let owner = await token.owner();

    assert.isTrue(owner === other);
  });

  it('should prevent non-owners from transfering', async function () {
    // initialize contract
    await token.initialize(controller.address, 200);
    const other = accounts[2];
    const owner = await token.owner.call();
    assert.isTrue(owner !== other);
    return assertRevert(async () => {
        await token.transferOwnership(other, { from: other });
    });
  });

  it('should guard ownership against stuck state', async function () {
    // initialize contract
    await token.initialize(controller.address, 200);
    let originalOwner = await token.owner();
    return assertRevert(async () => {
        await token.transferOwnership(null, { from: originalOwner });
    });
  });

  it('should allow to read string', async function () {
    // initialize contract
    await token.initialize(controller.address, 200);
    assert.equal(await token.name(), 'Leap DAO');
  });
});
