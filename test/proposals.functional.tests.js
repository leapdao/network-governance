var BridgeTestable= artifacts.require("./BridgeTestable");
var ProposalsContract = artifacts.require("./ProposalsContract");
var PreserveBalancesOnTransferToken = artifacts.require("./PreserveBalancesOnTransferToken");
var util = require('ethereumjs-util');
const time = require('./helpers/time');

require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(web3.BigNumber))
	.should();

contract('ProposalsContract', (accounts) => {
	const creator = accounts[0];
	const u1 = accounts[1];
	const u2 = accounts[2];
	const u3 = accounts[3];
	const u4 = accounts[4];
	const u5 = accounts[5];

	var bridgeTestable;
	var proposalsContract;
	var preserveBalancesOnTransferToken;

	describe('Positive scenario I', function(){
		it('Should update params',async() => {
			preserveBalancesOnTransferToken = await PreserveBalancesOnTransferToken.new();

			await preserveBalancesOnTransferToken.mint(u1, 1e18);
			await preserveBalancesOnTransferToken.mint(u2, 1e18);
			await preserveBalancesOnTransferToken.mint(u3, 1e18);
			await preserveBalancesOnTransferToken.mint(u4, 1e18);			

			bridgeTestable = await BridgeTestable.new();
			proposalsContract = await ProposalsContract.new(preserveBalancesOnTransferToken.address, creator);

			await preserveBalancesOnTransferToken.transferOwnership(proposalsContract.address);
			await bridgeTestable.transferOwnership(proposalsContract.address);
			await time.increase(time.duration.days(1));

			const data = await bridgeTestable.contract.setEpochLength.getData(500);
			await proposalsContract.propose(bridgeTestable.address, data);
			
			var EL1 = await bridgeTestable.epochLength();
			assert.equal(EL1.toNumber(), 0);

			await time.increase(time.duration.days(14));
			await proposalsContract.finalize(0);
			var EL2 = await bridgeTestable.epochLength();
			assert.equal(EL2.toNumber(), 500);
		});
	});
});
