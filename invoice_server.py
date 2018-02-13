import rpc_pb2 as ln, rpc_pb2_grpc as lnrpc
import grpc
from flask import Flask, request, send_from_directory
from flask_cors import CORS
from flask.json import jsonify
import codecs
import time
from urllib2 import urlopen

# cert = open('/home/ubuntu/.lnd/tls.cert').read()
cert = open('/var/www/html/litstream/tls.cert').read()
creds = grpc.ssl_channel_credentials(cert)
channel = grpc.secure_channel('localhost:10009', creds)
stub = lnrpc.LightningStub(channel)

app = Flask(__name__, static_folder='frontend/')
CORS(app)

@app.route('/')
def send_home():
    return send_from_directory('frontend/build/', 'index.html')

@app.route('/<path:path>')
def send_static_files(path):
    return send_from_directory('frontend/build/', path)

@app.route('/static/<path:path>')
def send_static_file(path):
    return send_from_directory('frontend/build/static/', path)

@app.route('/generateinvoice')
def generate_invoice():
    client_ip = request.remote_addr
    add_invoice_resp = stub.AddInvoice(ln.Invoice(value=10, memo="TestMemo"))
    r_hash_base64 = codecs.encode(add_invoice_resp.r_hash, 'base64')
    r_hash = r_hash_base64.decode('utf-8')
    return jsonify({"r_hash": r_hash, "payment_request": add_invoice_resp.payment_request, "ip": client_ip})

@app.route('/checkpayment/<path:r_hash>')
def check_invoices(r_hash):
    r_hash_base64 = r_hash.encode('utf-8')
    r_hash_bytes = str(codecs.decode(r_hash_base64, 'base64'))
    invoice_resp = stub.LookupInvoice(ln.PaymentHash(r_hash=r_hash_bytes))
    return str(invoice_resp.settled)

@app.errorhandler(404)
def page_not_found(e):
    return "4 to the 0 to the 4", 404

if __name__ == '__main__':
    app.run()
