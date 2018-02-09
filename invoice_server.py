import rpc_pb2 as ln, rpc_pb2_grpc as lnrpc
import grpc
from flask import Flask, request, send_from_directory
from flask_cors import CORS
from flask.json import jsonify
import codecs
import time

cert = open('/home/valentine/.lnd/tls.cert').read()
creds = grpc.ssl_channel_credentials(cert)
channel = grpc.secure_channel('localhost:10002', creds)
stub = lnrpc.LightningStub(channel)

app = Flask(__name__, static_folder='stream_payments/build/')
CORS(app)

@app.route('/')
def send_home():
    return send_from_directory('stream_payments/build/', 'index.html')

@app.route('/<path:path>')
def send_static():
    return send_from_directory('stream_payments/build/', path)

@app.route('/static/<path:path>')
def send_static_file(path):
    return send_from_directory('stream_payments/build/static/', path)

@app.route('/generateinvoice')
def generate_invoice():
    add_invoice_resp = stub.AddInvoice(ln.Invoice(value=10, memo="TestMemo"))
    r_hash_base64 = codecs.encode(add_invoice_resp.r_hash, 'base64')
    r_hash = r_hash_base64.decode('utf-8')
    return jsonify({"r_hash": r_hash, "payment_request": add_invoice_resp.payment_request})

@app.route('/checkpayment/<path:r_hash>')
def check_invoices(r_hash):
    r_hash_base64 = r_hash.encode('utf-8')
    r_hash_bytes = str(codecs.decode(r_hash_base64, 'base64'))
    invoice_resp = stub.LookupInvoice(ln.PaymentHash(r_hash=r_hash_bytes))
    return str(invoice_resp.settled)

