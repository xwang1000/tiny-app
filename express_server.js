var express = require("express");
var app = express();
var PORT = 8080; // default port 8080

const errors = []

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "9sws9x": "http://www.dribbble.com",
  "daf923": "https://twitter.com/hellokitty"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  let templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
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
  let templateVars = { shortURL: req.params.shortURL, longURL: matchLongURL };
  res.render("urls_show", templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  const {longURL} = req.body
  const {shortURL} = req.params
  urlDatabase[shortURL] = longURL
  res.redirect('/urls')
})

// Redirect any requests to "/u/:shortURL" to its longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL)
});

app.use(express.static('public'))

function generateRandomString() {
  return Math.random().toString(36).slice(6)
}
