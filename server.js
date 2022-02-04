const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const Users = require('./models/userModel');
const Exercises = require('./models/exerciseModel');

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.route('/api/users')
  .get(async (req, res) => {
    try {
      const users = await Users.find().select('username _id').exec();
      return res.json(users);
    } catch (err) {
      console.log(err);
    }
  })
  .post(async (req, res) => {
    try {
      const { username, _id } = await Users.create({ username: req.body.username });
      return res.json({
        'username': username,
        '_id': _id
      });
    } catch (err) {
      console.log(err);
    }
  });

app.post('/api/users/:_id/exercises', async (req, res) => {
  let { description, duration, date } = req.body;
  let { _id } = req.params;

  if (date) date = new Date(date).toDateString();
  else date = undefined;

  try {
    const exercise = await Exercises.create({ description, duration, date });
    let user = await Users.findById(_id);

    user.exercises.push(exercise._id);
    await user.save();

    return res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
      _id: user._id
    });
  } catch (err) {
    console.log(err);
  }
});

app.get('/api/users/:_id/logs', function (req, res, next) {
  let { _id } = req.params;

  const userLogs = function (done) {
    Users.findById(_id)
      .select('-__v')
      .populate('exercises')
      .exec(function (err, logs) {
        if (err) return done(err);
        done(null, logs);
      });
  }

  userLogs(function (err, logs) {
    if (err) res.json(err);

    let { username, _id, exercises } = logs;
    let userLogs = {
      username,
      count: exercises.length,
      _id,
      log: exercises.map(e => {
        return {
          description: e.description,
          duration: e.duration,
          date: e.date
        }
      })
    };
    req.userLogs = userLogs;
    next();
  });
}, function (req, res) {
  let { from, to, limit } = req.query;
  limit = parseInt(limit);
  let userLogs = req.userLogs;

  if (from) {
    userLogs.log = userLogs.log.filter(l => new Date(l.date).toISOString().slice(0, 10) >= from);
  }
  if (to) {
    userLogs.log = userLogs.log.filter(l => new Date(l.date).toISOString().slice(0, 10) <= to);
  }
  if (limit) {
    userLogs.log = userLogs.log.slice(0, limit);
  }
  res.json(userLogs);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
