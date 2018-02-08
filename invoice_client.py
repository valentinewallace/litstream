import rpc_pb2 as ln, rpc_pb2_grpc as lnrpc
import grpc
from flask import Flask
from flask import request
from flask_cors import CORS
from flask.json import jsonify

cert = open('/home/valentine/.lnd/tls.cert').read()
creds = grpc.ssl_channel_credentials(cert)
channel = grpc.secure_channel('localhost:10001', creds)
stub = lnrpc.LightningStub(channel)

app = Flask(__name__)
CORS(app)

@app.route('/<string:invoice>')
def pay_invoice(invoice):
    send_req = ln.SendRequest(payment_request=invoice)
    sent_payment = stub.SendPaymentSync(send_req)
    print("sent_payment:")
    print(sent_payment)
    return invoice