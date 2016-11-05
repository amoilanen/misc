#Cleans up accidentally added Ubuntu repositories from the Debian's repository list
#!/bin/bash
sourcesDir=/etc/apt/sources.list.d
fileNames=$(ls $sourcesDir)
for fileName in $fileNames
do
  fullFilePath=$sourcesDir/$fileName
  fileSourcesList=$(cat $fullFilePath)
  if [[ "$fileSourcesList" =~ "ubuntu" ]]
  then
    echo "$fullFilePath contains Ubuntu repositories, will be removed"
    rm -f $fullFilePath
  else
    echo "$fullFilePath does not contain Ubuntu repositories"
  fi
done
echo "DONE!"