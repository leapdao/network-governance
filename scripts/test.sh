#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the ganache instance that we started (if we started one and if it's still running).
  if [ -n "$ganache_pid" ] && ps -p $ganache_pid > /dev/null; then
    kill -9 $ganache_pid
  fi
}

ganache_port=8545

ganache_running() {
  nc -z localhost "$ganache_port"
}

start_ganache() {
  # We define 10 accounts with balance 1M ether, needed for high-value tests.
  local accounts=(
    --account="0x278a5de700e29faae8e40e366ec5012b5ec63d36ec77e8a2417154cc1d25383f,990000000000000000000"
    --account="0x7bc8feb5e1ce2927480de19d8bc1dc6874678c016ae53a2eec6a6e9df717bfac,1000000000000000000000000"
    --account="0x94890218f2b0d04296f30aeafd13655eba4c5bbf1770273276fee52cbe3f2cb4,1000000000000000000000000"
    --account="0x0d4f4fa0c73b20d7c8b7d06caa4673ea15c930cf4d836a9caa014a6654b97ff3,1000000000000000000000000"
    --account="0x337c2aa0b91d56a19c45dec616beb43f99963127f143e20f955540f3bd5a9f9a,1000000000000000000000000"
    --account="0xdd79d63a0cef61d848c90e4292b74716ca991c2ce0ec4ffa651366d7e67160e9,1000000000000000000000000"
    --account="0x75a903a6fd9ffdb822db62ae8e8493ba6e59e5424defb02f850b5be5202a5bcb,1000000000000000000000000"
  )

  node_modules/.bin/ganache-cli --gasLimit 9000000 "${accounts[@]}" > /dev/null &

  ganache_pid=$!
}

if ganache_running; then
  echo "Using existing ganache instance"
else
  echo "Starting our own ganache instance"
  start_ganache
fi

truffle version

node_modules/.bin/truffle test "$@"
