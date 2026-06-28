# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production server
FROM python:3.11-slim
WORKDIR /app

# Copy backend
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend-build /app/dist ./dist

# Set environment variables
ENV FLASK_DEBUG=false
ENV PORT=5000

# Expose port
EXPOSE 5000

# Run server
WORKDIR /app/backend
CMD ["python", "run.py"]
