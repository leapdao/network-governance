const Controller = artifacts.require('./Controller.sol');
const Parsec = artifacts.require('./Parsec.sol');
const Founder = web3.eth.accounts[0];
const Investor = web3.eth.accounts[1];
const assertJump = require("./helpers/assertJump");

contract('Test', (accounts) => {
  let proxy;
  let proxyInstance;
  let controller;

  before(async () => {
    controller = await Controller.new();
    proxyInstance = await Parsec.new();
    await proxyInstance.setKeyHolder('controller', controller.address);
    proxy = Controller.at(proxyInstance.address);
    await proxy.assignTokens(Founder, 4000000000);
  });

  it('it should delegate call to controller to read balance data', async () => {
    assert.equal((await proxy.balanceOf(Founder)).toNumber(), 4000000000);
    assert.equal((await proxy.totalSupply()).toNumber(), 4000000000);
    assert.equal(await proxyInstance.crate.call('controller'), controller.address)
  });

  it('it should delegate call to controller and allow transfer', async () => {
    await proxy.transfer(Investor, 2000000000)
    assert.equal((await proxy.balanceOf(Investor)).toNumber(), 2000000000);
    assert.equal((await proxy.totalSupply()).toNumber(), 4000000000);
    assert.equal(await proxyInstance.crate.call('controller'), controller.address)
  });

  it('it should delegate call to controller and allow approve plus transferFrom', async () => {
    await proxy.approve(Investor, 2000000000);
    assert.equal((await proxy.allowance.call(Founder, Investor)).toNumber(), 2000000000)

    var transferFrom = ((web3.eth.contract(controller.abi)).at(controller.address)).transferFrom.getData(Founder, Investor, 2000000000, "");
    await web3.eth.sendTransaction({from: accounts[0], to: proxy.address, data: transferFrom, gas: 4500000});
    assert.equal((await proxy.balanceOf(Investor)).toNumber(), 4000000000);
    assert.equal((await proxy.totalSupply()).toNumber(), 4000000000);
    assert.equal(await proxyInstance.crate.call('controller'), controller.address)
  });

  it('it should allow to change controller and retain data', async () => {
    await proxy.assignTokens(Founder, 4000000000);
    await proxy.approve(Investor, 2000000000);
    var transferFrom = ((web3.eth.contract(controller.abi)).at(controller.address)).transferFrom.getData(Founder, Investor, 2000000000, "");
    await web3.eth.sendTransaction({from: accounts[0], to: proxy.address, data: transferFrom, gas: 4500000});

    // change controller and set
    const controllerNew = await Controller.new();
    await controller.kill(controllerNew.address)
    await proxyInstance.setKeyHolder('controller', controllerNew.address);

    controller = controllerNew;
    assert.equal((await proxy.balanceOf(Investor)).toNumber(), 6000000000);
    assert.equal((await proxy.totalSupply()).toNumber(), 8000000000);
    assert.equal(await proxyInstance.crate.call('controller'), controller.address)
    assert.equal(await proxyInstance.crate.call('owner'), accounts[0])
  });

  it('it should not allow to kill controller by non owner', async () => {
    const controllerNew = await Controller.new();
    try {
      await controller.kill(controllerNew.address, {from: Investor});
      assert.fail("should have failed before")
    } catch(error) {
      assertJump(error);
    }
  });
});
