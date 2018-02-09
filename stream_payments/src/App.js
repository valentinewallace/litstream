import React, { Component } from 'react';
import logo from './logo.svg';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Main from './Main.js'
import Connect from './Connect.js'

const App = () => (
  <Router>
    <Switch>
      <Route exact path="/" component={Main}/>
      <Route path="/:ipAddr" component={Connect} />
    </Switch>
  </Router>
); 

//   constructor(props) {
//     super(props); 
//     let videoObjs = []
//     for (let id in videoIDs) {
//       videoObjs.push({
//         amountPaid: 0,
//         timerID: null,
//         player: null,
//         videoMessage: "0 satoshis paid to creator."
//       })
//     }
//     this.state = {
//       videos: videoObjs
//     }; 
//   }

//   render() {
//     return (
//       <div className="App">
//         <header className="App-header">
//           <img src={logo} className="App-logo" alt="logo" />
//           <h1 className="App-title">YouTubeKYS</h1>
//         </header>
//         <header className="Setup-instructions">
//           <h3 className=
//         </header>
//         <form onSubmit={() => this.connectToClient()}>
//           <label>
//             Public IP:
//             <input type="text" value={this.state.ipAddr} />
//           </label>
//           <input type="submit" value="Submit" />
//         </form>
//         <ul>
//           {videoIDs.map((name, index) => {
//             return (
//               <div>
//                 <YouTube
//                  videoId={name}
//                  onReady={(event) => this._onReady(event, index)}
//                  onPlay={() => this._onPlay(index)}
//                  onPause={() => this._onPause(index)}
//                  onEnd={() => this._onEnd(index)}
//                  onError={() => this._onError(index)}
//                 />
//                 <p>{this.state.videos.length > index ? this.state.videos[index].videoMessage : "0 satoshis paid to creator."}</p>
//               </div>
//             )
//           })}
//         </ul>
//       </div>
//     );
//   }

//   processInvoiceFailure(ind, errorMsg) {
//     const updatedVideos = this.state.videos;
//     const video = updatedVideos[ind];
//     video.player.pauseVideo();
//     video.videoMessage = errorMsg;
//     updatedVideos[ind] = video;
//     this.setState({videos: updatedVideos})
//   }

//   processInvoiceSuccess(ind) {
//     const updatedVideos = this.state.videos;
//     const video = updatedVideos[ind];
//     const newAmount = video.amountPaid + 1000; 
//     video.videoMessage = newAmount.toString() + " satoshis paid to creator.";
//     video.amountPaid = newAmount;
//     updatedVideos[ind] = video;
//     this.setState({videos: updatedVideos})    
//   }

//   _sleep(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
//   }

//   async chargeUser(ind) {
//     console.log("in chargeUser")
//     const invoice = await this.generateInvoice();
//     console.log("just generateInvoice'd")
//     if (invoice == null) {
//       this.processInvoiceFailure(ind, "Invoice generation failed.");
//       return;
//     }
//     const paymentReq = invoice[0];
//     const r_hash = invoice[1];
//     const paymentReqSuccess = await this.payInvoice(paymentReq)
//     if (paymentReqSuccess === false) {
//       this.processInvoiceFailure(ind, "Connection to payment server failed.");
//       return;
//     }
//     await this._sleep(2000);
//     const paymentSuccess = await this.checkPayment(r_hash)
//     if (paymentSuccess) {
//       this.processInvoiceSuccess(ind);
//     } else {
//       this.processInvoiceFailure(ind, "Payment failed.");
//     }
//   }

//   generateInvoice() {
//     console.log("in generateInvoice")
//     return new Promise(resolve => {
//       var xhttp = new XMLHttpRequest();
//       xhttp.onreadystatechange = () => {
//         console.log("readystate:")
//         console.log(xhttp.readyState)
//         if (xhttp.readyState === 4) {
//           console.log("readystate is 4")
//           if (xhttp.status === 200) {
//             console.log("status is 200")
//             let response = JSON.parse(xhttp.responseText);
//             resolve([response.payment_request, response.r_hash]);
//           } else {
//             console.log("status is not 200")
//             console.log(xhttp.status)
//             resolve(null);
//           }
//         }
//       };
//       xhttp.open("GET", "http://localhost:12344", true);
//       xhttp.send(null);
//       console.log("just sent req")
//     }); 
//   }

//   payInvoice(invoice) {
//     return new Promise(resolve => {
//       let xhttp = new XMLHttpRequest();
//       xhttp.onreadystatechange = () => {
//           if (xhttp.readyState === 4) {
//             if (xhttp.status === 200) {
//               resolve(true);
//             } else {
//               resolve(false);
//             }
//           }
//       };
//       xhttp.open("GET", "http://136.25.173.204:12348/" + invoice, true);
//       xhttp.send(null);
//     });
//   }

//   checkPayment(r_hash) {
//     return new Promise(resolve => {
//       let xhttp = new XMLHttpRequest();
//       xhttp.onreadystatechange = () => {
//           if (xhttp.readyState === 4) {
//             if (xhttp.status === 200) {
//               if (xhttp.responseText == "True") {
//                 resolve(true);
//               } else {
//                 resolve(false);
//               }
//             } else {
//               resolve(false);
//             }
//           }
//       };
//       xhttp.open("GET", "http://localhost:12344/" + encodeURIComponent(r_hash), true);
//       xhttp.send(null);
//     });
//   }

//   _onReady(event, ind) {
//     console.log("video is ready to play"); 
//     const updatedVideos = this.state.videos;
//     const video = updatedVideos[ind];
//     video.player = event.target;
//     updatedVideos[ind] = video;
//     this.setState({videos: updatedVideos})
//   }

//   _onPlay(ind) {
//     console.log("video playing"); 
//     const updatedVideos = this.state.videos.slice();
//     const video = updatedVideos[ind];

//     if (video.timerID == null) {
//       let timer = setInterval(
//         () => this.chargeUser(ind), 
//         5000
//       );
//       video.timerID = timer;
//     }

//     updatedVideos[ind] = video;
//     this.setState({videos: updatedVideos})
//   }

//   _onPause(ind) {
//     console.log("pausing video, clearing timer")
//     const updatedVideos = this.state.videos.slice();
//     const video = updatedVideos[ind];
//     if (video.timerID != null) {
//       clearInterval(video.timerID);
//     }
//     video.timerID = null;
//     updatedVideos[ind] = video;
//     this.setState({videos: updatedVideos})
//   }

//   _onEnd(ind) {
//     console.log("video ended, clearing timer")
//     const updatedVideos = this.state.videos.slice();
//     const video = updatedVideos[ind];
//     if (video.timerID != null) {
//       clearInterval(video.timerID);
//     }
//     video.timerID = null;
//     updatedVideos[ind] = video;
//     this.setState({videos: updatedVideos})
//   }

//   _onError(ind) {
//     console.log("video errored, clearing timer")
//     const updatedVideos = this.state.videos.slice();
//     const video = updatedVideos[ind];
//     if (video.timerID != null) {
//       clearInterval(video.timerID);
//     }
//     video.timerID = null;
//     updatedVideos[ind] = video;
//     this.setState({videos: updatedVideos})
//   }
// }

export default App;
