package main

import (
    "fmt"
    "io/ioutil"
    "log"
    "os"
)

type File struct {
  name string
}

type Directory struct {
  name string
  files []File
}

func (dir Directory) list() {
  fmt.Println(dir.name)
  for _, file := range dir.files {
    fmt.Println(file.name)
  }
}

func main() {
    dirName := "../"
    dirFiles, err := ioutil.ReadDir(dirName)
    if err != nil {
        log.Fatal(err)
    }

    files := make([]File, 1)
    for _, f := range dirFiles {
      if stat, err := os.Stat(f.Name()); err == nil && stat.IsDir() {
        //files = append(files, Directory{ name: f.Name(), files = make([]File) })
      } else {
        files = append(files, File{ name: f.Name() })
      }
    }
    dir := Directory { name: dirName, files: files }
    dir.list()
}