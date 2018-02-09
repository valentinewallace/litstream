import React, { Component } from 'react';
import YouTube from 'react-youtube'; 
import logo from './logo.svg';
import './Main.css';

var videoIDs = ["Mh5LY4Mz15o", "eWuRwu2DhwU", "6lXvrQzUhj4", "M_dmiWx97SI"]
var peerAddr = "033b83af1dcbdd5375ede3334b98ddf19d0f9cd1a805e4ff96ee7422e24c978e4c@localhost:12344"

class Main extends Component {

  constructor(props) {
    super(props); 
    let videoObjs = []
    for (let id in videoIDs) {
      videoObjs.push({
        amountPaid: 0,
        timerID: null,
        player: null,
        videoMessage: "0 satoshis paid to creator."
      })
    }
    this.state = {
      videos: videoObjs,
      clientIP: null,
      clientPubKey: null
    }; 
    this.connectClient()
  }

  render() {
    const opts = {
      height: '350',
      width: '600'
    };

    return (
      <div className="Main">
        <header className="Main-header">
          <img src={logo} className="Main-logo" alt="logo" />
          <h1 className="Main-title">YouTubeKYS</h1>
        </header>
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

  async connectClient() {
    const ip = await this.getClientIP();

  }

  getClientIP() {
    return new Promise(resolve => {
      let xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = () => {
          if (xhttp.readyState === 4) {
            if (xhttp.status === 200) {
              let ip = JSON.parse(xhttp.responseText).ip;
              this.setState({clientIP: ip});
              resolve(ip);
            } else {
              this.setState({ipFetchError: "Failed to fetch client IP."});
              resolve(null);
            }
          }
      };
      xhttp.open("GET", "http://freegeoip.net/json/", true);
      xhttp.send(null);
    });
  }

  getClientPubKey(ip) {
    return new Promise(resolve => {
      let xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = () => {
          if (xhttp.readyState === 4) {
            if (xhttp.status === 200) {
              this.setState({clientPubKey: xhttp.responseText});
              resolve(xhttp.responseText);
            } else {
              resolve(null);
            }
          }
      };
      xhttp.open("GET", "http://" + ip + "/getpeerinfo", true);
      xhttp.send(null);
    });
  }

  processInvoiceFailure(ind, errorMsg) {
    const updatedVideos = this.state.videos;
    const video = updatedVideos[ind];
    video.player.pauseVideo();
    video.videoMessage = errorMsg;
    updatedVideos[ind] = video;
    this.setState({videos: updatedVideos})
  }

  processInvoiceSuccess(ind) {
    const updatedVideos = this.state.videos;
    const video = updatedVideos[ind];
    const newAmount = video.amountPaid + 1000; 
    video.videoMessage = newAmount.toString() + " satoshis paid to creator.";
    video.amountPaid = newAmount;
    updatedVideos[ind] = video;
    this.setState({videos: updatedVideos})    
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async chargeUser(ind) {
    console.log("in chargeUser")
    const invoice = await this.generateInvoice();
    console.log("just generateInvoice'd")
    if (invoice == null) {
      this.processInvoiceFailure(ind, "Invoice generation failed.");
      return;
    }
    const paymentReq = invoice[0];
    const r_hash = invoice[1];
    if (this.state.clientIP == null) {
      this.processInvoiceFailure(ind, "Failed to fetch client IP.");
      return;
    }
    const paymentReqSuccess = await this.payInvoice(paymentReq)
    if (paymentReqSuccess === false) {
      this.processInvoiceFailure(ind, "Connection to payment server failed.");
      return;
    }
    await this._sleep(2000);
    const paymentSuccess = await this.checkPayment(r_hash)
    if (paymentSuccess) {
      this.processInvoiceSuccess(ind);
    } else {
      this.processInvoiceFailure(ind, "Payment failed.");
    }
  }

  generateInvoice() {
    return new Promise(resolve => {
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = () => {
        if (xhttp.readyState === 4) {
          if (xhttp.status === 200) {
            let response = JSON.parse(xhttp.responseText);
            resolve([response.payment_request, response.r_hash]);
          } else {
            resolve(null);
          }
        }
      };
      xhttp.open("GET", "http://localhost:12344", true);
      xhttp.send(null);
    }); 
  }

  payInvoice(invoice) {
    return new Promise(resolve => {
      let xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = () => {
          if (xhttp.readyState === 4) {
            if (xhttp.status === 200) {
              resolve(true);
            } else {
              resolve(false);
            }
          }
      };
      xhttp.open("GET", "http://" + this.state.clientIP + ":12348/" + invoice, true);
      xhttp.send(null);
    });
  }

  checkPayment(r_hash) {
    return new Promise(resolve => {
      let xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = () => {
          if (xhttp.readyState === 4) {
            if (xhttp.status === 200) {
              if (xhttp.responseText == "True") {
                resolve(true);
              } else {
                resolve(false);
              }
            } else {
              resolve(false);
            }
          }
      };
      xhttp.open("GET", "http://localhost:12344/" + encodeURIComponent(r_hash), true);
      xhttp.send(null);
    });
  }

  _onReady(event, ind) {
    console.log("video is ready to play"); 
    const updatedVideos = this.state.videos;
    const video = updatedVideos[ind];
    video.player = event.target;
    updatedVideos[ind] = video;
    this.setState({videos: updatedVideos})
  }

  _onPlay(ind) {
    console.log("video playing"); 
    const updatedVideos = this.state.videos.slice();
    const video = updatedVideos[ind];

    if (video.timerID == null) {
      let timer = setInterval(
        () => this.chargeUser(ind), 
        5000
      );
      video.timerID = timer;
    }

    updatedVideos[ind] = video;
    this.setState({videos: updatedVideos})
  }

  _onPause(ind) {
    console.log("pausing video, clearing timer")
    const updatedVideos = this.state.videos.slice();
    const video = updatedVideos[ind];
    if (video.timerID != null) {
      clearInterval(video.timerID);
    }
    video.timerID = null;
    updatedVideos[ind] = video;
    this.setState({videos: updatedVideos})
  }

  _onEnd(ind) {
    console.log("video ended, clearing timer")
    const updatedVideos = this.state.videos.slice();
    const video = updatedVideos[ind];
    if (video.timerID != null) {
      clearInterval(video.timerID);
    }
    video.timerID = null;
    updatedVideos[ind] = video;
    this.setState({videos: updatedVideos})
  }

  _onError(ind) {
    console.log("video errored, clearing timer")
    const updatedVideos = this.state.videos.slice();
    const video = updatedVideos[ind];
    if (video.timerID != null) {
      clearInterval(video.timerID);
    }
    video.timerID = null;
    updatedVideos[ind] = video;
    this.setState({videos: updatedVideos})
  }
}

export default Main;
