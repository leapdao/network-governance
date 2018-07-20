import chai from 'chai';
import EVMRevert from './helpers/EVMRevert';
const VestingLock = artifacts.require('./VestingLock.sol');
const Parsec = artifacts.require('./Parsec.sol');
const TacoIncomeToken = artifacts.require('./income/TacoIncomeToken.sol');
const Controller = artifacts.require('./Controller.sol');
const { assertRevert } = require('./helpers/assertThrow')

const should = chai
  .use(require('chai-as-promised'))
  .should();

contract('VestingLock', (accounts) => {
  let nft;
  let parsec;
  let parsecProxy;
  let controller;
  const total = 10000000;
  const alice = accounts[1];

  beforeEach(async () => {
    nft = await TacoIncomeToken.new().should.be.fulfilled;
    parsecProxy = await Parsec.new().should.be.fulfilled;
    controller = await Controller.new().should.be.fulfilled;
    parsec = Controller.at(parsecProxy.address);
    await parsec.initialize(controller.address, 400000000);
    let result = await parsec.mint(accounts[0], total).should.be.fulfilled;
  });

  it('allow to lock and vest', async () => {
  	let vesting = await VestingLock.new(parsec.address, nft.address, 2, 4, alice).should.be.fulfilled;
  	await parsec.transfer(vesting.address, total).should.be.fulfilled;

    // record one income
    await nft.mint(alice, 1).should.be.fulfilled;
    await vesting.transfer('', 0, {from: alice }).should.be.fulfilled;

    // check that cliff not passed yet
    let claimBal = await vesting.balanceOf(alice);
    assert.equal(claimBal.toNumber(), 0);

    // record another income
    await nft.mint(alice, 2).should.be.fulfilled;

    // check that cliff passed
    claimBal = await vesting.balanceOf(alice);
    assert.equal(claimBal.toNumber(), total / 2);

    // claim first tokens
  	await vesting.transfer('', 0, {from: alice }).should.be.fulfilled;
  	let bal = await parsec.balanceOf(alice );
  	assert.equal(bal.mul(2).toNumber(), total);

    // allow claims in different orders
    const event = await nft.mint(alice, 3).should.be.fulfilled;
    await nft.mint(alice, 4).should.be.fulfilled;
    await vesting.transfer('', 0, { from: alice }).should.be.fulfilled;
    await vesting.transfer('', event.logs[0].args._tokenId, { from: alice }).should.be.fulfilled;

    // check everything claimed
  	bal = await parsec.balanceOf(alice);
  	assert(bal.toNumber() === total);
  });
});