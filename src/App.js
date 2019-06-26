import React, { Component } from 'react';
import './App.css';
const url = "http://localhost:1337/api";
const consoleCommands = [
  "help: Shows these commands",
  "searchItem: Manually trigger search from input fields",
  "updateSpeed: How to use updateSpeed controls below console"]
class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      console: [],
      itemList: [],
      consoleVisible: true,
      consoleAutoScrollDown: false,
      consoleHistoryLength: 300,
      item: {
        name: "",
        type: ""
      },
      updateSpeed: 10
    }
    this.consoleScreen = React.createRef();
    this.itemName = React.createRef();
    this.itemType = React.createRef();
    this.updateSpeed = React.createRef();
  }

  componentDidUpdate() {
    this.scrollConsole()
  }

  componentDidMount() {
    this.setState({item: {
      name: this.itemName.current.value,
      type: this.itemType.current.value
    }})

    setTimeout(this.updateDataFromServer.bind(this), 1000*this.state.updateSpeed);
  }

  updateDataFromServer() {
    if(this.state.consoleAutoScrollDown) {this.getPoeJsonData('/getItem', this.state.item.name, this.state.item.type)}
    setTimeout(this.updateDataFromServer.bind(this), 1000*this.state.updateSpeed)
  }

  pushUpdateToConsole(data) {
    if(typeof(data) === typeof([])) {
      data.map( item => {
        this.setState({console: [...this.state.console, <pre key={Date.now()}>{JSON.stringify(data, null, "\t")}</pre>]})
        return true
      })
      this.scrollConsole()
    } else {
      this.setState({console: [...this.state.console, <pre key={Date.now()}>{JSON.stringify(data, null, "\t")}</pre>]})
      this.scrollConsole()
    }
  }

  scrollConsole(force) {
    if(this.state.consoleAutoScrollDown || force){this.consoleScreen.current.scrollTop += 5000}
  }

  createItemWithLinkedSockets(sockets) {
    sockets.map((socket, index)=>{
      return (
        <p key={index}>{socket.sColour}</p>
      )
    })
  }

  getPoeJsonData(urlSuffix, itemName, itemType) {
    this.pushUpdateToConsole("Fetching item data from server")
    fetch(url+urlSuffix, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
        },
        redirect: "follow",
        referrer: "no-referrer",
        body: JSON.stringify({itemName, itemType}),
    })
      .then( response => {return response.json()})
      .then( (data) => {
        if(data[0] === 'ERROR') {
          this.pushUpdateToConsole(data[1])
        } else {
          console.log(data)
          this.pushUpdateToConsole("Recieved item updates, list updated!")
          this.setState({itemList: data.result})
        }
      })
  }

  render() {
    return (
      <div>
        <div className="consoleContainer">
          <div
            className={this.state.consoleVisible ? "console" : "hidden"}
            ref={this.consoleScreen}
          >{this.state.console}</div>
          <input className="consoleInput" onKeyDown={(e)=>{
            if(e.keyCode === 13) {
              if(e.target.value === "searchItem") {this.getPoeJsonData('/getItem', this.state.item.name, this.state.item.type)}
              else if(e.target.value === "updateSpeed") {this.pushUpdateToConsole("Update speed controls, use < or > arrows to increase or decrease the speed {1 SEC * updateSpeed}")}
              else if(e.target.value === "help") {this.pushUpdateToConsole(consoleCommands)}
              else {this.pushUpdateToConsole('Unknown command use help for list of commands!')}
              e.target.value = ''
            }
          }} placeholder="Use help for commands..."></input>
          <button className="button left" onClick={()=>{this.setState({consoleAutoScrollDown: !this.state.consoleAutoScrollDown})}}>{this.state.consoleAutoScrollDown ? 'Fetching ❚❚' : 'Paused ▶' }</button>
          <button className="button speedUpdate leftSpeedButton" onClick={()=>{
            let speed = this.state.updateSpeed;
            if(speed > 2) {speed--}
            this.setState({updateSpeed: speed})
          }}>{"<"}</button>
          <input className="updateSpeed" ref={this.updateSpeed} readOnly placeholder={this.state.updateSpeed}></input>
          <button className="button speedUpdate rightSpeedButton" onClick={()=>{
            let speed = this.state.updateSpeed;
            if(speed < 15) {speed++}
            this.setState({updateSpeed: speed})
          }}>{">"}</button>
          <button className="button right" onClick={()=>{this.setState({consoleVisible: !this.state.consoleVisible})}}>{this.state.consoleVisible ? '▲' : '▼'}</button>
        </div>

        <div>
          <input ref={this.itemName} placeholder="Item Name" defaultValue="Sibyl's Lament"></input>
          <input ref={this.itemType} placeholder="Item Type" defaultValue="Coral Ring"></input>
          <button onClick={()=>{
            this.setState({item: {name: this.itemName.current.value, type: this.itemType.current.value}})
            this.pushUpdateToConsole("Querying new item: "+this.itemName.current.value+" "+this.itemType.current.value)
            this.scrollConsole(true)
          }}>Update name</button>
        </div>
        <h3 className="divinationNote">NOTE: For divination cards leave first field empty!</h3>

        <div className="itemListContainer">
          {this.state.itemList.map( (item, index) => {
            let newItem = item.item
            return (
              <div key={index}>
                <h2 className="itemTitle">#{index+1} {newItem.name} {newItem.typeLine}</h2>
                <ul className="itemPropertyContainer">
                  <li className="itemPrice">Price: {item.listing.price.amount} {item.listing.price.currency}</li>
                  <input className="itemWhisper" readOnly onClick={(e)=>{
                    e.preventDefault()
                    e.target.select()
                    document.execCommand("copy")
                    e.target.value = "Whisper copied to clipboard!"
                  }} value={item.listing.whisper}></input>
                  <li className="">{newItem.corrupted ? "Corrupted" : "Not Corrupted"}</li>
                  <li><ul>
                  <li>Implicit Mods:</li>
                  {newItem.implicitMods ? newItem.implicitMods.map((item, index)=>{
                    return <p key={index}>{item}</p>
                  }) : ''}
                  </ul></li>
                  <li><ul><li>Sockets:</li>
                  {newItem.sockets ? this.createItemWithLinkedSockets(newItem.sockets) : "No sockets"}
                  </ul></li>
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    );
  }
}

export default App;
