import chai from 'chai';
import util from 'ethereumjs-util';

const Bridge = artifacts.require('./mocks/Bridge.sol');
const Operator = artifacts.require('./mocks/Operator.sol');
const Vault = artifacts.require('./mocks/Vault.sol');
const Proxy = artifacts.require('./Proxy.sol');
const MinGov = artifacts.require('./MinGov.sol');

chai.use(require('chai-as-promised')).should();

contract('MinGov', (accounts) => {

  let bridge;
  let gov;

  beforeEach(async () => {
    gov = await MinGov.new(0);
    // bridge
    const bridgeLogic = await Bridge.new();
    const proxy = await Proxy.new();
    await proxy.initialize(bridgeLogic.address);
    bridge = Bridge.at(proxy.address);
    await bridge.transferOwnership(gov.address);
  });

  it('should allow to propose and finalize one operation', async () => {
    // check value before
    let operator = await bridge.operator();
    assert.equal(operator, '0x0000000000000000000000000000000000000000');
    // propose and finalize value change
    const data = await bridge.contract.setOperator.getData(accounts[1]);
    await gov.propose(bridge.address, data);
    await gov.finalize();

    // check value after
    operator = await bridge.operator();
    assert.equal(operator, accounts[1]);
  });

  it('should allow to propose and finalize multiple operations', async () => {
    // operator
    const operatorLogic = await Operator.new();
    const proxyOp = await Proxy.new();
    await proxyOp.initialize(operatorLogic.address);
    const operator = Operator.at(proxyOp.address);
    await operator.transferOwnership(gov.address);

    // propose and finalize value changes
    const data1 = await operator.contract.setMinGasPrice.getData(200);
    await gov.propose(operator.address, data1);
    const data2 = await operator.contract.setEpochLength.getData(32);
    await gov.propose(operator.address, data2);
    let size = await gov.size();
    let first = await gov.first();
    assert.equal(size.toNumber(), 2);
    await gov.finalize();

    // check values after
    let minGasPrice = await operator.minGasPrice();
    assert.equal(minGasPrice.toNumber(), 200);
    const epochLength = await operator.epochLength();
    assert.equal(epochLength.toNumber(), 32);

    // propose and finalize value changes
    const data3 = await operator.contract.setParentBlockInterval.getData(300);
    await gov.propose(operator.address, data3);
    first = await gov.first();
    // position 1 and 2 have been used in first finalize
    assert.equal(first.toNumber(), 3);
    size = await gov.size();
    assert.equal(size.toNumber(), 1);
    await gov.finalize();

    // check values after
    const parentBlockInterval = await operator.parentBlockInterval();
    assert.equal(parentBlockInterval.toNumber(), 300);
    first = await gov.first();
    size = await gov.size();
    // position 3 in second finalize
    assert.equal(first.toNumber(), 4);
    // nothing in the pipe
    assert.equal(size.toNumber(), 0);
  });


  it('should allow to finalize same operation multiple times', async () => {
    // vault
    const vaultLogic = await Vault.new();
    const proxyVa = await Proxy.new();
    await proxyVa.initialize(vaultLogic.address);
    const vault = Vault.at(proxyVa.address);
    await vault.transferOwnership(gov.address);

    // propose and finalize value change
    const data = await vault.contract.registerToken.getData(accounts[1]);
    await gov.propose(vault.address, data);
    await gov.finalize();

    // check value after
    let count = await vault.tokenCount();
    assert.equal(count, 1);

    // propose and finalize value change
    const data2 = await vault.contract.registerToken.getData(accounts[2]);
    await gov.propose(vault.address, data2);
    await gov.finalize();

    // check value after
    count = await vault.tokenCount();
    assert.equal(count, 2);

    const first = await gov.first();
    const size = await gov.size();
    // position 3 in second finalize
    assert.equal(first.toNumber(), 3);
    // nothing in the pipe
    assert.equal(size.toNumber(), 0);
  });

  it('should allow to upgrade bridge', async () => {
    // deploy new contract
    const proxy = Proxy.at(bridge.address);
    const newBridgeLogic = await Bridge.new();

    // propose and finalize upgrade
    const data = await proxy.contract.transferLogic.getData(newBridgeLogic.address);
    await gov.propose(bridge.address, data);
    await gov.finalize();

    // check value after
    const logicAddr = await proxy.logic();
    assert.equal(logicAddr, newBridgeLogic.address);
  });

  it('should allow to transfer into new governance', async () => {

    // propose and finalize upgrade
    const data = await bridge.contract.transferOwnership.getData(accounts[1]);
    await gov.propose(bridge.address, data);
    await gov.finalize();

    // check value after
    const ownerAddr = await bridge.owner();
    assert.equal(ownerAddr, accounts[1]);
  });

});