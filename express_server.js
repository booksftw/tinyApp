var express = require("express");
const cookieParser = require("cookie-parser");

var app = express();
var PORT = 8080; // default port 8080
const bodyParser = require("body-parser");


app.use(bodyParser.urlencoded({extended: true}) );
app.use(cookieParser());
app.set("view engine", "ejs");

var urlDatabase = {
	"b2xVn2": "http://www.lighthouselabs.ca",
	"9sm5xK": "http://www.google.com"
};

function generateRandomString() {
	var randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15).substring(0,6);
	var randomSixCharString = randomString.substring(0,6);
	console.log("howdy");
	console.log(randomSixCharString, "RANDOM STRING");
	return randomSixCharString;
}

app.post("/login", (req, res)  => {
    console.log(req.body.username);
    const username = req.body.username;
	res.cookie('username',  username);
	res.redirect('/urls')
});

app.post('/logout', (req, res)  => {
    console.log("LOGOUT CLEAR MY COOKIE");
    // console.log(res.clearCookie('username'));
    res.clearCookie('username');
    res.redirect('/urls')
});

app.get("/", (req, res) => {
	res.send("Helloszz!");
});

app.get("/urls.json", (req, res) => {
	res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
	// res.send("<html><body>Hello <b>World</b></body></html>\n");
	let templateVars = { greeting: "Hello World!" };
	res.render("hello_world", templateVars);
});

app.get("/urls", (req, res) => {
	let templateVars = {
	  urls: urlDatabase,
      username: req.cookies.username
	};
	res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
	var formLongSubmission = req.body.longURL;
	var shortUrl           = generateRandomString();
	urlDatabase[shortUrl] = formLongSubmission;

	let templateVars = { urls: urlDatabase };
	res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    const templateVars = {username: req.cookies.username}
	generateRandomString();
	res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
	let templateVars = {
		shortURL: req.params.id,
		longURL: urlDatabase[req.params.id],
        username: req.cookies.username
	};
	res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  let newLongUrl = req.body.updateLongUrl;
  console.log(newLongUrl);
});

app.get("/u/:shortURL", (req, res) => {
	console.log(req.params.shortURL);
	let shortURL = req.params.shortURL;
	let longURL = urlDatabase[shortURL];
	res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
	console.log("POST DELETE REQUEST");
	// Delete a resource from the database
	let shortUrlKey = req.params.id;
	delete urlDatabase[shortUrlKey];
	res.redirect("/urls");

});

app.listen(PORT, () => {
	console.log(`Example app listening on port ${PORT}!`);
});