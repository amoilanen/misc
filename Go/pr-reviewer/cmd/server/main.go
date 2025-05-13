package main

import (
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/amoilanen/pr-reviewer/internal/config"
	"github.com/amoilanen/pr-reviewer/internal/server"
)

func main() {
	configPath := flag.String("config", "config.yaml", "path to config file")
	flag.Parse()

	cfg, err := config.LoadConfig(*configPath)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	srv, err := server.NewServer(cfg)
	if err != nil {
		log.Fatalf("Failed to create server: %v", err)
	}

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := srv.Start(); err != nil {
			log.Printf("Server error: %v", err)
			sigChan <- syscall.SIGTERM
		}
	}()

	<-sigChan
	log.Println("Shutting down...")
}
