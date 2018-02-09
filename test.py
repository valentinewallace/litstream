import rpc_pb2 as ln, rpc_pb2_grpc as lnrpc
import grpc
from flask import Flask
from flask import request
from flask_cors import CORS
from flask.json import jsonify
from urllib2 import urlopen

LND_PORT = "10003"

cert = open('/home/valentine/.lnd/tls.cert').read()
creds = grpc.ssl_channel_credentials(cert)
channel = grpc.secure_channel('localhost:10003', creds)
stub = lnrpc.LightningStub(channel)

app = Flask(__name__)
CORS(app)

@app.route('/getpeerinfo')
def get_peer_info():
    my_ip = urlopen('http://ip.42.pl/raw').read()
    req = ln.GetInfoRequest()
    res = stub.GetInfo(req)
    return jsonify({"pubkey": res.identity_pubkey, "port": LND_PORT})

@app.route('/<string:invoice>')
def pay_invoice(invoice):
    send_req = ln.SendRequest(payment_request=invoice)
    sent_payment = stub.SendPaymentSync(send_req)
    print("sent_payment:")
    print(sent_payment)
    return invoice

def generate_payment_req(inv):
    while True:
        req = inv
        yield req
