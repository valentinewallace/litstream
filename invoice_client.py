import rpc_pb2 as ln, rpc_pb2_grpc as lnrpc
import grpc
from flask import Flask
from flask_cors import CORS

# Change this to the port your lightning node is running on: default 10009
LND_PORT = "10009"
# Change this to the path to your tls.cert
# keep in /home/<username> format, not ~
PATH_TO_TLS_CERT = '/home/valentine/.lnd/tls.cert'

SERVER_ADDR = "03a2102f6978b9e5c6a2dd39697f95b36a7992a60ca65e0316dcd517108e8da171@52.53.90.150:10009"
cert = open('/home/valentine/.lnd/tls.cert').read()
creds = grpc.ssl_channel_credentials(cert)
channel = grpc.secure_channel('localhost:' + LND_PORT, creds)
stub = lnrpc.LightningStub(channel)

def addpeer():
    req = ln.ConnectPeerRequest(addr=SERVER_ADDR)
    res = stub.ConnectPeer(req)
addpeer()

app = Flask(__name__)
CORS(app)

@app.route('/<string:invoice>')
def pay_invoice(invoice):
    send_req = ln.SendRequest(payment_request=invoice)
    sent_payment = stub.SendPaymentSync(send_req)
    print("sent_payment:")
    print(sent_payment)
    return invoice