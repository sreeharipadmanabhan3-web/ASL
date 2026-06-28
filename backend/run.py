#!/usr/bin/env python3
"""
ASL Recognition Flask Server Runner
"""

import os
import sys

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, init_db

if __name__ == '__main__':
    # Initialize database
    init_db()
    
    # Get port from environment or default to 5000
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'
    
    print(f'\n🚀 ASL Recognition Server')
    print(f'=' * 50)
    print(f'📍 Running on http://localhost:{port}')
    print(f'🔧 Debug mode: {debug}')
    print(f'=' * 50)
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
