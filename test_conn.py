import socket

def test_port(host, port):
    try:
        print(f"Testing {host}:{port}...")
        with socket.create_connection((host, port), timeout=5):
            print(f"Connection to {host}:{port} succeeded!")
            return True
    except Exception as e:
        print(f"Connection to {host}:{port} failed: {e}")
        return False

host = "aws-0-us-west-1.pooler.supabase.com"
test_port(host, 5432)
test_port(host, 6543)
