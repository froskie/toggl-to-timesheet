var parse = require('csv-parse/lib/sync');
var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var moment = require('moment');

// project and user name
var PROJECT_NAME = 'Lorem Ipsum';
var USER_NAME = 'Dolor Sit';

if (!argv.file || !argv.output) {
  console.log('Please specify path for file and output');
  return;
}

function readAndParseCSV(fileName, cb) {
  var props = null;
  var output = [];

  fs.readFile(__dirname + '/' + fileName, 'utf8', function(error, contents) {
    if (error) {
      console.log(error);
      return;
    }
    var parsed = parse(contents, {delimiter: ','});
    props = parsed.shift();

    for (var r = 0; r < parsed.length; r++) {
      var row = parsed[r];
      var obj = {}
      for (var p = 0; p < row.length; p++){
        obj[props[p]] = row[p];
      }
      output.push(obj);
    }
    cb(output);
  });
}

function outputCSV(tasksList) {
  var rows = [];
  var time = 0;
  rows.push('Date,Person,Project,Notes,Hours');
  for (var t = 0; t < tasksList.length; t++) {
    var task = tasksList[t];
    var row = [task.date, task.person, task.project, task.description, task.time];
    rows.push(row.join(','));
    time += parseFloat(task.time);
  }
  var filePath = __dirname + '/' + argv.output;
  fs.writeFile(filePath, rows.join('\n'), function(err) {
    if (err) {
      console.log(err);
      return;
    }
    console.log('File written: ' + filePath);
    console.log('Tasks: ' + (rows.length - 1));
    console.log('Time: ' + time + ' hours');
  });
}

function createTaskRow(row) {
  var time = {
    hour: null,
    minutes: null,
  };

  var duration = moment(row.Duration, 'hh:mm:ss');
  // start by rounding seconds
  if (duration.seconds() > 30) duration.add(1, 'minutes');

  // round minutes in quarters
  var minutes = duration.minutes();
  var rounded = Math.ceil(minutes/15);

  // add an hour if needed
  if (rounded === 4) {
    duration.add(1, 'hours');
    time.minutes = 0;
  } else {
    time.minutes = rounded*25;
  }
  time.hour = duration.hours();

  return {
    person: USER_NAME,
    project: PROJECT_NAME,
    date: row['Start date'],
    description: row.Description,
    time: time.hour + '.' + time.minutes
  };
}

function createTaskLists(data) {
  var output = [];
  for(var r = 0; r < data.length; r++) {
    var task = createTaskRow(data[r]);
    output.push(task);
  }
  outputCSV(output);
}

readAndParseCSV(argv.file, createTaskLists);
