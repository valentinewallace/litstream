import React, { Component } from 'react';
import YouTube from 'react-youtube'; 
import logo from './logo.svg';
import './App.css';
import $ from 'jquery';
var videoIDs = ["Mh5LY4Mz15o", "eWuRwu2DhwU", "6lXvrQzUhj4", "M_dmiWx97SI"]

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
      clientIP: null,
      paymentFailed: false
    }; 
    this.getClientIP();
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

  // Retrieve client IP address to send them invoices.
  getClientIP() {
    console.log("in getclientIP");
    return new Promise(resolve => {
//      $.get("http://freegeoip.net/json/", function(data) { 
//          console.log("fetched freegeoip data");
        $.getJSON("http://freegeoip.net/json?callback=?", function(data) { console.log("getjson success"); console.log(data);}).fail(function() { console.log("failure");}).error(function(one, two, three) { console.log("error??"), console.log(one)});  
        
//          console.log(data);}).fail(function() {
//              console.log("error");
//          })
//          .done(function() {
//              console.log("done");
//          })
//          .always(function() {
//              console.log("complete");
//          })
//        $.ajax({
//            type: 'GET',
//            url: 'http://freegeoip.net/json/',
//	    dataType: 'jsonp',
//            success: function(data) {
//                console.log("ajax success");
//                console.log(data);
//            },
//            error: function(jqXHR, textStatus, errorThrown) {
//            	console.log("ajax error");
//                console.log(jqXHR);
//                console.log(textStatus);
//                console.log(errorThrown);
 //           }});

//      let xhttp = new XMLHttpRequest();
//      xhttp.onreadystatechange = () => {
//          if (xhttp.readyState === 4) {
//            if (xhttp.status === 200) {
//              let ip = JSON.parse(xhttp.responseText).ip;
//              this.setState({clientIP: ip, clientInfo: "Retrieved client IP."});
//              resolve(true);
//            } else {
//	      console.log("this.status on failed to get ip:");
//              console.log(xhttp.status)
//              this.setState({clientInfo: "Failed to fetch client IP."});
//              resolve(false);
//            }
//          }
//      };
//      xhttp.open("GET", "http://freegeoip.net/json/", true);
//      xhttp.send(null);
    });
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
    if (this.state.paymentFailed) {
      this.processInvoiceFailure(ind, "Payment failed.");
      return;
    }
    if (this.state.clientIP == null) {
      let IPsuccess = await this.getClientIP()
      if (IPsuccess == false) {
        console.log("IPSuccess was false")
        this.processInvoiceFailure(ind, "Failed to fetch client IP.");
        return;
      }
    }
    const invoice = await this.generateInvoice();
    if (invoice == null) {
      this.processInvoiceFailure(ind, "Invoice generation failed.");
      return;
    }
    const paymentReq = invoice[0];
    const r_hash = invoice[1];
    if (this.state.clientIP == null) {
      console.log("this.state.clientIP was null")
      this.processInvoiceFailure(ind, "Failed to fetch client IP.");
      return;
    }
    const paymentReqSuccess = await this.payInvoice(paymentReq)
    if (paymentReqSuccess === false) {
      this.processInvoiceFailure(ind, "Connection to payment server failed.");
      return;
    } 
    this.processInvoiceSuccess(ind);
    this.checkPayment(r_hash);
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
      xhttp.open("GET", "http://localhost:12344/generateinvoice", true);
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

  async checkPayment(r_hash) {
    await this._sleep(2000);
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = () => {
        if (xhttp.readyState === 4) {
          if (xhttp.status === 200) {
            if (xhttp.responseText === "True") {
              this.setState({paymentFailed: false, clientInfo: "Connected to client."});
            } else {
              this.setState({paymentFailed: true});
            }
          } else {
            this.setState({paymentFailed: true});
          }
        }
    };
    xhttp.open("GET", "http://localhost:12344/checkpayment/" + encodeURIComponent(r_hash), true);
    xhttp.send(null);
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
