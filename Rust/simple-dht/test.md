cargo run -- 4000
cargo run -- 4001 127.0.0.1:4000

nc 127.0.0.1 4001
STORE hello world
FIND hello