# --- Stage 1: Build the Angular Frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Build the Go Backend ---
FROM golang:1.22-alpine AS backend-build
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
# Build a static binary with no external dependencies
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/agripath-server .

# --- Stage 3: Final Production Image ---
FROM alpine:3.19
WORKDIR /app

# Install ca-certificates for secure outbound API calls (NVIDIA/Open-Meteo)
RUN apk --no-cache add ca-certificates

# Copy compiled Go binary from Stage 2
COPY --from=backend-build /app/agripath-server /app/agripath-server

# Copy built Angular static assets from Stage 1
COPY --from=frontend-build /app/frontend/dist/frontend/browser /app/frontend/dist/frontend/browser

# Create data directory for feedback logs
RUN mkdir -p /app/data

# Expose port 8080 as defined in the brief
EXPOSE 8080

# Set environment variables for single-server mode
ENV PORT=8080
ENV STATIC_DIR=/app/frontend/dist/frontend/browser
ENV FEEDBACK_FILE=/app/data/feedback.jsonl

# Run the server binary
CMD ["/app/agripath-server"]