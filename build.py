#!/usr/bin/env python3
"""Joins the files in src/ into night-run-app/index.html.

  python3 build.py           build once
  python3 build.py --serve   play at http://localhost:8000 (rebuilds every time you refresh)

The game's code all lives inside one wrapper function, so the files in src/js/ can use each
other's code freely. They are joined in filename order, which is why they are numbered.
"""
import hashlib
import http.server
import sys
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'src'
APP = ROOT / 'night-run-app'
OUTPUT = APP / 'index.html'
LAST_BUILD = SRC / '.last-build'  # fingerprint of the last build, to notice edits made to index.html itself
PORT = 8000


def fingerprint(data):
    return hashlib.sha256(data).hexdigest()


def build():
    if LAST_BUILD.exists() and OUTPUT.exists() and fingerprint(OUTPUT.read_bytes()) != LAST_BUILD.read_text().strip():
        raise SystemExit(
            'Stopped: night-run-app/index.html was edited directly, and building would erase that edit.\n'
            'Copy the edit into the matching file in src/, then delete src/.last-build and build again.'
        )
    page = (SRC / 'page.html').read_bytes()
    styles = (SRC / 'styles.css').read_bytes()
    game = b''.join(f.read_bytes() for f in sorted((SRC / 'js').glob('*.js')))
    for placeholder in (b'{{styles}}\n', b'{{game}}\n'):
        if page.count(placeholder) != 1:
            raise SystemExit(f'Stopped: src/page.html needs exactly one {placeholder.decode().strip()} line.')
    html = page.replace(b'{{styles}}\n', styles).replace(b'{{game}}\n', game)
    OUTPUT.write_bytes(html)
    LAST_BUILD.write_text(fingerprint(html) + '\n')


class DevHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split('?')[0] in ('/', '/index.html'):
            try:
                build()
            except SystemExit as stop:
                self.send_error(500, explain=str(stop))
                print(stop)
                return
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def serve():
    build()
    handler = partial(DevHandler, directory=str(APP))
    with http.server.ThreadingHTTPServer(('127.0.0.1', PORT), handler) as server:
        print(f'Night Run is at http://localhost:{PORT} (press Ctrl+C to stop)')
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    if '--serve' in sys.argv[1:]:
        serve()
    else:
        build()
        print(f'Built {OUTPUT.relative_to(ROOT)}')
