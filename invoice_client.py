import rpc_pb2 as ln, rpc_pb2_grpc as lnrpc
import grpc
from flask import Flask
from flask import request
from flask_cors import CORS
from flask.json import jsonify

LND_PORT = "10001"

cert = open('/home/valentine/.lnd/tls.cert').read()
creds = grpc.ssl_channel_credentials(cert)
channel = grpc.secure_channel('localhost:10001', creds)
stub = lnrpc.LightningStub(channel)

app = Flask(__name__)
CORS(app)

@app.route('/getpeerinfo')
def get_peer_info():
    # get public address
    req = ln.GetInfoRequest()
    res = stub.GetInfo(req)
    return jsonify({"pubkey": res.identity_pubkey, "port": LND_PORT})
    # peer_addr = "033b83af1dcbdd5375ede3334b98ddf19d0f9cd1a805e4ff96ee7422e24c978e4c@localhost:12344"
    # req = ln.ConnectPeerRequest(addr=peer_addr)
    # res = stub.ConnectPeer(req)
    # print("response in add_peer:")
    # print(res)
    # return str(res.peer_id)

@app.route('/<string:invoice>')
def pay_invoice(invoice):
    send_req = ln.SendRequest(payment_request=invoice)
    sent_payment = stub.SendPaymentSync(send_req)
    print("sent_payment:")
    print(sent_payment)
    return invoice