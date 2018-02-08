import rpc_pb2 as ln, rpc_pb2_grpc as lnrpc
import grpc
from flask import Flask
from flask_cors import CORS
from flask.json import jsonify

cert = open('/home/valentine/.lnd/tls.cert').read()
creds = grpc.ssl_channel_credentials(cert)
channel = grpc.secure_channel('localhost:10002', creds)
stub = lnrpc.LightningStub(channel)

app = Flask(__name__)
CORS(app)

@app.route('/')
def generate_invoice():
    return stub.AddInvoice(ln.Invoice(value=1000, memo="TestMemo")).payment_request

@app.route('/check_payment')
def check_invoices():
    req = ln.ListInvoiceRequest(pending_only=True)
    invoices = stub.ListInvoices(req)
    print("invoices:")
    print(invoices)
    return invoices