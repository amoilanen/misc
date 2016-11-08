#!/bin/bash
output_dir=html
rm -rf $output_dir && mkdir $output_dir

echo "Compiling book from sources..."
for input_file in book/*
do
  file_basename=$(basename $input_file .md)
  output_file=$output_dir/$file_basename.html
  echo "$input_file --> $output_file"
  pandoc $input_file -c pandoc.css -o $output_file
done
echo "Done!"

#TODO: Compile the chapters into a single book with an index page
#TODO: Watch directory for changes and rerun pandoc as required