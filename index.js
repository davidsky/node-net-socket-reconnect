'use strict';

var net= require('net')

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

module.exports= function()
{
	var args= normalizeConnectArgs(arguments)
	var socket= net.connect(args)

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
	var backlog= []
	var socketWrite
	
	function setWrite()
	{
		socketWrite= socket.write
		socket.write= function()
		{
			if( socket.writable )
				socketWrite.apply(socket, arguments)
			else
				backlog.push(arguments)
		}
	}
	setWrite()

	function reconnect(force)
	{
		setWrite()

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
		socket.emit('reconnectFailed', backlog)
	}
	
	function connect()
	{
		reconnectFailed= false
		previouslyConnected= true
		reconnectTries= 0
			
		setWrite()

		if( backlog.length )
		{
			var arr= Array.prototype.slice.call(backlog)
			backlog.length= 0
			for(var i= 0, len= arr.length; len>i; ++i)
				socket.write.apply(socket, arr[i])			
		}
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