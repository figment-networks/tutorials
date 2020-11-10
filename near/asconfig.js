const compile = require("near-sdk-as/compiler").compile;

compile(
  "./5_contracts/contract.ts", "",
  [
    "--runPasses", "inlining-optimizing,dce",
    "--binaryFile", "5_contracts/contract.wasm",
    "--measure",
  ],
  { verbose: false }
);
