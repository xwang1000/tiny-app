// Modules
const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const morgan = require('morgan');
const colors = require('colors')
const PORT = 8080;
const errors = [];

// Server init

var app = express();

// Middlewares

// Get POST body
app.use(bodyParser.urlencoded({extended: true}));

// Parse cookies
app.use(cookieParser());

// Set static assets folder
app.use(express.static('public'));

// Set view engine
app.set('view engine', 'ejs');

// Request logging
app.use(morgan('dev'))

// Database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "9sws9x": "http://www.dribbble.com",
  "daf923": "https://twitter.com/hellokitty"
};

app.use((req, res, next) => {
  res.locals = {
    username: req.cookies['username']
  }
  next()
});

// Set routes

app.get("/", (req, res) => {
  res.render('home');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString()
  urlDatabase[shortURL] = req.body.longURL
  res.redirect('/urls/' + shortURL);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new", {errors});
});

// take POST request and delete the corresponding record
app.get('/urls/:shortURL/delete', (req,res) => {
  const {shortURL} = req.params
  delete urlDatabase[shortURL]
  res.redirect('/urls')
})

app.get("/urls/:shortURL", (req, res) => {
  const {shortURL} = req.params
  const matchLongURL = urlDatabase[shortURL]

  // If going to an non-existent record
  if(matchLongURL === undefined) {
    errors.push(`The short url ${shortURL} does not exist.`)
    res.redirect('/urls/new')
    return 
  }
  let templateVars = { shortURL: req.params.shortURL, longURL: matchLongURL};
  res.render("urls_show", templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  const {longURL} = req.body;
  const {shortURL} = req.params;
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});

// Redirect any requests to "/u/:shortURL" to its longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});

app.post('/login', (req, res) => {
  const {username} = req.body;
  res.cookie('username', username);

  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username')
  res.redirect('/urls');
});

// Start server...

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

function generateRandomString() {
  return Math.random().toString(36).slice(6)
}
