package main

//TODO: Run tree on a file, not a directory
//TODO: Run tree on directory
//TODO: Command line arguments, help, like in the tree command

import (
    "fmt"
    "io/ioutil"
    "log"
    "os"
    "path"
    "strings"
)

type File struct {
  name string
  path string
  files []File
}

func (file File) Show(offset int) {
  fmt.Println(strings.Repeat(" ", offset) + file.name)
  for _, file := range file.files {
    file.Show(offset + 1)
  }
}

func ReadDirectory(dirPath string) File {
    childFiles, err := ioutil.ReadDir(dirPath)
    if err != nil {
        log.Fatal(err)
    }

    files := make([]File, 1)
    for _, f := range childFiles {
        filePath := dirPath + "/" + f.Name()
        if stat, err := os.Stat(filePath); err == nil && stat.IsDir() {
            files = append(files, ReadDirectory(filePath))
        } else {
            files = append(files, File{ name: f.Name(), path: filePath })
        }
    }
    return File { name: path.Base(dirPath), path: dirPath, files: files }
}

func main() {
    dirName := "../Python"
    dir := ReadDirectory(dirName)
    dir.Show(0)
}