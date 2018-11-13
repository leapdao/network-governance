import chai from 'chai';
import EVMRevert from './helpers/EVMRevert';
const VestingLock = artifacts.require('./VestingLock.sol');
const Token = artifacts.require('./Token.sol');
const TacoIncomeToken = artifacts.require('./income/TacoIncomeToken.sol');
const Controller = artifacts.require('./Controller.sol');
const { assertRevert } = require('./helpers/assertThrow')

const should = chai
  .use(require('chai-as-promised'))
  .should();

contract('VestingLock', (accounts) => {
  let nft;
  let token;
  let tokenProxy;
  let controller;
  const total = 10000000;
  const alice = accounts[1];

  beforeEach(async () => {
    nft = await TacoIncomeToken.new().should.be.fulfilled;
    tokenProxy = await Token.new().should.be.fulfilled;
    controller = await Controller.new().should.be.fulfilled;
    token = Controller.at(tokenProxy.address);
    await token.initialize(controller.address, 400000000);
    let result = await token.mint(accounts[0], total).should.be.fulfilled;
  });

  it('allow to lock and vest', async () => {
  	let vesting = await VestingLock.new(token.address, nft.address, 2, 4, alice).should.be.fulfilled;
  	await token.transfer(vesting.address, total).should.be.fulfilled;

    // record one income
    await nft.mint(alice, 1).should.be.fulfilled;
    await vesting.transfer(alice, 0, {from: alice }).should.be.fulfilled;

    // check that cliff not passed yet
    let claimBal = await vesting.balanceOf(alice);
    assert.equal(claimBal.toNumber(), 0);

    // record another income
    await nft.mint(alice, 2).should.be.fulfilled;

    // check that cliff passed
    claimBal = await vesting.balanceOf(alice);
    assert.equal(claimBal.toNumber(), total / 2);

    // claim first tokens
  	await vesting.transfer(alice, 0, {from: alice }).should.be.fulfilled;
  	let bal = await token.balanceOf(alice);
  	assert.equal(bal, total / 2);

    // allow claims in different orders
    const event = await nft.mint(alice, 3).should.be.fulfilled;
    await nft.mint(alice, 4).should.be.fulfilled;
    await vesting.transfer(alice, 0, { from: alice }).should.be.fulfilled;

    bal = await token.balanceOf(alice);
    assert.equal(bal.toNumber(), 7500000);

    await vesting.transfer(event.logs[0].args._tokenId, 0, { from: alice }).should.be.fulfilled;

    // check everything claimed
  	bal = await token.balanceOf(alice);
    assert.equal(bal.toNumber(), total);
    
    const vd = await vesting.decimals();
    const pd = await token.decimals();
    assert.equal(vd.toNumber(), pd.toNumber());
  });
});