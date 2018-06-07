const VestingLock = artifacts.require('./VestingLock.sol');
const Parsec = artifacts.require('./Parsec.sol');
const Controller = artifacts.require('./Controller.sol');
const { assertRevert } = require('./helpers/assertThrow')

contract('Parsec', (accounts) => {
  let parsec;
  let parsecProxy;
  let controller;
  const total = 10000000;

  beforeEach(async () => {
    parsecProxy = await Parsec.new();
    controller = await Controller.new();
    parsec = Controller.at(parsecProxy.address);
    await parsec.initialize(controller.address, 400000000);
    let result = await parsec.mint(accounts[0], total);
  });

  it('allow to lock and vest', async () => {
  	let vesting = await VestingLock.new(parsec.address, 2, 4, accounts[1]);
  	await parsec.transfer(vesting.address, total);
 
    return assertRevert(async () => {
        await vesting.withdraw({from: accounts[1]});
    });
  	await vesting.recordBasicIncome();
  	// should still fail
    return assertRevert(async () => {
        await vesting.withdraw({from: accounts[1]});
    });
  	await vesting.recordBasicIncome();

  	await vesting.withdraw({from: accounts[1]});
  	let bal = await parsec.balanceOf(accounts[1]);
  	assert(bal.mul(2).toNumber() === total);

  	await vesting.recordBasicIncome();

    return assertRevert(async () => {
        await vesting.recordBasicIncome();
    });

  	await vesting.withdraw({from: accounts[1]});
  	bal = await parsec.balanceOf(accounts[1]);
  	assert(bal.toNumber() === total);
  });
});