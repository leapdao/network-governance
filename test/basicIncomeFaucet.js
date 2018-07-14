import chai from 'chai';
import EVMRevert from './helpers/EVMRevert';
const BasicIncomeFaucet = artifacts.require('./BasicIncomeFaucet.sol');
const ERC721BasicToken = artifacts.require('./mocks/ERC721BasicTokenMock.sol');
const SimpleToken = artifacts.require('./mocks/SimpleToken.sol');
const { assertRevert } = require('./helpers/assertThrow')

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
    nft = await ERC721BasicToken.new().should.be.fulfilled;
    token = await SimpleToken.new().should.be.fulfilled;
    const tokensPerTaco = 750 * 100000000;
    faucet = await BasicIncomeFaucet.new(token.address, nft.address, council, tokensPerTaco).should.be.fulfilled;
    const totalSupply = await token.totalSupply();
    await token.approve(faucet.address, totalSupply, {from: council});
  });

  it('should allow to mint basic income nft and claim tokens', async () => {
    const event = await nft.mint(alice, 4).should.be.fulfilled;
    const nftId = event.logs[0].args._tokenId;
    const bal1 = await token.balanceOf(alice);
    await faucet.claim(nftId, {from: alice}).should.be.fulfilled;
    const bal2 = await token.balanceOf(alice);
    assert(bal2.toNumber() > bal1.toNumber());
  });

  it('should cap at 8 tacos', async () => {
    const event = await nft.mint(alice, 9).should.be.fulfilled;
    const nftId = event.logs[0].args._tokenId;
    await faucet.claim(nftId, {from: alice}).should.be.fulfilled;
  });

  it('should prevent to claim less than 4 tacos', async () => {
    const event = await nft.mint(alice, 3).should.be.fulfilled;
    const nftId = event.logs[0].args._tokenId;
    await faucet.claim(nftId, {from: alice}).should.be.rejectedWith(EVMRevert);
  });

  it('should prevent double claim with same nft', async () => {
    const event = await nft.mint(alice, 4).should.be.fulfilled;
    const nftId = event.logs[0].args._tokenId;
    // first try
    await faucet.claim(nftId, {from: alice}).should.be.fulfilled;
    // second try
    await faucet.claim(nftId, {from: alice}).should.be.rejectedWith(EVMRevert);
  });

  it('should prevent double claim with different nft within short time', async () => {
    let event = await nft.mint(alice, 4).should.be.fulfilled;
    const nftId = event.logs[0].args._tokenId;
    // first try
    await faucet.claim(nftId, {from: alice}).should.be.fulfilled;
    event = await nft.mint(alice, 5).should.be.fulfilled;
    const otherNftId = event.logs[0].args._tokenId;
    // second try
    await faucet.claim(otherNftId, {from: alice}).should.be.rejectedWith(EVMRevert);
  });
});