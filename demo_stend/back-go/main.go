package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/lib/pq"
)

var db *sql.DB

type Item struct {
	ID        int       `json:"id"`
	Payload   string    `json:"payload"`
	CreatedAt time.Time `json:"created_at"`
}

type WriteRequest struct {
	Payload string `json:"payload"`
}

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func main() {
	var err error
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@postgres:5432/loadtest?sslmode=disable"
	}

	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Wait for database to be ready
	for i := 0; i < 30; i++ {
		if err = db.Ping(); err == nil {
			break
		}
		log.Println("Waiting for database...")
		time.Sleep(time.Second)
	}
	if err != nil {
		log.Fatal("Database not available:", err)
	}

	log.Println("Connected to database")

	mux := http.NewServeMux()

	// Serve static files
	fs := http.FileServer(http.Dir("./static"))
	mux.Handle("/", fs)

	// API endpoints
	mux.HandleFunc("/read", handleRead)
	mux.HandleFunc("/write", handleWrite)
	mux.HandleFunc("/health", handleHealth)

	log.Println("Starting Go backend on :8080")
	log.Println("Frontend available at http://localhost:8080/")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatal(err)
	}
}

func handleRead(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		sendJSON(w, http.StatusMethodNotAllowed, Response{Success: false, Error: "Method not allowed"})
		return
	}

	rows, err := db.Query("SELECT id, payload, created_at FROM items ORDER BY created_at DESC LIMIT 10")
	if err != nil {
		log.Println("Read error:", err)
		sendJSON(w, http.StatusInternalServerError, Response{Success: false, Error: err.Error()})
		return
	}
	defer rows.Close()

	items := []Item{}
	for rows.Next() {
		var item Item
		if err := rows.Scan(&item.ID, &item.Payload, &item.CreatedAt); err != nil {
			log.Println("Scan error:", err)
			continue
		}
		items = append(items, item)
	}

	sendJSON(w, http.StatusOK, Response{Success: true, Data: items})
}

func handleWrite(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendJSON(w, http.StatusMethodNotAllowed, Response{Success: false, Error: "Method not allowed"})
		return
	}

	var req WriteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, Response{Success: false, Error: "Invalid JSON"})
		return
	}

	var id int
	var createdAt time.Time
	err := db.QueryRow(
		"INSERT INTO items (payload, created_at) VALUES ($1, NOW()) RETURNING id, created_at",
		req.Payload,
	).Scan(&id, &createdAt)

	if err != nil {
		log.Println("Write error:", err)
		sendJSON(w, http.StatusInternalServerError, Response{Success: false, Error: err.Error()})
		return
	}

	item := Item{
		ID:        id,
		Payload:   req.Payload,
		CreatedAt: createdAt,
	}

	sendJSON(w, http.StatusOK, Response{Success: true, Data: item})
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	if err := db.Ping(); err != nil {
		sendJSON(w, http.StatusServiceUnavailable, Response{Success: false, Error: "Database unavailable"})
		return
	}
	sendJSON(w, http.StatusOK, Response{Success: true, Data: "healthy"})
}

func sendJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
