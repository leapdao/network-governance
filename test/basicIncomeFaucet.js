import chai from 'chai';
import EVMRevert from './helpers/EVMRevert';
const BasicIncomeFaucet = artifacts.require('./income/BasicIncomeFaucet.sol');
const TacoIncomeToken = artifacts.require('./income/TacoIncomeToken.sol');
const SimpleToken = artifacts.require('./mocks/SimpleToken.sol');
const { assertRevert } = require('./helpers/assertThrow')
import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';

const should = chai
  .use(require('chai-as-promised'))
  .should();

contract('BasicIncomeFaucet', (accounts) => {
  let nft;
  let faucet;
  let token;
  const council = accounts[0];
  const alice = accounts[1];

  beforeEach(async () => {
    nft = await TacoIncomeToken.new().should.be.fulfilled;
    token = await SimpleToken.new().should.be.fulfilled;
    const tokensPerTaco = 750 * 100000000;
    faucet = await BasicIncomeFaucet.new(token.address, nft.address, council, tokensPerTaco, 60 * 60 * 24 * 3).should.be.fulfilled;
    const totalSupply = await token.totalSupply();
    await token.approve(faucet.address, totalSupply, {from: council});
  });

  it('should allow to mint basic income nft and claim tokens', async () => {
    // no faucet balance before basic income
    let available = await faucet.balanceOf(alice);
    assert.equal(available.toNumber(), 0);
    await nft.mint(alice, 4).should.be.fulfilled;
    // balance visible after token minting
    available = await faucet.balanceOf(alice);
    assert.equal(available.toNumber(), 300000000000);
    // claim faucet balance
    await faucet.transfer(alice, available, {from: alice}).should.be.fulfilled;
    const bal = await token.balanceOf(alice);
    assert.equal(bal.toNumber(), available.toNumber());
    // balance 0 after claim
    available = await faucet.balanceOf(alice);
    assert.equal(available.toNumber(), 0);

    // mint 8 more
    await nft.mint(alice, 8).should.be.fulfilled;
    const openingTime = latestTime();
    const nextWeek = openingTime + duration.weeks(1);
    await increaseTimeTo(nextWeek);
    available = await faucet.balanceOf(alice);
    assert.equal(available.toNumber(), 600000000000);
  });

  it('should cap at 8 tacos', async () => {
    await nft.mint(alice, 9).should.be.fulfilled;
    const available = await faucet.balanceOf(alice);
    await faucet.transfer(alice, available, {from: alice}).should.be.fulfilled;
  });

  it('should allow minting only by whitelisted accounts', async () => {
    await nft.mint(alice, 4, { from: alice }).should.be.rejectedWith(EVMRevert);
    await nft.addAddressToWhitelist(alice).should.be.fulfilled;
    await nft.mint(alice, 4, { from: alice }).should.be.fulfilled;
  });

  it('should prevent to claim less than 4 tacos', async () => {
    await nft.mint(alice, 3).should.be.fulfilled;
    const available = await faucet.balanceOf(alice);
    assert.equal(available.toNumber(), 0);
    await faucet.transfer(alice, available, {from: alice}).should.be.rejectedWith(EVMRevert);
  });

  it('should prevent double claim with same nft', async () => {
    await nft.mint(alice, 4).should.be.fulfilled;
    const available = await faucet.balanceOf(alice);
    // first try
    await faucet.transfer(alice, available, {from: alice}).should.be.fulfilled;
    // second try
    await faucet.transfer(alice, available, {from: alice}).should.be.rejectedWith(EVMRevert);
  });

  it('should prevent double claim with different nft within short time', async () => {
    let event = await nft.mint(alice, 4).should.be.fulfilled;
    const available = await faucet.balanceOf(alice);
    // first try
    await faucet.transfer(alice, available, {from: alice}).should.be.fulfilled;
    // second try
    await nft.mint(alice, 5).should.be.fulfilled;
    await faucet.transfer(alice, available, {from: alice}).should.be.rejectedWith(EVMRevert);
  });
});