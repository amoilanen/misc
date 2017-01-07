# Encodes .wav files into .mp3 ones:
# - Copy the script into the root of the directory of the wav files
# - Install Lame encoder
# - Run the script

#!/bin/bash
OLD_IFS="$IFS"
IFS=$'\n'
rootDir=$(pwd)
fileNames=$(find . -type f -name "*.wav")

for fileName in $fileNames
do
  mp3FileName=$(echo "$fileName" | sed -r 's/\.\//\.\/mp3s\//g; s/\.wav$/\.mp3/g')
  echo "Encoding $fileName to $mp3FileName"
  mkdir -p $(dirname $mp3FileName)
  lame -V1 --vbr-new "$fileName" "$mp3FileName"
done
echo "DONE!"
IFS="$OLD_IFS"
