var BridgeTestable= artifacts.require("./BridgeTestable");
var ProposalsContract = artifacts.require("./ProposalsContract");
var PreserveBalancesOnTransferToken = artifacts.require("./PreserveBalancesOnTransferToken");

require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(web3.BigNumber))
	.should();

contract('ProposalsContract unit tests', (accounts) => {
	const creator = accounts[0];
	const u1 = accounts[1];
	const u2 = accounts[2];
	const u3 = accounts[3];
	const u4 = accounts[4];
	const u5 = accounts[5];
	const outsider = accounts[6];

	var bridgeTestable;
	var proposalsContract;
	var preserveBalancesOnTransferToken;

	var EXIT_STAKE = 0;
	var EPOCH_LENGTH = 1;	

	var stats;
	var votingType;
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
			bridgeTestable = await BridgeTestable.new();
			proposalsContract = await ProposalsContract.new(bridgeTestable.address, preserveBalancesOnTransferToken.address, creator);
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
			proposalsContract = await ProposalsContract.new(bridgeTestable.address, preserveBalancesOnTransferToken.address, creator);
			await preserveBalancesOnTransferToken.transferOwnership(proposalsContract.address);
			await bridgeTestable.transferOwnership(proposalsContract.address);			
		});

		it('Should assert.equal epochLength as 0',async() => {
			var EL1 = await bridgeTestable.epochLength();
			assert.equal(EL1.toNumber(), 0);			
		});

		it('Should create voting for setEpochLength',async() => {
			await proposalsContract.setEpochLength(500);
		});

		it('Should not create voting for setEpochLength by outsider',async() => {
			await proposalsContract.setEpochLength(500, {from:outsider}).should.be.rejectedWith('revert');
		});		

		it('Should assert equal epochLength as 0 after voting creation',async() => {
			await proposalsContract.setEpochLength(500);
			var EL1 = await bridgeTestable.epochLength();
			assert.equal(EL1.toNumber(), 0);
		});		

		it('Should vote true for EpochLength',async() => {
			await proposalsContract.setEpochLength(500);
			await proposalsContract.vote(0, true, {from:u1});
		});

		it('Should vote false for EpochLength',async() => {
			await proposalsContract.setEpochLength(500);
			await proposalsContract.vote(0, false, {from:u1});
		});

		it('Should not vote if no voting',async() => {
			await proposalsContract.vote(0, false, {from:u1}).should.be.rejectedWith('revert');
		});

		it('Should not vote if wrong id',async() => {
			await proposalsContract.setEpochLength(500);
			await proposalsContract.vote(1, true, {from:u1}).should.be.rejectedWith('revert');
		});

		it('Should not vote if voter have no tokens',async() => {
			await proposalsContract.setEpochLength(500);
			await proposalsContract.vote(0, true, {from:outsider}).should.be.rejectedWith('revert');
		});		

		it('Should create two differnt votings',async() => {
			await proposalsContract.setEpochLength(500);
			await proposalsContract.setEpochLength(700);
			await proposalsContract.vote(0, true, {from:u1});
		});

		it('Should create two differnt votings + can vote',async() => {
			await proposalsContract.setEpochLength(500);
			await proposalsContract.setEpochLength(700);
			await proposalsContract.vote(0, true, {from:u1});
			await proposalsContract.vote(1, true, {from:u1});
		});

		it('Should not change epochLength if quorum is not reached',async() => {
			await proposalsContract.setEpochLength(500);
			await proposalsContract.vote(0, true, {from:u1});
			await proposalsContract.vote(0, true, {from:u2});
			await proposalsContract.vote(0, true, {from:u3});
			var EL2 = await bridgeTestable.epochLength();
			assert.equal(EL2.toNumber(), 0);
		});

		it('Should not change epochLength if consensus is not reached',async() => {
			await proposalsContract.setEpochLength(500);
			await proposalsContract.vote(0, true, {from:u1});
			await proposalsContract.vote(0, true, {from:u2});
			await proposalsContract.vote(0, true, {from:u3});
			await proposalsContract.vote(0, false, {from:u4});
			var EL2 = await bridgeTestable.epochLength();
			assert.equal(EL2.toNumber(), 0);
		});

		it('Should change epochLength',async() => {
			await proposalsContract.setEpochLength(500);
			await proposalsContract.vote(0, true, {from:u1});
			await proposalsContract.vote(0, true, {from:u2});
			await proposalsContract.vote(0, true, {from:u3});
			await proposalsContract.vote(0, true, {from:u4})
			var EL2 = await bridgeTestable.epochLength();
			assert.equal(EL2.toNumber(), 500);
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
			proposalsContract = await ProposalsContract.new(bridgeTestable.address, preserveBalancesOnTransferToken.address, creator);
			await preserveBalancesOnTransferToken.transferOwnership(proposalsContract.address);
			await bridgeTestable.transferOwnership(proposalsContract.address);
		});

		it('Should assert.equal exitStake as 0',async() => {
			var EL1 = await bridgeTestable.exitStake();
			assert.equal(EL1.toNumber(), 0);			
		});

		it('Should create voting for setExitStake',async() => {
			await proposalsContract.setExitStake(1e15);
		});

		it('Should not create voting for setExitStake by outsider',async() => {
			await proposalsContract.setExitStake(1e15, {from:outsider}).should.be.rejectedWith('revert');
		});		

		it('Should assert equal exitStake as 0 after voting creation',async() => {
			await proposalsContract.setExitStake(1e15);
			var EL1 = await bridgeTestable.exitStake();
			assert.equal(EL1.toNumber(), 0);
		});		

		it('Should vote true for ExitStake',async() => {
			await proposalsContract.setExitStake(1e15);
			await proposalsContract.vote(0, true, {from:u1});
		});

		it('Should vote false for ExitStake',async() => {
			await proposalsContract.setExitStake(1e15);
			await proposalsContract.vote(0, false, {from:u1});
		});

		it('Should not vote if no voting',async() => {
			await proposalsContract.vote(0, false, {from:u1}).should.be.rejectedWith('revert');
		});

		it('Should not vote if wrong id',async() => {
			await proposalsContract.setExitStake(1e15);
			await proposalsContract.vote(1, true, {from:u1}).should.be.rejectedWith('revert');
		});

		it('Should not vote if voter have no tokens',async() => {
			await proposalsContract.setExitStake(1e15);
			await proposalsContract.vote(0, true, {from:outsider}).should.be.rejectedWith('revert');
		});		

		it('Should create two differnt votings',async() => {
			await proposalsContract.setExitStake(1e15);
			await proposalsContract.setExitStake(700);
			await proposalsContract.vote(0, true, {from:u1});
		});

		it('Should create two differnt votings + can vote',async() => {
			await proposalsContract.setExitStake(1e15);
			await proposalsContract.setExitStake(700);
			await proposalsContract.vote(0, true, {from:u1});
			await proposalsContract.vote(1, true, {from:u1});
		});

		it('Should not change exitStake if quorum is not reached',async() => {
			await proposalsContract.setExitStake(1e15);
			await proposalsContract.vote(0, true, {from:u1});
			await proposalsContract.vote(0, true, {from:u2});
			await proposalsContract.vote(0, true, {from:u3});
			var EL2 = await bridgeTestable.exitStake();
			assert.equal(EL2.toNumber(), 0);
		});

		it('Should not change exitStake if consensus is not reached',async() => {
			await proposalsContract.setExitStake(1e15);
			await proposalsContract.vote(0, true, {from:u1});
			await proposalsContract.vote(0, true, {from:u2});
			await proposalsContract.vote(0, true, {from:u3});
			await proposalsContract.vote(0, false, {from:u4});
			var EL2 = await bridgeTestable.exitStake();
			assert.equal(EL2.toNumber(), 0);
		});

		it('Should change exitStake',async() => {
			await proposalsContract.setExitStake(1e15);
			await proposalsContract.vote(0, true, {from:u1});
			await proposalsContract.vote(0, true, {from:u2});
			await proposalsContract.vote(0, true, {from:u3});
			await proposalsContract.vote(0, true, {from:u4});
			var EL2 = await bridgeTestable.exitStake();
			assert.equal(EL2.toNumber(), 1e15);
		});
	});

	describe('getVotingsCount calls', function(){
		beforeEach(async () => {
			preserveBalancesOnTransferToken = await PreserveBalancesOnTransferToken.new();

			await preserveBalancesOnTransferToken.mint(u1, 1e18);
			await preserveBalancesOnTransferToken.mint(u2, 1e18);
			await preserveBalancesOnTransferToken.mint(u3, 1e18);
			await preserveBalancesOnTransferToken.mint(u4, 1e18);
			await preserveBalancesOnTransferToken.mint(u5, 1e18);
			
			bridgeTestable = await BridgeTestable.new();
			proposalsContract = await ProposalsContract.new(bridgeTestable.address, preserveBalancesOnTransferToken.address, creator);
			await preserveBalancesOnTransferToken.transferOwnership(proposalsContract.address);
			await bridgeTestable.transferOwnership(proposalsContract.address);
		});
		

		it('Should return 0 if no votings',async() => {
			var count = await proposalsContract.getVotingsCount();
			assert.equal(count.toNumber(), 0);
		});

		it('Should return 1 if one voting',async() => {
			await proposalsContract.setExitStake(1e15);
			var count = await proposalsContract.getVotingsCount();
			assert.equal(count.toNumber(), 1);
		});

		it('Should return 2 if two votings',async() => {
			await proposalsContract.setExitStake(1e15);
			await proposalsContract.setExitStake(1e16);
			var count = await proposalsContract.getVotingsCount();
			assert.equal(count.toNumber(), 2);			
		});
	});

	describe('getVotingStats calls: general', function(){
		beforeEach(async () => {
			preserveBalancesOnTransferToken = await PreserveBalancesOnTransferToken.new();

			await preserveBalancesOnTransferToken.mint(u1, 1e18);
			await preserveBalancesOnTransferToken.mint(u2, 1e18);
			await preserveBalancesOnTransferToken.mint(u3, 1e18);
			await preserveBalancesOnTransferToken.mint(u4, 1e18);
			
			bridgeTestable = await BridgeTestable.new();
			proposalsContract = await ProposalsContract.new(bridgeTestable.address, preserveBalancesOnTransferToken.address, creator);
			await preserveBalancesOnTransferToken.transferOwnership(proposalsContract.address);
			await bridgeTestable.transferOwnership(proposalsContract.address);
		});

		it('Should revert if no votings',async() => {
			var stats = await proposalsContract.getVotingStats(0).should.be.rejectedWith('revert');
		});

		it('Should get votingStats',async() => {
			await proposalsContract.setExitStake(1e15);
			var stats = await proposalsContract.getVotingStats(0).should.be.fulfilled;
		});

		it('Should revert if no voting with this id',async() => {
			await proposalsContract.setExitStake(1e15);
			var stats = await proposalsContract.getVotingStats(1).should.be.rejectedWith('revert');
		});		

		it('Should get votingStats',async() => {
			await proposalsContract.setExitStake(1e15);
			await proposalsContract.setExitStake(2e15);
			var stats = await proposalsContract.getVotingStats(1).should.be.fulfilled;
		});				
	});

	describe('getVotingStats calls: general', function(){
		beforeEach(async () => {
			preserveBalancesOnTransferToken = await PreserveBalancesOnTransferToken.new();

			await preserveBalancesOnTransferToken.mint(u1, 1e18);
			await preserveBalancesOnTransferToken.mint(u2, 1e18);
			await preserveBalancesOnTransferToken.mint(u3, 1e18);
			await preserveBalancesOnTransferToken.mint(u4, 1e18);
			
			bridgeTestable = await BridgeTestable.new();
			proposalsContract = await ProposalsContract.new(bridgeTestable.address, preserveBalancesOnTransferToken.address, creator);
			await preserveBalancesOnTransferToken.transferOwnership(proposalsContract.address);
			await bridgeTestable.transferOwnership(proposalsContract.address);
		});

		it('Should get votingStats params',async() => {
			await proposalsContract.setExitStake(1e15);
			stats = await proposalsContract.getVotingStats(0);
			votingType = stats[0].toNumber();
			paramValue = stats[1].toNumber();
			pro = stats[2].toNumber();
			versus = stats[3].toNumber();
			isFinished = stats[4];
			isResultYes = stats[5];

			assert.equal(votingType, EXIT_STAKE);
			assert.equal(paramValue, 1e15);
			assert.equal(pro, 0);
			assert.equal(versus, 0);
			assert.equal(isFinished, false);
			assert.equal(isResultYes, false);
		});

		it('Should get votingStats params',async() => {
			await proposalsContract.setExitStake(1e15);
			stats = await proposalsContract.getVotingStats(0);
			votingType = stats[0].toNumber();
			paramValue = stats[1].toNumber();
			pro = stats[2].toNumber();
			versus = stats[3].toNumber();
			isFinished = stats[4];
			isResultYes = stats[5];

			assert.equal(votingType, EXIT_STAKE);
			assert.equal(paramValue, 1e15);
			assert.equal(pro, 0);
			assert.equal(versus, 0);
			assert.equal(isFinished, false);
			assert.equal(isResultYes, false);
		});

		it('Should get correct pro and isResultYes amount',async() => {
			await proposalsContract.setExitStake(1e15);		
			await proposalsContract.vote(0, true, {from:u1});

			stats = await proposalsContract.getVotingStats(0);
			votingType = stats[0].toNumber();
			paramValue = stats[1].toNumber();
			pro = stats[2].toNumber();
			versus = stats[3].toNumber();
			isFinished = stats[4];
			isResultYes = stats[5];

			assert.equal(votingType, EXIT_STAKE);
			assert.equal(paramValue, 1e15);
			assert.equal(pro, 1e18);
			assert.equal(versus, 0);
			assert.equal(isFinished, false);
			assert.equal(isResultYes, true);
		});

		it('Should get correct versus amount',async() => {
			await proposalsContract.setExitStake(1e15);
			await proposalsContract.vote(0, false, {from:u1});
		
			stats = await proposalsContract.getVotingStats(0);
			votingType = stats[0].toNumber();
			paramValue = stats[1].toNumber();
			pro = stats[2].toNumber();
			versus = stats[3].toNumber();
			isFinished = stats[4];
			isResultYes = stats[5];

			assert.equal(votingType, EXIT_STAKE);
			assert.equal(paramValue, 1e15);
			assert.equal(pro, 0);
			assert.equal(versus, 1e18);
			assert.equal(isFinished, false);
			assert.equal(isResultYes, false);
		});

		it('Should get correct isFinished amount when all true',async() => {
			await proposalsContract.setExitStake(1e15);
			
			await proposalsContract.vote(0, true, {from:u1});
			await proposalsContract.vote(0, true, {from:u2});
			await proposalsContract.vote(0, true, {from:u3});
			await proposalsContract.vote(0, true, {from:u4});

			stats = await proposalsContract.getVotingStats(0);
			votingType = stats[0].toNumber();
			paramValue = stats[1].toNumber();
			pro = stats[2].toNumber();
			versus = stats[3].toNumber();
			isFinished = stats[4];
			isResultYes = stats[5];

			assert.equal(votingType, EXIT_STAKE);
			assert.equal(paramValue, 1e15);
			assert.equal(pro, 4e18);
			assert.equal(versus, 0);
			assert.equal(isFinished, true);
			assert.equal(isResultYes, true);
		});

		it('Should get correct isFinished amount when not all true',async() => {
			await proposalsContract.setExitStake(1e15);

			await proposalsContract.vote(0, true, {from:u1});
			await proposalsContract.vote(0, true, {from:u2});
			await proposalsContract.vote(0, true, {from:u3});
			await proposalsContract.vote(0, false, {from:u4});

			stats = await proposalsContract.getVotingStats(0);
			votingType = stats[0].toNumber();
			paramValue = stats[1].toNumber();
			pro = stats[2].toNumber();
			versus = stats[3].toNumber();
			isFinished = stats[4];
			isResultYes = stats[5];

			assert.equal(votingType, EXIT_STAKE);
			assert.equal(paramValue, 1e15);
			assert.equal(pro, 3e18);
			assert.equal(versus, 1e18);
			assert.equal(isFinished, true);
			assert.equal(isResultYes, false);
		});
	});

	// TODO: check differtent tokenHolders count
	// TODO: chck revert if already finished
});
