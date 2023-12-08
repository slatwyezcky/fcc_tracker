const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

dotenv.config();

// Define schema

mongoose.connect(process.env.MONGO_URI);

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: String,
  userid: String,
});

const Exercise = mongoose.model('exercise', exerciseSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ extended: false }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app
  .route('/api/users')
  .get(async function (req, res) {
    const users = await User.find();
    const response = users.map((user) => {
      return {
        _id: user._id,
        username: user.username,
      };
    });

    res.send(response);
  })
  .post(async function (req, res) {
    const { username } = req.body;
    const user = await User.create({
      username,
    });
    console.log(user);
    res.json({ username, _id: user._id });
  });

app.post('/api/users/:_id/exercises', async function (req, res) {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  const user = await User.findById(_id);
  const exercise = await Exercise.create({
    duration: parseInt(duration),
    description,
    date:
      date === '' ? new Date().toDateString() : new Date(date).toDateString(),
    userid: _id,
  });
  res.json({
    username: user.username,
    duration: exercise.duration,
    description: exercise.description,
    date: exercise.date,
    _id,
  });
});

app.get('/api/users/:_id/logs', async function (req, res) {
  const { _id } = req.params;
  const { from, to, limit } = req.query;
  const user = await User.findById(_id);
  let exercises = await Exercise.find({ userid: _id });

  if (from)
    exercises = exercises.filter(
      (el) => new Date(from).getTime() <= new Date(el.date).getTime()
    );
  if (to)
    exercises = exercises.filter(
      (el) => new Date(to).getTime() >= new Date(el.date).getTime()
    );
  if (limit) exercises = exercises.slice(0, limit);
  exercises = exercises.map((ex) => ({
    description: ex.description,
    duration: ex.duration,
    date: new Date(ex.date).toDateString(),
  }));
  res.send({
    username: user.username,
    count: exercises.length,
    _id,
    log: exercises,
  });
});

const listener = app.listen(process.env.PORT || 5000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
