import os
import sys
import socket
import webbrowser
import subprocess
import threading
import time
import re
import urllib.request
import shutil

# Ensure unbuffered UTF-8 output
sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def get_public_ip():
    try:
        return urllib.request.urlopen('https://api.ipify.org', timeout=3).read().decode('utf-8').strip()
    except Exception:
        return None

def find_cloudflared():
    w = shutil.which("cloudflared")
    if w:
        return w
    candidates = [
        r"C:\Program Files (x86)\cloudflared\cloudflared.exe",
        r"C:\Program Files\cloudflared\cloudflared.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\cloudflared\cloudflared.exe"),
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    return None

def save_link_file(url, note=""):
    try:
        content = (
            "====================================================\n"
            "   TOP 100 CYBER ARCADE - ONLINE LINK FOR FRIENDS\n"
            "====================================================\n\n"
            f"LINK: {url}\n\n"
            f"{note}\n"
            "Send this link to your friends! Works on phones, tablets, & PCs.\n"
            f"Generated: {time.ctime()}\n"
        )
        with open("ONLINE_LINK.txt", "w", encoding="utf-8") as f:
            f.write(content)
    except Exception:
        pass

def start_tunnel_background(public_ip):
    cloudflared_bin = find_cloudflared()

    # Strategy 1: Cloudflare Quick Tunnel (Fastest, zero password, 100% reliable)
    if cloudflared_bin:
        try:
            cmd = [cloudflared_bin, 'tunnel', '--url', 'http://localhost:8000']
            p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, errors='replace')
            for line in iter(p.stdout.readline, ''):
                if not line:
                    break
                m = re.search(r'https://[a-zA-Z0-9\.\-]+\.trycloudflare\.com', line)
                if m:
                    url = m.group(0)
                    save_link_file(url, "No password required.")
                    print("\n" + "=" * 68, flush=True)
                    print(" >> ONLINE LINK FOR FRIENDS (ANYWHERE IN THE WORLD):", flush=True)
                    print(f" >> {url}", flush=True)
                    print(" Send this link to your friends! No download or password needed.", flush=True)
                    print(" (Link also copied to ONLINE_LINK.txt)", flush=True)
                    print("=" * 68 + "\n", flush=True)
                    break
            p.wait()
            return
        except Exception as e:
            print(f"\n[Cloudflare Tunnel Note]: {e}, falling back to localtunnel...", flush=True)

    # Strategy 2: Localtunnel fallback
    try:
        cmd = ['cmd', '/c', 'npx', 'localtunnel', '--port', '8000']
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, errors='replace')
        for line in iter(p.stdout.readline, ''):
            if not line:
                break
            m = re.search(r'https://[a-zA-Z0-9\.\-]+\.loca\.lt', line)
            if m:
                url = m.group(0)
                note = f"(If friends see 'Tunnel Password', enter: {public_ip})" if public_ip else ""
                save_link_file(url, note)
                print("\n" + "=" * 68, flush=True)
                print(" >> ONLINE LINK FOR FRIENDS (ANYWHERE IN THE WORLD):", flush=True)
                print(f" >> {url}", flush=True)
                if public_ip:
                    print(f" >> (If friends see a 'Tunnel Password' box, enter: {public_ip})", flush=True)
                print(" Send this link to your friends! No install required.", flush=True)
                print(" (Link also copied to ONLINE_LINK.txt)", flush=True)
                print("=" * 68 + "\n", flush=True)
                break
        p.wait()
    except Exception as e:
        print(f"\n[Online Tunnel Note]: {e}", flush=True)

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    print("""
====================================================================
                TOP 100 CYBER ARCADE MULTIPLAYER
====================================================================
""", flush=True)

    local_ip = get_local_ip()

    print("-" * 68, flush=True)
    print(f"  * YOUR HOST SCREEN   : http://localhost:8000", flush=True)
    print(f"  * SAME WI-FI LINK    : http://{local_ip}:8000", flush=True)
    print("-" * 68, flush=True)
    print(" Generating secure online link for friends... (takes ~3 seconds)\n", flush=True)

    # Automatically open host screen in browser
    def open_browser():
        time.sleep(1.2)
        webbrowser.open("http://localhost:8000")
    threading.Thread(target=open_browser, daemon=True).start()

    # Generate online link in a non-blocking background thread (never freezes game)
    def bg_online():
        public_ip = get_public_ip()
        start_tunnel_background(public_ip)
    threading.Thread(target=bg_online, daemon=True).start()

    # Start FastAPI server on main thread
    try:
        import uvicorn
        from main import app
        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="warning")
    except KeyboardInterrupt:
        print("\nGame server stopped. Goodbye!", flush=True)

if __name__ == "__main__":
    main()
