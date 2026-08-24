import os
import sys

import uvicorn


def main():
    port = int(os.environ.get("PORT", "8080"))
    print(
        "Starting BarberApp AI service:",
        {
            "host": "0.0.0.0",
            "port": port,
            "python": sys.version,
            "cwd": os.getcwd(),
        },
        flush=True,
    )
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
    )


if __name__ == "__main__":
    main()
