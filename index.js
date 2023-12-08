const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

dotenv.config();

// Define schema

mongoose.connect(process.env.MONGO_URI);

const exerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: String,
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: [exerciseSchema],
});

const User = mongoose.model('User', userSchema);

const app = express();

app.use(cors());
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
  let { ':_id': _id, description, duration, date } = req.body;
  if (date === '') date = new Date().toDateString();
  const user = await User.findById(_id);
  user.log.push({
    duration: parseInt(duration),
    description,
    date: new Date(date).toDateString(),
  });
  user.save();
  res.json({
    username: user.username,
    description,
    duration: parseInt(duration),
    date: new Date(date).toDateString(),
    _id,
  });
});

app.get('/api/users/:_id/logs', async function (req, res) {
  const { _id } = req.params;
  const { from, to, limit } = req.query;
  const user = await User.findById(_id);
  let logs = user.log;
  if (from)
    logs = logs.filter(
      (el) => new Date(from).getTime() <= new Date(el.date).getTime()
    );
  if (to)
    logs = logs.filter(
      (el) => new Date(to).getTime() >= new Date(el.date).getTime()
    );
  if (limit) logs = logs.slice(0, limit);
  logs = logs.map((ex) => ({
    description: ex.description,
    duration: ex.duration,
    date: ex.date,
  }));
  res.json({
    username: user.username,
    count: logs.length,
    _id,
    log: logs,
  });
});

const listener = app.listen(process.env.PORT || 5000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
