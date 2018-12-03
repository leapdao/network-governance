var BridgeTestable= artifacts.require("./BridgeTestable");
var ProposalsContract = artifacts.require("./ProposalsContract");
var PreserveBalancesOnTransferToken = artifacts.require("./PreserveBalancesOnTransferToken");
const time = require('./helpers/time');

require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(web3.BigNumber))
	.should();

contract('ProposalsContract unit tests', (accounts) => {
	var creator = accounts[0];
	var u1 = accounts[1];
	var u2 = accounts[2];
	var u3 = accounts[3];
	var u4 = accounts[4];
	var u5 = accounts[5];
	var outsider = accounts[6];

	var bridgeTestable;
	var proposalsContract;
	var preserveBalancesOnTransferToken;

	var EXIT_STAKE = 0;
	var EPOCH_LENGTH = 1;	

	var stats;
	var proposalType;
	var paramValue;
	var pro;
	var versus;
	var isFinished;
	var isResultYes;	

	describe('Contract creations', function(){
		it('Should create PreserveBalancesOnTransferToken',async() => {
			preserveBalancesOnTransferToken = await PreserveBalancesOnTransferToken.new();
		});

		it('Should mint PreserveBalancesOnTransferToken',async() => {
			preserveBalancesOnTransferToken = await PreserveBalancesOnTransferToken.new();
			await preserveBalancesOnTransferToken.mint(u1, 1e18);
		});

		it('Should create BridgeTestable',async() => {		
			bridgeTestable = await BridgeTestable.new();
		});

		it('Should create ProposalsContract',async() => {
			preserveBalancesOnTransferToken = await PreserveBalancesOnTransferToken.new();
			proposalsContract = await ProposalsContract.new(preserveBalancesOnTransferToken.address, creator);
		});
	});

	describe('ExitStake calls', function(){
		beforeEach(async () => {
			preserveBalancesOnTransferToken = await PreserveBalancesOnTransferToken.new();

			await preserveBalancesOnTransferToken.mint(u1, 1e18);
			await preserveBalancesOnTransferToken.mint(u2, 1e18);
			await preserveBalancesOnTransferToken.mint(u3, 1e18);
			await preserveBalancesOnTransferToken.mint(u4, 1e18);
			
			bridgeTestable = await BridgeTestable.new();
			proposalsContract = await ProposalsContract.new(preserveBalancesOnTransferToken.address, creator);
			await preserveBalancesOnTransferToken.transferOwnership(proposalsContract.address);
			await bridgeTestable.transferOwnership(proposalsContract.address);
		});

		it('Should assert.equal exitStake as 0',async() => {
			var EL1 = await bridgeTestable.exitStake();
			assert.equal(EL1.toNumber(), 0);			
		});

		it('Should create proposal for setExitStake',async() => {
			var data = await bridgeTestable.contract.setExitStake.getData(1e15);
			await proposalsContract.propose(bridgeTestable.address, data);
		});

		it('Should not create proposal for setExitStake by outsider',async() => {
			var data = await bridgeTestable.contract.setExitStake.getData(1e15);
			await proposalsContract.propose(bridgeTestable.address, data, {from:outsider}).should.be.rejectedWith('revert');
		});		

		it('Should assert equal exitStake as 0 after proposal creation',async() => {
			var data = await bridgeTestable.contract.setExitStake.getData(1e15);
			await proposalsContract.propose(bridgeTestable.address, data);
			var EL1 = await bridgeTestable.exitStake();
			assert.equal(EL1.toNumber(), 0);
		});		

		it('Should vote true for ExitStake',async() => {
			var data = await bridgeTestable.contract.setExitStake.getData(1e15);
			await proposalsContract.propose(bridgeTestable.address, data);
			await proposalsContract.veto(0,{from:u1});
		});

		it('Should not vote if no proposal',async() => {
			await proposalsContract.veto(0, {from:u1}).should.be.rejectedWith('revert');
		});

		it('Should not vote if wrong id',async() => {
			var data = await bridgeTestable.contract.setExitStake.getData(1e15);
			await proposalsContract.propose(bridgeTestable.address, data);
			await proposalsContract.veto(1, {from:u1}).should.be.rejectedWith('revert');
		});

		it('Should not vote if voter have no tokens',async() => {
			var data = await bridgeTestable.contract.setExitStake.getData(1e15);
			await proposalsContract.propose(bridgeTestable.address, data);
			await proposalsContract.veto(0, {from:outsider}).should.be.rejectedWith('revert');
		});		

		it('Should create two differnt proposals',async() => {
			var data = await bridgeTestable.contract.setExitStake.getData(1e15);
			await proposalsContract.propose(bridgeTestable.address, data);
			var data = await bridgeTestable.contract.setExitStake.getData(2e15);
			await proposalsContract.propose(bridgeTestable.address, data);
			await proposalsContract.veto(0, {from:u1});
		});

		it('Should create two differnt proposals + can vote',async() => {
			var data = await bridgeTestable.contract.setExitStake.getData(1e15);
			await proposalsContract.propose(bridgeTestable.address, data);
			var data = await bridgeTestable.contract.setExitStake.getData(2e15);
			await proposalsContract.propose(bridgeTestable.address, data);
			await proposalsContract.veto(0, {from:u1});
			await proposalsContract.veto(1, {from:u1});
		});

		it('Should change exitStake even if 1 veto (20%)',async() => {
			var data = await bridgeTestable.contract.setExitStake.getData(2e15);
			await proposalsContract.propose(bridgeTestable.address, data);
			await proposalsContract.veto(0, {from:u1});
			await time.increase(time.duration.days(14));
			await proposalsContract.finalize(0);
			var EL2 = await bridgeTestable.exitStake();
			assert.equal(EL2.toNumber(), 2e15);
		});

		it('Should not change exitStake if consensus is not reached',async() => {
			var data = await bridgeTestable.contract.setExitStake.getData(1e15);
			await proposalsContract.propose(bridgeTestable.address, data);
			await proposalsContract.veto(0, {from:u1});
			await proposalsContract.veto(0, {from:u2});
			await time.increase(time.duration.days(14));
			var EL2 = await bridgeTestable.exitStake();
			assert.equal(EL2.toNumber(), 0);
		});

		it('Should change exitStake',async() => {
			var data = await bridgeTestable.contract.setExitStake.getData(1e15);
			await proposalsContract.propose(bridgeTestable.address, data);
			await time.increase(time.duration.days(14));
			await proposalsContract.finalize(0);
			var EL2 = await bridgeTestable.exitStake();
			assert.equal(EL2.toNumber(), 1e15);
		});
	});

	describe('EpochLength calls', function(){
		beforeEach(async () => {
			preserveBalancesOnTransferToken = await PreserveBalancesOnTransferToken.new();

			await preserveBalancesOnTransferToken.mint(u1, 1e18);
			await preserveBalancesOnTransferToken.mint(u2, 1e18);
			await preserveBalancesOnTransferToken.mint(u3, 1e18);
			await preserveBalancesOnTransferToken.mint(u4, 1e18);
			
			bridgeTestable = await BridgeTestable.new();
			proposalsContract = await ProposalsContract.new(preserveBalancesOnTransferToken.address, creator);
			await preserveBalancesOnTransferToken.transferOwnership(proposalsContract.address);
			await bridgeTestable.transferOwnership(proposalsContract.address);			
		});

		it('Should assert.equal epochLength as 0',async() => {
			var EL1 = await bridgeTestable.epochLength();
			assert.equal(EL1.toNumber(), 0);			
		});

		it('Should create proposal for setEpochLength',async() => {
			var data = await bridgeTestable.contract.setEpochLength.getData(500);
			await proposalsContract.propose(bridgeTestable.address, data);
		});

		it('Should not create proposal for setEpochLength by outsider',async() => {
			var data = await bridgeTestable.contract.setEpochLength.getData(500);
			await proposalsContract.propose(bridgeTestable.address, data, {from:outsider}).should.be.rejectedWith('revert');
		});		

		it('Should assert equal epochLength as 0 after proposal creation',async() => {
			var data = await bridgeTestable.contract.setEpochLength.getData(500);
			await proposalsContract.propose(bridgeTestable.address, data);
			var EL1 = await bridgeTestable.epochLength();
			assert.equal(EL1.toNumber(), 0);
		});		

		it('Should vote true for EpochLength',async() => {
			var data = await bridgeTestable.contract.setEpochLength.getData(500);
			await proposalsContract.propose(bridgeTestable.address, data);
			await proposalsContract.veto(0,{from:u1});
		});

		it('Should not vote if no proposal',async() => {
			await proposalsContract.veto(0, {from:u1}).should.be.rejectedWith('revert');
		});

		it('Should not vote if wrong id',async() => {
			var data = await bridgeTestable.contract.setEpochLength.getData(500);
			await proposalsContract.propose(bridgeTestable.address, data);
			await proposalsContract.veto(1, {from:u1}).should.be.rejectedWith('revert');
		});

		it('Should not veto if voter have no tokens',async() => {
			var data = await bridgeTestable.contract.setEpochLength.getData(500);
			await proposalsContract.propose(bridgeTestable.address, data);
			await proposalsContract.veto(0, {from:outsider}).should.be.rejectedWith('revert');
		});		

		it('Should create two differnt proposals + can veto',async() => {
			var data = await bridgeTestable.contract.setEpochLength.getData(500);
			await proposalsContract.propose(bridgeTestable.address, data);
			var data = await bridgeTestable.contract.setEpochLength.getData(700);
			await proposalsContract.propose(bridgeTestable.address, data);
			await proposalsContract.veto(0, {from:u1});
			await proposalsContract.veto(1, {from:u1});
		});

		it('Should not change epochLength if vetoed',async() => {
			var data = await bridgeTestable.contract.setEpochLength.getData(700);
			await proposalsContract.propose(bridgeTestable.address, data);
			await proposalsContract.veto(0, {from:u1});
			await proposalsContract.veto(0, {from:u2});
			await time.increase(time.duration.days(14));
			var EL2 = await bridgeTestable.epochLength();
			assert.equal(EL2.toNumber(), 0);
		});

		it('Should change epochLength',async() => {
			var data = await bridgeTestable.contract.setEpochLength.getData(500);
			await proposalsContract.propose(bridgeTestable.address, data);
			await time.increase(time.duration.days(14));
			await proposalsContract.finalize(0);
			var EL2 = await bridgeTestable.epochLength();
			assert.equal(EL2.toNumber(), 500);
		});
	});

	describe('getProposalsCount calls', function(){
		beforeEach(async () => {
			preserveBalancesOnTransferToken = await PreserveBalancesOnTransferToken.new();

			await preserveBalancesOnTransferToken.mint(u1, 1e18);
			await preserveBalancesOnTransferToken.mint(u2, 1e18);
			await preserveBalancesOnTransferToken.mint(u3, 1e18);
			await preserveBalancesOnTransferToken.mint(u4, 1e18);
			await preserveBalancesOnTransferToken.mint(u5, 1e18);
			
			bridgeTestable = await BridgeTestable.new();
			proposalsContract = await ProposalsContract.new(preserveBalancesOnTransferToken.address, creator);
			await preserveBalancesOnTransferToken.transferOwnership(proposalsContract.address);
			await bridgeTestable.transferOwnership(proposalsContract.address);
		});
		

		it('Should return 0 if no proposals',async() => {
			var count = await proposalsContract.getProposalsCount();
			assert.equal(count.toNumber(), 0);
		});

		it('Should return 1 if one proposal',async() => {
			var data = await bridgeTestable.contract.setExitStake.getData(1e15);
			await proposalsContract.propose(bridgeTestable.address, data);
			var count = await proposalsContract.getProposalsCount();
			assert.equal(count.toNumber(), 1);
		});

		it('Should return 2 if two proposals',async() => {
			var data = await bridgeTestable.contract.setExitStake.getData(1e15);
			await proposalsContract.propose(bridgeTestable.address, data);
			var data = await bridgeTestable.contract.setExitStake.getData(1e15);
			await proposalsContract.propose(bridgeTestable.address, data);
			var count = await proposalsContract.getProposalsCount();
			assert.equal(count.toNumber(), 2);			
		});
	});

	describe('getProposalStats calls: general', function(){
		beforeEach(async () => {
			preserveBalancesOnTransferToken = await PreserveBalancesOnTransferToken.new();

			await preserveBalancesOnTransferToken.mint(u1, 1e18);
			await preserveBalancesOnTransferToken.mint(u2, 1e18);
			await preserveBalancesOnTransferToken.mint(u3, 1e18);
			await preserveBalancesOnTransferToken.mint(u4, 1e18);
			
			bridgeTestable = await BridgeTestable.new();
			proposalsContract = await ProposalsContract.new(preserveBalancesOnTransferToken.address, creator);
			await preserveBalancesOnTransferToken.transferOwnership(proposalsContract.address);
			await bridgeTestable.transferOwnership(proposalsContract.address);
		});

		it('Should revert if no proposals',async() => {
			var stats = await proposalsContract.getProposalStats(0).should.be.rejectedWith('revert');
		});

		it('Should get proposalStats',async() => {
			var data = await bridgeTestable.contract.setExitStake.getData(1e15);
			await proposalsContract.propose(bridgeTestable.address, data);
			var stats = await proposalsContract.getProposalStats(0).should.be.fulfilled;
		});

		it('Should revert if no proposal with this id',async() => {
			var data = await bridgeTestable.contract.setExitStake.getData(1e15);
			await proposalsContract.propose(bridgeTestable.address, data);
			var stats = await proposalsContract.getProposalStats(1).should.be.rejectedWith('revert');
		});		

		it('Should get proposalStats',async() => {
			var data = await bridgeTestable.contract.setExitStake.getData(1e15);
			await proposalsContract.propose(bridgeTestable.address, data);
			var data = await bridgeTestable.contract.setExitStake.getData(1e15);
			await proposalsContract.propose(bridgeTestable.address, data);
			var stats = await proposalsContract.getProposalStats(1).should.be.fulfilled;
		});				
	});
	// TODO: check differtent tokenHolders count
	// TODO: chck revert if already finished
});
