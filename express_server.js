// Modules
const express = require("express")
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser")
const morgan = require('morgan')
const colors = require('colors')
const PORT = 8080
const errors = []

// Server init

var app = express()

// Middlewares

// Get POST body
app.use(bodyParser.urlencoded({extended: true}))

// Parse cookies
app.use(cookieParser())

// Set static assets folder
app.use(express.static('public'))

// Set view engine
app.set('view engine', 'ejs')

// Request logging
app.use(morgan('dev'))

const isAuthenticated = (req, res, next) => {
  if (req.cookies.user) {
    next()
  } else {
    res.redirect('/login')
  }
}

// Database

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", shortURL: "b6UTxQ", userID: "user13f" },
  i3BoGr: { longURL: "https://www.google.ca", shortURL: "i3BoGr", userID: "user13f" },
  daffdk: { longURL: "http://www.dribbble.com", shortURL: "daffdk", userID: 'user345'},
  daf923: { longURL: "https://twitter.com/hellokitty", shortURL: "daf923", userID: 'user345'}
}

const users = { 
  "user13f": {
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
})

// Set routes

app.get("/", (req, res) => {
  res.render('home')
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase)
})

// Protect the route using middleware
app.get("/urls", isAuthenticated, (req, res) => {
  res.render('urls_index', {
    urls: getVisibleUrls(req.cookies.user.id),
    user: req.cookies.user
  })
})

// Needs revision -> creating new url form
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString()
  urlDatabase[shortURL] = {
    longURL: req.body.longURL, 
    userID: req.cookies.user.id
  }
  res.redirect('/urls/' + shortURL)
})

app.get("/urls/new", (req, res) => {
  const {user} = req.cookies
  if (user) {
    res.render("urls_new", {errors})
  } else {
    res.redirect('/login')
  }
})

// take POST request and delete the corresponding record
app.get('/urls/:id/delete', (req,res) => {
  const {id} = req.params
  delete urlDatabase[id]
  res.redirect('/urls')
})

app.get("/urls/:id", (req, res) => {
  const {id} = req.params
  const matchLongURL = urlDatabase[id].longURL

  // If going to an non-existent record
  if(matchLongURL === undefined) {
    errors.push(`The short url ${id} does not exist.`)
    res.redirect('/urls/new')
    return 
  }
  let templateVars = { shortURL: id, longURL: matchLongURL}
  res.render("urls_show", templateVars)
})

app.post('/urls/:shortURL', (req, res) => {
  const {longURL} = req.body
  const {id} = req.params
  urlDatabase[id].longURL = longURL
  res.redirect('/urls')
})

// Redirect any requests to "/u/:shortURL" to its longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL
  res.redirect(longURL)
})

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
})

app.post('/logout', (req, res) => {
  res.clearCookie('user')
  res.redirect('/urls')
})

app.get('/register', (req, res) => {
  res.render('register')
})

app.post('/register', (req, res) => {
  const {email, password} = req.body

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
  const newId = getUId()
  // add user
  users[newId] = {
    id: newId,
    email,
    password
  }
  // set cookie
  res.cookie('user', users[newId])
  res.redirect('/urls')
})

// Start server...

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`)
})

const generateRandomString = () => {
  return Math.random().toString(36).slice(6)
}
 
let id = 0
const getUId = () => {
  return id++
}

const isEmailExisiting = email => {
  for (const userId in users) {
    if (users.hasOwnProperty(userId) && email === users[userId].email) {
      return true
    }
  }
  return false
}

const getUserByEmail = email => {
  for (const userId in users) {
    if (users.hasOwnProperty(userId) && email === users[userId].email) {
      return users[userId]
    }
  }
  return undefined
}

// Could be more eloquent using Array.reduce()
// Look up with given userID, return a list of visible url objects
const getVisibleUrls = userID => {
  const visibleUrls = []
  for (const urlID in urlDatabase) {
    if (urlDatabase.hasOwnProperty(urlID) && userID === urlDatabase[urlID].userID) {
      visibleUrls.push(urlDatabase[urlID])
    }
  }
  return visibleUrls
}