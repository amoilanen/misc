#!/bin/bash

# Create binary test file with random data
dd if=/dev/urandom of=sample.bin bs=1K count=1

# Create large text file by repeating Lorem ipsum content
for i in {1..100}; do
    cat large.txt >> large.txt.tmp
done
mv large.txt.tmp large.txt

echo "Test files generated successfully:"
echo "- sample.txt (text file)"
echo "- sample.bin (1KB random binary file)"
echo "- large.txt (large text file)" 