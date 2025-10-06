import os
import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
import psycopg2
from psycopg2 import pool
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='static', static_url_path='')

# Database connection pool
db_pool = None

def init_db_pool():
    global db_pool
    db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@postgres:5432/loadtest')

    # Wait for database to be ready
    max_retries = 30
    for i in range(max_retries):
        try:
            db_pool = psycopg2.pool.SimpleConnectionPool(
                minconn=5,
                maxconn=25,
                dsn=db_url
            )
            logger.info("Connected to database")
            return
        except Exception as e:
            if i < max_retries - 1:
                logger.info(f"Waiting for database... ({i+1}/{max_retries})")
                time.sleep(1)
            else:
                logger.error(f"Failed to connect to database: {e}")
                raise

@app.route('/')
def serve_index():
    return send_from_directory('static', 'index.html')

@app.route('/read', methods=['GET'])
def handle_read():
    conn = None
    try:
        conn = db_pool.getconn()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id, payload, created_at FROM items ORDER BY created_at DESC LIMIT 10"
        )

        items = []
        for row in cursor.fetchall():
            items.append({
                'id': row[0],
                'payload': row[1],
                'created_at': row[2].isoformat() if row[2] else None
            })

        cursor.close()

        return jsonify({
            'success': True,
            'data': items
        })
    except Exception as e:
        logger.error(f"Read error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        if conn:
            db_pool.putconn(conn)

@app.route('/write', methods=['POST'])
def handle_write():
    conn = None
    try:
        data = request.get_json()
        if not data or 'payload' not in data:
            return jsonify({
                'success': False,
                'error': 'Invalid JSON: payload required'
            }), 400

        conn = db_pool.getconn()
        cursor = conn.cursor()

        cursor.execute(
            "INSERT INTO items (payload, created_at) VALUES (%s, NOW()) RETURNING id, created_at",
            (data['payload'],)
        )

        row = cursor.fetchone()
        item = {
            'id': row[0],
            'payload': data['payload'],
            'created_at': row[1].isoformat() if row[1] else None
        }

        conn.commit()
        cursor.close()

        return jsonify({
            'success': True,
            'data': item
        })
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Write error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        if conn:
            db_pool.putconn(conn)

@app.route('/health', methods=['GET'])
def handle_health():
    conn = None
    try:
        conn = db_pool.getconn()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()

        return jsonify({
            'success': True,
            'data': 'healthy'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Database unavailable'
        }), 503
    finally:
        if conn:
            db_pool.putconn(conn)

if __name__ == '__main__':
    init_db_pool()
    logger.info("Starting Python backend on :8080")
    logger.info("Frontend available at http://localhost:8080/")
    app.run(host='0.0.0.0', port=8080)
