import chai from 'chai';
import EVMRevert from './helpers/EVMRevert';
const MarketMaker = artifacts.require('./MarketMaker.sol');
const ERC721BasicToken = artifacts.require('./mocks/ERC721BasicTokenMock.sol');
const SimpleToken = artifacts.require('./mocks/SimpleToken.sol');
const { assertRevert } = require('./helpers/assertThrow')

const should = chai
  .use(require('chai-as-promised'))
  .should();

contract('MarketMaker', (accounts) => {
  let nft;
  let market;
  let token;
  let dai;
  const base = 15000 * 100000000;
  const minDaiPayment = 20000000000;
  const council = accounts[0];
  const alice = accounts[1];

  beforeEach(async () => {
    nft = await ERC721BasicToken.new().should.be.fulfilled;
    token = await SimpleToken.new({from: alice}).should.be.fulfilled;
    dai = await SimpleToken.new().should.be.fulfilled;
    market = await MarketMaker.new(token.address, dai.address, nft.address, council, base).should.be.fulfilled;
    const totalSupply = await dai.totalSupply();
    await dai.approve(market.address, totalSupply, {from: council});
    await token.approve(market.address, base * 20, {from: alice});
  });

  it('should allow to sell min amount of tokens for dai', async () => {
    // no marketMaker balance before basic income
    let available = await market.balanceOf(alice);
    assert.equal(available.toNumber(), 0);
    await nft.mint(alice, 4).should.be.fulfilled;
    // base marketMaker balance after minting
    available = await market.balanceOf(alice);
    assert.equal(available.toNumber(), minDaiPayment);
    // exchange tokens for dai
    await market.transfer(alice, base, {from: alice}).should.be.fulfilled;
    const bal = await dai.balanceOf(alice);
    assert.equal(bal.toNumber(), minDaiPayment);
  });

  it('should allow to sell tokens for dai with quadratic price increase', async () => {
    await nft.mint(alice, 4).should.be.fulfilled;
    await market.transfer(alice, base * 4.5, {from: alice}).should.be.fulfilled;
    const bal = await dai.balanceOf(alice);
    assert.equal(bal.toNumber(), 42426406871);
  });

  it('should allow to sell max amount of tokens for dai', async () => {
    await nft.mint(alice, 4).should.be.fulfilled;
    await market.transfer(alice, base * 16, {from: alice}).should.be.fulfilled;
    const bal = await dai.balanceOf(alice);
    assert.equal(bal.toNumber(), minDaiPayment * 4);
  });

  it('should fail on too little tokens', async () => {
    await nft.mint(alice, 4).should.be.fulfilled;
    await market.transfer(alice, base - 100, {from: alice}).should.be.rejectedWith(EVMRevert);
  });

  it('should fail on too many tokens', async () => {
    await nft.mint(alice, 4).should.be.fulfilled;
    await market.transfer(alice, base * 17, {from: alice}).should.be.rejectedWith(EVMRevert);
  });

  it('should prevent double claim with same nft', async () => {
    await nft.mint(alice, 4).should.be.fulfilled;
    // first try
    await market.transfer(alice, base, {from: alice}).should.be.fulfilled;
    // second try
    await market.transfer(alice, base, {from: alice}).should.be.rejectedWith(EVMRevert);
  });

  it('should prevent double claim with different nft within short time', async () => {
    await nft.mint(alice, 4).should.be.fulfilled;
    // first try
    await market.transfer(alice, base, {from: alice}).should.be.fulfilled;
    await nft.mint(alice, 5).should.be.fulfilled;
    // second try
    await market.transfer(alice, base, {from: alice}).should.be.rejectedWith(EVMRevert);
  });

});