# net-reconnect
Makes net.connect() and net.createConnection() auto reconnect.
## Usage
```js
var reconnect= require('net-socket-reconnect')
var client= reconnect({port: 8080, reconnectInterval: 150}) // no change to original API
```
## Options
* __`reconnectOnError`__ reconnect on 'error', default false
* __`reconnectOnEnd`__ reconnect on 'end', default false
* __`reconnectOnClose`__ reconnect on 'close', default true
* __`reconnectOnTimeout`__ reconnect on 'timeout', default false
* __`reconnectOnCreate`__ reconnect after initial connect failed, default false
* __`reconnectInterval`__ interval between tries, default 300
* __`reconnectTimes`__ max retries, default 50

> __note__: 50 * 300= 15,000. That's 15 seconds of retrying and then giving up with `reconnectFailed` event

## Methods
Except the original events, there's a few new ones:
* __`client.reconnect()`__  ends current connection and reconnects; or simple reconnects if you set all auto reconnect options to false (and decided to deal with it manually)
* __`client.stopReconnect()`__ stops any further reconnect actions
* __`client.startReconnect()`__ restarts reconnect
* __`client.getReconnect()`__ get current reconnect state: true/on, or false/off

## Events
Except the original events, there's a two new ones:
* __`reconnect`__ when successfuly reconnected
* __`reconnectFailed`__ when reconnect reached reconnectTimes 

> __important__: every successful reconnect will also emit __`'connect'`__ event by net.Socket, so plan your client.on('connect', function(){}) callbacks

## Installation
```
npm install net-socket-reconnect
```
---
MIT License