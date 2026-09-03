# -*- coding: utf-8 -*-
"""本地开发/使用服务器：与 python -m http.server 相同，但所有响应带 no-cache 头，
保证词库/例句数据更新后刷新页面即可看到最新内容（规避浏览器启发式缓存）。
用法: python scripts/dev_server.py [端口，默认 8000]
"""
import http.server, socketserver, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, *a):
        pass

socketserver.TCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(('127.0.0.1', PORT), Handler) as httpd:
    print('Serving http://127.0.0.1:%d  (no-cache)' % PORT)
    httpd.serve_forever()
