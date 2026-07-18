import sys
import logging

def test_startup():
    try:
        from app.main import app
        print("Backend loaded successfully")
        sys.exit(0)
    except Exception as e:
        print(f"Backend failed to load: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    test_startup()
