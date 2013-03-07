
/*
	Public API
*/

exports.writeNumber = function(n)
{
// parse number into multiplier and remainder //
	var m = Math.floor(n/255);
	var r = n%255;
	console.log('sending to arduino ::', 1, m, r);
	sendToArduino(new Buffer([1, m, r]));
}

exports.setAnimation = function(n)
{
	console.log('sending to arduino ::', 2, n);
	sendToArduino(new Buffer([2, n]));
}

exports.setAutoMode = function(n)
{
	console.log('sending to arduino ::', 3, n);
	sendToArduino(new Buffer([3, n]));
}

/*
	Private Methods
*/

var arduino;
var socket = require('./socket_server');
var serialport = require('serialport');
var exec = require('child_process').exec;

var getArduinoPort = function(callback)
{
// attempt to detect an arduino connected to mac osx //
	exec('ls /dev/tty.*', function(error, stdout, stderr){
		var port;
		if (stdout){
			var ports = stdout.split('\n');
			for (var i = ports.length - 1; i >= 0; i--){
				if (ports[i].search('usbmodem') != -1 || ports[i].search('usbserial') != -1) port = ports[i];
			}
		}
		callback(port);
	});
}

/*
	Attempt to connect to Arduino
*/

getArduinoPort(function(port){
	if (port){
		attemptConnection(port);
		return;
	}	else{
		serialport.list(function (e, ports) {
		// find the port on the raspberry pi the arduino is connected to //
			ports.forEach(function(port) {
				for (var k in port) console.log('prop='+k, 'val='+port[k]);
				if (port.hasOwnProperty('pnpId')){
			// FTDI captures the duemilanove //
			// Arduino captures the leonardo //
					if (port.pnpId.search('FTDI') != -1 || port.pnpId.search('Arduino') != -1) {
						attemptConnection(port.comName);
						return;
					}
				}
			});
		});
	}
	console.log('* failed to find arduino : please check your connections *');
});

var attemptConnection = function(port)
{
	console.log('* attempting to connect to arduino at :', port, ' *');
	arduino = new serialport.SerialPort(port, { baudrate: 9600, parser: serialport.parsers.readline("\n") });
	arduino.on("open", function () {
		console.log('* connection to arduino successful ! *');
		arduino.on('data', function(data){
		// send incoming data from arduino out to the socket server //
			socket.onDataFromArduino(data);
		});
	});
}

var sendToArduino = function(buffer)
{
// calling write if an arduino is not connected will crash the server! //
	if (arduino){
		arduino.write(buffer, function(e, results) {
			if (e) {
				console.log('error :: ' + e);
			}	else{
			//	console.log('message successfully sent');
			}
		});
	}
}
