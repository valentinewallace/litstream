import React, { Component } from 'react';
import YouTube from 'react-youtube'; 
import logo from './logo.svg';
import './App.css';


class App extends Component {

  constructor(props) {
    super(props); 
    this.state = {
      invoice: null,
      r_hash: null,
      amountPaid: 0,
      timerID: null,
      player: null
    }; 
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">{this.state.invoice}</h1>
        </header>
        <YouTube
         videoId="Mh5LY4Mz15o"
         onReady={(event) => this._onReady(event)}
         onPlay={() => this._onPlay()}
         onPause={() => this._onPause()}
         onEnd={() => this._onEnd()}
         onError={() => this._onError()}
        />
        <p>{this.state.amountPaid} satoshis paid to creator</p>
      </div>
    );
  }

  componentDidMount() {
    // this.timerID = setInterval(
    //   () => this.generateInvoice(), 
    //   5000
    // ); 
    console.log("componentDidMount")
  }

  generateInvoice() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = () => {
        if (xhttp.readyState === 4) {
          if (xhttp.status === 200) {
            let response = JSON.parse(xhttp.responseText)
            console.log("about to set state w/ r_hash")
            console.log(response.r_hash)
            this.setState({
              invoice: response.payment_request, 
              r_hash: response.r_hash
            }); 
          } else {
            this.setState({invoice: "failed to get invoice"})
          }
        }
    };
    xhttp.open("GET", "http://localhost:12344", true);
    xhttp.send(null);
  }

  payInvoice(invoice) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = () => {
        if (xhttp.readyState === 4) {
          if (xhttp.status === 200) {
           this.setState({paymentReqSuccess: true}); 
          } else {
            this.setState({paymentReqSuccess: false})
          }
        }
    };
    xhttp.open("GET", "http://localhost:12348/" + invoice, true);
    xhttp.send(null);
  }

  checkPayment() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = () => {
        if (xhttp.readyState === 4) {
          if (xhttp.status === 200) {
            console.log("rv of checkPayment:")
            console.log(xhttp.responseText)
          } else {
            console.log("check payment server call failed")
          }
        }
    };
    console.log("about to check payment w/ r_hash:")
    console.log(this.state.r_hash)
    // xhttp.open("GET", "http://localhost:12344/check_payment/" + encodeURIComponent(this.state.r_hash), true);
    xhttp.open("GET", "http://localhost:12344/" + encodeURIComponent(this.state.r_hash), true);
    // xhttp.open("GET", "http://localhost:12344/test", true);

    // xhttp.open("GET", "http://localhost:12344/check_payment/" + this.state.r_hash, true);
    xhttp.send(null);
  }

  _onReady(event) {
    console.log("video is ready to play"); 
    this.setState({player: event.target}); 
  }

  _onPlay() {
    console.log("video playing"); 
    if (this.state.timerID == null) {
      let timer = setInterval(
        () => this.generateInvoice(), 
        5000
      );
      this.setState({timerID: timer})   
    }
  }

  _onPause() {
    console.log("pausing video, clearing timer")
    if (this.state.timerID != null) {
      clearInterval(this.state.timerID);
    }
    this.setState({timerID: null})
  }

  _onEnd() {
    console.log("video ended, clearing timer")
    if (this.state.timerID != null) {
      clearInterval(this.state.timerID);
    }
    this.setState({timerID: null})
  }

  _onError() {
    console.log("video errored, clearing timer")
    if (this.state.timerID != null) {
      clearInterval(this.state.timerID);
    }
    this.setState({timerID: null})
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.state.invoice !== nextState.invoice) {
      console.log("about to pay invoice")
      this.payInvoice(nextState.invoice)
      this.setState({amountPaid: this.state.amountPaid + 1000})
    }

  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.r_hash !== prevState.r_hash && this.state.r_hash != null) {
      console.log("about to check payment w/ new r_hash")
      console.log(this.state.r_hash)
      this.checkPayment()      
    }    
  }

  componentWillUnmount() {
    if (this.state.timerID != null) {
      clearInterval(this.state.timerID);
    }
    this.setState({timerID: null})
  }
}

export default App;
