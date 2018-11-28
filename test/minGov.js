import chai from 'chai';
import util from 'ethereumjs-util';

const LeapBridge = artifacts.require('./LeapBridge.sol');
const MinGov = artifacts.require('./MinGov.sol');

chai.use(require('chai-as-promised')).should();

contract('MinGov', (accounts) => {

  let bridge;
  let gov;

  before(async () => {
    bridge = await LeapBridge.new();
    gov = await MinGov.new(bridge.address, 0);
    await bridge.transferOwnership(gov.address);
  });


  it('should allow to propose and finalize one operation', async () => {
    // check value before
    const exitStake1 = await bridge.exitStake();
    assert.equal(exitStake1.toNumber(), 0);

    // propose and finalize value change
    const data = await bridge.contract.setExitStake.getData(100);
    await gov.propose(data);
    await gov.finalize();

    // check value after
    const exitStake2 = await bridge.exitStake();
    assert.equal(exitStake2.toNumber(), 100);
  });

  it('should allow to propose and finalize multiple operations', async () => {
    // propose and finalize value changes
    const data1 = await bridge.contract.setExitStake.getData(200);
    await gov.propose(data1);
    const data2 = await bridge.contract.setEpochLength.getData(32);
    await gov.propose(data2);
    await gov.finalize();

    // check values after
    const exitStake = await bridge.exitStake();
    assert.equal(exitStake.toNumber(), 200);
    const epochLength = await bridge.epochLength();
    assert.equal(epochLength.toNumber(), 32);
  });

});