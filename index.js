'use strict';

var net= require('net')
var netConnect= net.connect

// from joyent/node/lib/net.js
function normalizeConnectArgs(args)
{
	if( typeof args[0]==='object' && args[0]!==null )
		return args[0]
	else if( typeof args[0]==='string' && !(Number(args[0]) >= 0) )
		return {path: args[0]}
	var options= {port: args[0]}
	if( typeof args[1]==='string' )
		options.host= args[1]
	return options
}

net.connect= net.createConnection= function()
{
	var args= normalizeConnectArgs(arguments)
	var socket= netConnect.apply(null, args)

	var reconnectOnError= args.reconnectOnError || false
	var reconnectOnEnd= args.reconnectOnEnd || false
	var reconnectOnClose= args.reconnectOnClose || true
	var reconnectOnTimeout= args.reconnectOnTimeout || false
	var reconnectOnCreate= args.reconnectOnCreate || false
	var reconnectInterval= args.reconnectInterval || 300
	var reconnectTimes= args.reconnectTimes || 20

	var previouslyConnected= false
	var reconnectFailed= false
	var reconnectTries= 0
	var canReconnect= true
	var reconnecting
	
	function reconnect(force)
	{
		if( !previouslyConnected && !reconnectOnCreate )
			return
		if( !force && !canReconnect )
			return
		if( !force && socket.writable )
			return
		if( reconnecting )
			return
		if( !force && ++reconnectTries > reconnectTimes )
			return fail()
		
		if( socket.writable && force )
			socket.end()

		socket.emit('reconnect')

		reconnecting= setTimeout(function(){
			socket.connect(args)
			reconnecting= 0
		}, reconnectInterval)
	}
	
	function fail()
	{
		if( reconnectFailed )
			return
		reconnectFailed= true
		socket.stopReconnect()
		socket.emit('reconnectFailed')
	}
	
	function connect()
	{
		reconnectFailed= false
		previouslyConnected= true
		reconnectTries= 0
	}

	socket.getReconnect= function(){
		return canReconnect
	}

	socket.stopReconnect= function()
	{
		clearTimeout(reconnecting)
		reconnecting= 0
		canReconnect= false
	}

	socket.reconnect= function(){
		reconnect(true)
	}

	socket.startReconnect= function(){
		canReconnect= true
		reconnecting= 0
		reconnect(true)
	}

	socket.on('connect', connect)
	function reconnectOnEvent(){reconnect()}
	if( reconnectOnEnd )
		socket.on('end', reconnectOnEvent)
	if( reconnectOnClose )
		socket.on('close', reconnectOnEvent)
	if( reconnectOnError )
		socket.on('error', reconnectOnEvent)
	if( reconnectOnTimeout )
		socket.on('timeout', reconnectOnEvent)

	return socket
}