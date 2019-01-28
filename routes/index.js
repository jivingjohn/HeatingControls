var express = require('express');
var router = express.Router();

var urlencodedParser = express.urlencoded({
  extended: true
});

// Load the Amazon SDK
var AWS = require('aws-sdk');
// Set the region
AWS.config.update({region: 'eu-west-2'});

// Page title
var pageTitle = 'Milton Avenue Heating Controls' ;
var welcomeMessage = 'Click to turn the heating on or off' ;

// Cloudwatch graph for homepage
var widgetDefinitionToSend = {
  MetricWidget: JSON.stringify({
    view: "timeSeries",
    stacked: false,
    metrics: [
        [ "House/Temperature", "Temperature", "Degrees", "Celcius" ]
    ],
    region: "eu-west-2",
    title: "House Temperature"
  })
} ;

/* GET home page. */
router.get('/', function(req, res, next) {
  getWidget(widgetDefinitionToSend, function(err, response) {
    if (err) {
      console.log(err);
      res.send(err);
    }
    //res.contentType('image/png');
    res.render('index', { title: pageTitle, pageMessage: welcomeMessage, graph: response });
  }) ;

});

// turn the heating on
router.post('/On', function(req, res, next) {
  // Create an SQS service object
  var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
  var params = {
   DelaySeconds: 1,
   MessageAttributes: { },
   MessageBody: "On",
   QueueUrl: "https://sqs.eu-west-2.amazonaws.com/379526675714/HeatingStatus"
  };

  sqs.sendMessage(params, function(err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data.MessageId);
    }
  });
  // Just show the index page again
  res.redirect('/');
});

// turn the heating off
router.post('/Off', function(req, res, next) {
  // Create an SQS service object
  var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
  var params = {
   DelaySeconds: 1,
   MessageAttributes: { },
   MessageBody: "Off",
   QueueUrl: "https://sqs.eu-west-2.amazonaws.com/379526675714/HeatingStatus"
  };

  sqs.sendMessage(params, function(err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data.MessageId);
    }
  });
  // Just show the index page again
  res.redirect('/');
}) ;

// set the temperature we want it to be
router.post('/Temperature', urlencodedParser, (req, res) => {
  console.log(req.body.Temperature);
  var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
  var params = {
   DelaySeconds: 1,
   MessageAttributes: { },
   MessageBody: req.body.Temperature,
   QueueUrl: "https://sqs.eu-west-2.amazonaws.com/379526675714/HeatingTemperature"
  };

  sqs.sendMessage(params, function(err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data.MessageId);
    }
  });

  // Just show the index page again
  res.redirect('/');
}) ;

// request Cloudwatch graph
router.post('/Graph', urlencodedParser, (req, res) => {
  getWidget(widgetDefinitionToSend, function(err, response) {
    if (err) {
      console.log(err);
      res.send(err);
    }
    //res.contentType('image/png');
    res.render('graph', { graph: response });
  }) ;
});

// https://github.com/aws-samples/aws-cloudwatch-building-dashboard-outside-aws-console/blob/master/server/server.js
getWidget = function(widgetDefinition, callback) {

    var cloudWatch = new AWS.CloudWatch({apiVersion: '2010-08-01'});

     cloudWatch.getMetricWidgetImage(widgetDefinition, function (err, data) {
        if (err) {
          console.log('error is here') ;
          console.log(err, err.stack); // an error occurred
        } else {
            console.log(data.MetricWidgetImage);           // successful response
            var response = new Buffer(data.MetricWidgetImage).toString('base64');
            // send back an image stream that can be rendered
            callback(err, response);
        }
    });
} ;

module.exports = router;
