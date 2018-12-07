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

const users = {
	"userRandomID": {
		id: "userRandomID",
		email: "user@example.com",
		password: "purple-monkey-dinosaur"
	},
	"user2RandomID": {
		id: "user2RandomID",
		email: "user2@example.com",
		password: "dishwasher-funk"
	}
};

function generateRandomString() {
	var randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15).substring(0,6);
	var randomSixCharString = randomString.substring(0,6);
	console.log("howdy");
	console.log(randomSixCharString, "RANDOM STRING");
	return randomSixCharString;
}

app.get('/login', (req, res) => {
	res.render('urls_login');
});

function getUserObj(email){
	let userObj;
	for(let x in users){
		const existingEmail = users[x].email;
		if (existingEmail == email) {
			console.log('found a match');
			console.log(userObj);
			userObj = users[x];
		}
	}
	return userObj
}

app.post("/login", (req, res)  => {
    console.log(req.body);
    const username = req.body.email;
    const password = req.body.password;
    const userExists = checkIfUserExists(username);
    if (!userExists) {
    	res.status(403).send('Email cannot be found');
	}
	const userObj = getUserObj(username);

    if (userObj.password == password) {
    	// set user_id cookie with the matching user's random id and redirect /
		res.cookie('user_id',userObj.id);
		res.redirect('/')
	} else {
    	res.status(403).send("Password doesn't match");
	}

	res.cookie('user_id',  username_id);
	res.redirect('/urls')
});

app.get('/logout', ( req, res ) => {
	res.clearCookie('user_id')
	res.send('logged out');
});

app.post('/logout', (req, res)  => {
    console.log("LOGOUT CLEAR MY COOKIE");
    // console.log(res.clearCookie('username'));
	res.clearCookie('user_id');
    res.redirect('/urls');
});

app.get("/", (req, res) => {
	res.send("Hellos!");
});

app.get("/urls.json", (req, res) => {
	res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
	// res.send("<html><body>Hello <b>World</b></body></html>\n");
	let templateVars = { greeting: "Hello World!" };
	res.render("hello_world", templateVars);
});

app.get('/register', ( req , res ) => {
	console.log('register');
	let templateVars = {
		urls: urlDatabase,
		username: req.cookies.user_id
	};
	res.render("urls_register", templateVars);
});

// "user2RandomID": {
// 	id: "user2RandomID",
// 		email: "user2@example.com",
// 		password: "dishwasher-funk"
// }
function checkIfUserExists(newEmail) {
	let emailExists = false;
	for(let x in users){
		console.log(users[x].email);
		const existingEmail = users[x].email;
		if (existingEmail == newEmail) {
			console.log('Email Exists');
			emailExists = true;
		}
	}
	return emailExists
}

app.post('/register', (req, res) => {
	const userRandomId = generateRandomString();
	const newEmail        = req.body.email;
	const newPassword     = req.body.password;
	let emailExists = checkIfUserExists(newEmail);

	if ( (newEmail.length <= 0 || newPassword.length <= 0) ){
		console.log('status 400 send');
		res.status('400').send('Error Nothing Entered');
	} else if (emailExists) {
		// If email exists in object thn send bac 404
		res.status('400').send("Error Email Entered Exists in Database");
	}

	users[userRandomId] = {
		id: userRandomId,
		email: newEmail,
		password: newPassword
	};
	res.cookie('user_id', userRandomId);
	res.redirect('/urls');
	// console.log('Registered User', users);
});

app.get("/urls", (req, res) => {
	let templateVars = {
	  urls: urlDatabase,
      username: req.cookies.user_id
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
    const templateVars = {username: req.cookies.user_id}
	generateRandomString();
	res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
	let templateVars = {
		shortURL: req.params.id,
		longURL: urlDatabase[req.params.id],
        username: req.cookies.user_id
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