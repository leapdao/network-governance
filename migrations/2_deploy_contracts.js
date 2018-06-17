const Parsec = artifacts.require('./Parsec.sol');
const Controller = artifacts.require('./Controller.sol');

module.exports = async function(deployer) {
  // deploy proxy
  await deployer.deploy(Parsec);
  const parsecProxy = await Parsec.deployed();
  // deploy controller
  await deployer.deploy(Controller);
  const controller = await Controller.deployed();
  // create binding of proxy with controller interface
  let parsec = Controller.at(parsecProxy.address);
  // use binding
  await parsec.initialize(controller.address, 400000000);
  // check result
  let cap = await parsec.cap();
  console.log(cap.toNumber());
};
