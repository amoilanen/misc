add.c -> add.wat -> add.wasm

1. Convert C code for adding numbers add.c to add.wat: textual representation of WebAssembly

The following tool can be used
  https://mbebenita.github.io/WasmExplorer/

2. Convert textual representation add.wat to add.wasm: WebAssembly binary format

The following tool can be used
https://cdn.rawgit.com/WebAssembly/wabt/e0719fe0/demo/wat2wasm/

3. Launch a server in the current directory, open add.html, WebAssembly binary of the addition function should be loaded and numbers should be added

For example `php -S localhost:8080`