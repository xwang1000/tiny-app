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

const users = { 
  "user23f": {
    id: "user13f", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2134": {
    id: "user2134", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  },
  'user345': {
    id: 'user345',
    email: 'test@test.com',
    password: 'test'
  }
}

app.use((req, res, next) => {
  res.locals = {
    user: req.cookies['user']
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

app.get('/login', (req, res) => {
  res.render('login')
})

app.post('/login', (req, res) => {
  const {email, password} = req.body

  // find user using email
  const currentUser = getUserByEmail(email)

  if(!currentUser) {
    res.status(403).send(`Cannot find user registered with ${email}.`)
  } else {
    // check if the input password === user.password
    if (password === currentUser.password) {
      res.cookie('user', currentUser)
      res.redirect('/urls')
    } else {
      res.status(403).send('Wrong password.')
    }
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('user')
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  const {email, password} = req.body;

  // handling empty entries
  if (email === '' || password === '') {
    res.status(400).send('Empty email or password field. Please fill them up.')
    next()
  }

  // handling existing entries
  if (isEmailExisiting(email)) {
    res.status(400).send('This email already exists.')
    next()   
  }
  const newId = getRandomId();
  // add user
  users[newId] = {
    id: newId,
    email,
    password
  }
  // set cookie
  res.cookie('user', users[newId])
  res.redirect('/urls')
});

// Start server...

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

const generateRandomString = () => {
  return Math.random().toString(36).slice(6)
}
 
const getRandomId = () => {
  return Math.random().toString(36).slice(5)
}

const isEmailExisiting = email => {
  for (const userId in users) {
    if (users.hasOwnProperty(userId) && email === users[userId].email) {
      return true
    }
  }
  return false;
}

const getUserByEmail = email => {
  for (const userId in users) {
    if (users.hasOwnProperty(userId) && email === users[userId].email) {
      return users[userId]
    }
  }
  return undefined
}
