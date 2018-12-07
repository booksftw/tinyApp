var express = require("express");
// const cookieParser = require("cookie-parser");
var cookieSession = require('cookie-session')

var app = express();
var PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');


app.use(bodyParser.urlencoded({extended: true}) );
// app.use(cookieParser());
app.use(cookieSession({
	name: 'session',
	keys: ['key1', 'key2'],
	// Cookie Options
	maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.set("view engine", "ejs");

// "user_id": {
// 	'userRandomId': ['shortUrl1, shortUrl2],
// 		'userRandomId2': ['shortUrl1'],
// }

//
// @@@@@@@@@@@@@@@@@@@@@ JUST UPDATED urlDatabase.longURL ad urlDAtabase.user_id
//
var urlDatabase = {
	"b2xVn2": {
		longUrl: "http://www.lighthouselabs.ca",
		user_id: 'test',
	},
	"9sm5xK": {
		longUrl: "http://www.google.com",
		user_id: 'userRandomID',
	}
};

const users = {
	"userRandomID": {
		id: "userRandomID",
		email: "user@example.com",
		password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
	},
	"user2RandomID": {
		id: "user2RandomID",
		email: "user2@example.com",
		password: bcrypt.hashSync("dishwasher-funk", 10)
	},
	"test": {
		id: "test",
		email: "test@test.com",
		password: bcrypt.hashSync("test", 10)
	},
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
	let userObj = null;
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
	const userObj = getUserObj(username);
	console.log(username, 'USERNAME');
	console.log(password,'PASSWORD');
	console.log(userObj,'USER OBJ');


    if (!userObj) {
    	return res.status(403).send('Email cannot be found');
	}

	const passwordMatchesEncryption = bcrypt.compareSync(password,userObj.password);
    console.log(passwordMatchesEncryption ,'pass match encrypt');
    // check encrypt password by encrypting the plain text
    if (passwordMatchesEncryption) {
    	// set user_id cookie with the matching user's random id and redirect /
		// res.cookie('user_id',userObj.id);
		req.session.user_id = userObj.id;
		return res.redirect('/')
	} else {
    	return res.status(403).send("Password doesn't match");
	}
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
		username: req.session.user_id
	};
	res.render("urls_register", templateVars);
});

// "user2RandomID": {
// 	id: "user2RandomID",
// 		email: "user2@example.com",
// 		password: "dishwasher-funk"
// }


app.post('/register', (req, res) => {
	const userRandomId = generateRandomString();
	const newEmail        = req.body.email;
	const newPassword     = req.body.password;
	const encryptPassword = bcrypt.hashSync(newPassword, 10);
	console.log(encryptPassword, 'encrypted passw'); // end last q of passw encrypt

	let emailExists = getUserObj(newEmail);

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
		password: encryptPassword
	};
	// console.log(users, '<<<<<<<<<<<<<<');
	// res.cookie('user_id', userRandomId);
	// console.log()
	req.session.user_id = userRandomId;
	res.redirect('/urls');
	// console.log('Registered User', users);
});

// var urlDatabase = {
// 	"b2xVn2": {
// 		longUrl: "http://www.lighthouselabs.ca",
// 		user_id: 'test',
// 	},
// 	"9sm5xK": {
// 		longUrl: "http://www.google.com",
// 		user_id: 'userRandomID',
// 	}
//
// };
app.post("/urls", (req, res) => {
	var formLongSubmission = req.body.longURL;
	var shortUrl           = generateRandomString();
	var userId             = req.session.user_id;
	urlDatabase[shortUrl] = {
		longUrl: formLongSubmission,
		user_id: userId
	};
	// urlDatabase[shortUrl].user_id = shortUrl;
	console.log(urlDatabase, '<<<<<< URL DATABASE');

	let templateVars = { urls: urlDatabase, username: req.session.user_id };
	res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
	console.log(req.session.user_id);
	let isAuthenticated = null;

    if ( !(req.session.user_id == null) ) {
    	isAuthenticated = req.session.user_id; // Read the cookie
	}  else {
    	isAuthenticated = false;
    	return res.redirect('/login');
	}

	const templateVars = {username: req.session.user_id, isAuthenticated: isAuthenticated};
	console.log(isAuthenticated, 'isAuthenticated');

	generateRandomString();
	res.render("urls_new", templateVars);
});

app.get("/urls", (req, res) => {
	let templateVars = {
		urls: urlDatabase,
		username: req.session.user_id
	};
	res.render("urls_index", templateVars);
});


// var urlDatabase = {
// 	"b2xVn2": {
// 		longUrl: "http://www.lighthouselabs.ca",
// 		user_id: 'test',
// 	},
// 	"9sm5xK": {
// 		longUrl: "http://www.google.com",
// 		user_id: 'userRandomID',
// 	}
// };

app.get("/urls/:id", (req, res) => {
	console.log(req.params.id);
	console.log(urlDatabase[req.params.id].longUrl);
	let templateVars = {
		shortURL: req.params.id,
		longURL: urlDatabase[req.params.id].longUrl,
        username: req.session.user_id
	};
	res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  let newLongUrl = req.body.updateLongUrl;
  console.log(newLongUrl);
  urlDatabase[req.params.id].longUrl = newLongUrl;
  console.log(urlDatabase, 'URL DATABASE UPDATE');
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
	console.log(req.params.shortURL);
	let shortURL = req.params.shortURL;
	let longURL = urlDatabase[shortURL].longUrl;
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