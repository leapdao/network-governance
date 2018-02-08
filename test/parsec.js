const Parsec = artifacts.require('./Parsec.sol');
const Controller = artifacts.require('./Controller.sol');
const hexToString = require('./helpers/hexToString');

contract('Parsec', (accounts) => {
  let parsec;
  let controller;

  beforeEach(async () => {
    let parsecProxy = await Parsec.new();
    controller = await Controller.new();
    await parsecProxy.transferDelegation(controller.address);
    parsec = Controller.at(parsecProxy.address);
    await parsec.initialize();
  });

  it('it should delegate call to controller and allow transfer', async () => {

    let initialized = await parsec.getInitializationBlock();


    console.log(initialized.toNumber());

  });

  it('should start with a totalSupply of 0', async function () {
    let totalSupply = await parsec.totalSupply();

    assert.equal(totalSupply.toNumber(), 0);
  });

  it('should mint a given amount of tokens to a given address', async function () {
    const result = await parsec.mint(accounts[0], 100);
    assert.equal(result.logs[0].event, 'Mint');
    assert.equal(result.logs[0].args.to.valueOf(), accounts[0]);
    assert.equal(result.logs[0].args.amount.valueOf(), 100);
    assert.equal(result.logs[1].event, 'Transfer');
    assert.equal(result.logs[1].args.from.valueOf(), 0x0);

    let balance0 = await parsec.balanceOf(accounts[0]);
    assert(balance0, 100);

    let totalSupply = await parsec.totalSupply();
    assert(totalSupply, 100);
  });

});
