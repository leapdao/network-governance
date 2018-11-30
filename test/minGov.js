import chai from 'chai';
import util from 'ethereumjs-util';

const LeapBridge = artifacts.require('./LeapBridge.sol');
const Proxy = artifacts.require('./Proxy.sol');
const MinGov = artifacts.require('./MinGov.sol');

chai.use(require('chai-as-promised')).should();

contract('MinGov', (accounts) => {

  let bridge;
  let gov;

  beforeEach(async () => {
    const bridgeLogic = await LeapBridge.new();
    const proxy = await Proxy.new();
    await proxy.initialize(bridgeLogic.address);
    bridge = LeapBridge.at(proxy.address);
    gov = await MinGov.new(0);
    await bridge.transferOwnership(gov.address);
  });


  it('should allow to propose and finalize one operation', async () => {
    // check value before
    const exitStake1 = await bridge.exitStake();
    assert.equal(exitStake1.toNumber(), 0);
    // propose and finalize value change
    const data = await bridge.contract.setExitStake.getData(100);
    await gov.propose(bridge.address, data);
    await gov.finalize();

    // check value after
    const exitStake2 = await bridge.exitStake();
    assert.equal(exitStake2.toNumber(), 100);
  });

  it('should allow to propose and finalize multiple operations', async () => {
    // propose and finalize value changes
    const data1 = await bridge.contract.setExitStake.getData(200);
    await gov.propose(bridge.address, data1);
    const data2 = await bridge.contract.setEpochLength.getData(32);
    await gov.propose(bridge.address, data2);
    let size = await gov.size();
    let first = await gov.first();
    assert.equal(size.toNumber(), 2);
    await gov.finalize();

    // check values after
    let exitStake = await bridge.exitStake();
    assert.equal(exitStake.toNumber(), 200);
    const epochLength = await bridge.epochLength();
    assert.equal(epochLength.toNumber(), 32);

    // propose and finalize value changes
    const data3 = await bridge.contract.setExitStake.getData(300);
    await gov.propose(bridge.address, data3);
    first = await gov.first();
    // position 1 and 2 have been used in first finalize
    assert.equal(first.toNumber(), 3);
    size = await gov.size();
    assert.equal(size.toNumber(), 1);
    await gov.finalize();

    // check values after
    exitStake = await bridge.exitStake();
    assert.equal(exitStake.toNumber(), 300);
    first = await gov.first();
    size = await gov.size();
    // position 3 in second finalize
    assert.equal(first.toNumber(), 4);
    // nothing in the pipe
    assert.equal(size.toNumber(), 0);
  });

  it('should allow to do upgrade', async () => {
    // deploy new contract
    const proxy = Proxy.at(bridge.address);
    const newBridgeLogic = await LeapBridge.new();

    // propose and finalize upgrade
    const data = await proxy.contract.transferLogic.getData(newBridgeLogic.address);
    await gov.propose(bridge.address, data);
    await gov.finalize();

    // check value after
    const logicAddr = await proxy.logic();
    assert.equal(logicAddr, newBridgeLogic.address);
  });

});