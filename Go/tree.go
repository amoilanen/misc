package main

//TODO: Print overall statistics at the end of the listing
//TODO: Run tree on a file, not a directory
//TODO: Run tree on directory
//TODO: Command line arguments, help, like in the tree command

import (
    "fmt"
    "io/ioutil"
    "log"
    "os"
    "path"
    "sort"
)

type Files []File
type File struct {
  name string
  path string
  isDir bool
  files Files
}

func (files Files) Len() int {
    return len(files)
}

func (files Files) Swap(i, j int) {
    files[i], files[j] = files[j], files[i]
}
func (files Files) Less(i, j int) bool {
    return files[i].name < files[j].name
}

func (file File) PrintTree() {
    fmt.Println(".")
    file.PrintLevel("", 0)
    fmt.Println()
}

func (file File) PrintLevel(prefix string, treeLevel int) {
  totalFiles := len(file.files)

  sort.Sort(file.files)
  for idx, file := range file.files {
    var filePrefix string
    if (idx < totalFiles - 1) {
      fmt.Println(prefix + "├── " + file.name)
      filePrefix = prefix + "│   "
    } else {
      fmt.Println(prefix + "└── " + file.name)
      filePrefix = prefix + "    "
    }
    file.PrintLevel(filePrefix, treeLevel + 1)
  }
}

func ReadDirectory(dirPath string) File {
    childFiles, err := ioutil.ReadDir(dirPath)
    if err != nil {
        log.Fatal(err)
    }

    var isDir bool
    files := make([]File, 0)
    for _, f := range childFiles {
        filePath := dirPath + "/" + f.Name()
        stat, _ := os.Stat(filePath);
        isDir = stat.IsDir()
        if (isDir) {
            files = append(files, ReadDirectory(filePath))
        } else {
            files = append(files, File{ name: f.Name(), path: filePath })
        }
    }
    return File { name: path.Base(dirPath), isDir: isDir, path: dirPath, files: files }
}

func main() {
    dirPath := "../Python"
    dir := ReadDirectory(dirPath)
    dir.PrintTree()
}