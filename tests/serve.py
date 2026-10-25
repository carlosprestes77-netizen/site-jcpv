from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
import os
# Local test harness only: WhatsApp and analytics are intercepted.
ROOT = Path(__file__).resolve().parents[1]
HARNESS = '''<script>
(() => {
 const record = (id, value) => {
   let el = document.getElementById(id);
   if (!el) { el = document.createElement('output'); el.id = id; el.hidden = true; document.body.append(el); }
   el.textContent = JSON.stringify(value);
 };
 const opens = [], events = [], writes = [];
 window.open = (url, target, features) => { opens.push({url,target,features}); record('qa-opens',opens); return null; };
 window.gtag = (...args) => { events.push(args); record('qa-events',events); };
 Object.defineProperty(navigator, 'clipboard', {value:{writeText:async text => {
   if (new URLSearchParams(location.search).has('copy-failure')) throw new Error('Simulated clipboard denial');
   record('qa-copy',text);
 }}});
 const originalSetItem = Storage.prototype.setItem;
 Storage.prototype.setItem = function(key,value) { writes.push({key,value}); record('qa-storage',writes); return originalSetItem.call(this,key,value); };
 document.addEventListener('click', event => {
   if (event.target.id === 'triagem-copy' && new URLSearchParams(location.search).has('copy-failure')) {
     Object.defineProperty(navigator.clipboard, 'writeText', {configurable:true, value:async () => { throw new Error('Test clipboard unavailable'); }});
   }
 }, true);
 record('qa-opens',opens); record('qa-events',events); record('qa-storage',writes);
})();
</script>'''
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  if self.path.split('?')[0] in ('/', '/index.html'):
   html = (ROOT/'index.html').read_text()
   html = re.sub(r'<script async src="https://www.googletagmanager.com[^>]+></script>', '', html)
   if 'offline=1' in self.path:
    html = re.sub(r'<script[^>]+src="https://[^"]+"[^>]*></script>', '', html)
   html = html.replace('</body>', HARNESS + '</body>')
   body = html.encode()
   self.send_response(200); self.send_header('Content-Type','text/html; charset=utf-8'); self.send_header('Content-Length',str(len(body))); self.end_headers(); self.wfile.write(body)
  else: super().do_GET()
os.chdir(ROOT)
ThreadingHTTPServer(('127.0.0.1',4174),Handler).serve_forever()
