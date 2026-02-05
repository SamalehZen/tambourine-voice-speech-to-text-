#!/usr/bin/env python3
"""Render.com startup script for Tambourine Server.

This script:
1. Decodes Google Cloud credentials from base64 environment variable
2. Writes credentials to a temporary file
3. Sets GOOGLE_APPLICATION_CREDENTIALS environment variable
4. Starts the main server
"""

import base64
import os
import sys
import tempfile
from pathlib import Path


def setup_google_credentials() -> str | None:
    """Decode and write Google credentials from base64 env var.
    
    Returns the path to the credentials file, or None if not configured.
    """
    creds_base64 = os.environ.get("GOOGLE_CREDENTIALS_BASE64")
    
    if not creds_base64:
        print("GOOGLE_CREDENTIALS_BASE64 not set, skipping Google credentials setup")
        return None
    
    try:
        creds_json = base64.b64decode(creds_base64).decode("utf-8")
        
        creds_dir = Path(tempfile.gettempdir()) / "tambourine"
        creds_dir.mkdir(exist_ok=True)
        
        creds_path = creds_dir / "gcp-credentials.json"
        creds_path.write_text(creds_json)
        
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(creds_path)
        print(f"Google credentials written to {creds_path}")
        
        return str(creds_path)
        
    except Exception as e:
        print(f"Error decoding Google credentials: {e}")
        return None


def main():
    setup_google_credentials()
    
    host = os.environ.get("HOST", "0.0.0.0")
    port = os.environ.get("PORT", "8765")
    
    print(f"Starting Tambourine Server on {host}:{port}")
    
    os.execvp(
        sys.executable,
        [sys.executable, "main.py", "--host", host, "--port", port]
    )


if __name__ == "__main__":
    main()
