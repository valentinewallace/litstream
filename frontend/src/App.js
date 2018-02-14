import React, { Component } from 'react';
import YouTube from 'react-youtube'; 
import './App.css';

var videoIDs = ["Mh5LY4Mz15o", "eWuRwu2DhwU", "6lXvrQzUhj4", "iFZChBPQvXY"];

class App extends Component {

  constructor(props) {
    super(props); 
    let videoObjs = [];
    for (let i = 0; i < videoIDs.length; i++) {
      videoObjs.push({
        amountPaid: 0,
        timerID: null,
        player: null,
        videoMessage: "0 satoshis paid to creator."
      });
    }
    this.state = {
      videos: videoObjs,
      paymentFailed: false
    }; 
  }

  render() {
    const opts = {
      height: '350',
      width: '600'
    };

    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">LitStream</h1>
        </header>
        <p>{this.state.clientInfo}</p>
        <ol className="vids">
          {videoIDs.map((name, index) => {
            return (
              <div>
                <YouTube
                 videoId={name}
                 onReady={(event) => this._onReady(event, index)}
                 onPlay={() => this._onPlay(index)}
                 onPause={() => this._onPause(index)}
                 onEnd={() => this._onEnd(index)}
                 onError={() => this._onError(index)}
                 opts={opts}
                />
                <p>{this.state.videos.length > index ? this.state.videos[index].videoMessage : "0 satoshis paid to creator."}</p>
              </div>
            )
          })}
        </ol>
      </div>
    );
  }

  processInvoiceFailure(ind, errorMsg) {
    const updatedVideos = this.state.videos;
    const video = updatedVideos[ind];
    video.player.pauseVideo();
    video.videoMessage = errorMsg;
    updatedVideos[ind] = video;
    this.setState({videos: updatedVideos});
  }

  processInvoiceSuccess(ind) {
    const updatedVideos = this.state.videos;
    const video = updatedVideos[ind];
    const newAmount = video.amountPaid + 10; 
    video.videoMessage = newAmount.toString() + " satoshis paid to creator.";
    video.amountPaid = newAmount;
    updatedVideos[ind] = video;
    this.setState({videos: updatedVideos}); 
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async chargeUser(ind) {
    const invoice = await this.generateInvoice();
    if (invoice == null) {
      this.processInvoiceFailure(ind, "Invoice generation failed.");
      return;
    }
    const paymentReq = invoice[0];
    const r_hash = invoice[1];
    const clientIP = invoice[2];
    const paymentReqInfo = await this.payInvoice(paymentReq, clientIP)
    if (paymentReqInfo !== "Success") {
      this.processInvoiceFailure(ind, paymentReqInfo);
      return;
    } 
    this.checkPayment(r_hash, ind);
  }

  generateInvoice() {
    return new Promise(resolve => {
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = () => {
        if (xhttp.readyState === 4) {
          if (xhttp.status === 200) {
            let response = JSON.parse(xhttp.responseText);
            resolve([response.payment_request, response.r_hash, response.ip]);
          } else {
            console.log("xhttp.status in generateInvoice:");
            console.log(xhttp.status);
            resolve(null);
          }
        }
      };
      xhttp.open("GET", "http://ec2-52-53-90-150.us-west-1.compute.amazonaws.com/generateinvoice", true);
      xhttp.send(null);
    }); 
  }

  payInvoice(invoice, clientIP) {
    return new Promise(resolve => {
      let xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = () => {
          if (xhttp.readyState === 4) {
            if (xhttp.status === 200) {
              if (xhttp.responseText.indexOf("unable to find a path to destination") !== -1) {
                resolve("Payment failed: unable to find a path between lnd nodes. Solution: open a channel at 03a2102f6978b9e5c6a2dd39697f95b36a7992a60ca65e0316dcd517108e8da171@52.53.90.150:9735");
              } else {
                resolve("Success");
              }
            } else {
              resolve("Payment failed: unable to connect to client. Check your server?");
            }
          }
      };
      xhttp.open("GET", "http://" + clientIP + ":5000/" + invoice, true);
      xhttp.send(null);
    });
  }

  async checkPayment(r_hash, ind) {
    await this._sleep(2000);
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = () => {
        if (xhttp.readyState === 4) {
          if (xhttp.status === 200) {
            if (xhttp.responseText === "True") {
              this.processInvoiceSuccess(ind);
              this.setState({paymentFailed: false, clientInfo: "Connected to client."});
            } else {
              this.processInvoiceFailure(ind, "Payment failed: client did not pay invoice.");
              this.setState({paymentFailed: true});
            }
          } else {
            console.log("failed to pay in checkPayment");
            console.log(xhttp.status);
            this.processInvoiceFailure(ind, "Payment failed: unable to connect to server. Please open or +1 an issue.");
            this.setState({paymentFailed: true});
          }
        }
    };
    xhttp.open("POST", "http://ec2-52-53-90-150.us-west-1.compute.amazonaws.com/checkpayment", true);
    xhttp.send(r_hash);
  }

  _onReady(event, ind) {
    console.log("video is ready to play"); 
    const updatedVideos = this.state.videos;
    const video = updatedVideos[ind];
    video.player = event.target;
    updatedVideos[ind] = video;
    this.setState({videos: updatedVideos});
  }

  _onPlay(ind) {
    console.log("video playing"); 
    const updatedVideos = this.state.videos.slice();
    const video = updatedVideos[ind];

    if (video.timerID == null) {
      let timer = setInterval(
        () => this.chargeUser(ind), 
        2000
      );
      video.timerID = timer;
    }

    updatedVideos[ind] = video;
    this.setState({videos: updatedVideos});
  }

  _onStop(ind) {
    const updatedVideos = this.state.videos.slice();
    const video = updatedVideos[ind];
    if (video.timerID != null) {
      clearInterval(video.timerID);
    }
    video.timerID = null;
    updatedVideos[ind] = video;
    this.setState({videos: updatedVideos});    
  }

  _onPause(ind) {
    console.log("pausing video, clearing timer");
    this._onStop(ind);
  }

  _onEnd(ind) {
    console.log("video ended, clearing timer");
    this._onStop(ind);
  }

  _onError(ind) {
    console.log("video errored, clearing timer");
    this._onStop(ind);
  }
}

export default App;
