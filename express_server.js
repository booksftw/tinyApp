var express = require("express");
var cookieSession = require('cookie-session');
const methodOverride = require('method-override');

var app = express();
var PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: true}) );
app.use(cookieSession({
	name: 'session',
	keys: ['key1', 'key2'],
	maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(methodOverride('_method'));
app.set("view engine", "ejs");

//
// LEFT OFF: Included clickTimestamp property
// Update this in /track
// Use the clickTime steamp data to figgure out the other requirements

// Default accounts & urls
var urlDatabase = {
	"b2xVn2": {
		longUrl: "http://www.lighthouselabs.ca",
		user_id: 'test',
	},
	"9sm5xK": {
		longUrl: "http://www.google.com",
		user_id: 'userRandomID',
	},
	"daksjhdjkashdakjs": {
		longUrl: "http://www.googlez.com",
		user_id: 'user2RandomID',
	},
	"test9sm": {
		longUrl: "http://www.stoichustle.com",
		user_id: 'test',
		clickTimestamp: {
			'userId': [500,300,700],
			'userId2': [600]
		},
		// getTotalClickCount: function() {
		// 	let totalClicks = 0;
		// 	for(let propKey in this.clickTimestamp) {
		// 		totalClicks += this.clickTimestamp[propKey].length;
		// 	}
		// 	return totalClicks
		// },
		// getUniqueVisitorCount: function () {
		// 	let count = 0;
		//
		// 	for(let propKey in this.clickTimestamp) {
		// 		count ++;
		// 	}
		// 	return count;
		// }
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

	return randomSixCharString;
}

app.get('/login', (req, res) => {
	let seshUserId = req.session.user_id;
	if (!req.session.user_id){
		seshUserId = null;
	}
	let templateVars = {
		urls: urlDatabase,
		username: seshUserId
	};
	res.render('urls_login', templateVars);
});

function getUserObj(email){
	let userObj = null;
	for(let x in users){
		const existingEmail = users[x].email;
		if (existingEmail === email) {
			userObj = users[x];
		}
	}
	return userObj
}

app.post("/login", (req, res)  => {
    const username = req.body.email;
    const password = req.body.password;
	const userObj = getUserObj(username);

    if (!userObj) {
    	return res.status(403).send('Email cannot be found');
	}

	const passwordMatchesEncryption = bcrypt.compareSync(password,userObj.password);
    if (passwordMatchesEncryption) {
		req.session.user_id = userObj.id;
		return res.redirect('/')
	} else {
    	return res.status(403).send("Password doesn't match");
	}
});

app.get('/logout', ( req, res ) => {
	res.clearCookie('session');
	res.clearCookie('session.sig');
	res.session = null;
	res.send('logged out');
});

app.post('/logout', (req, res)  => {
	res.clearCookie('user_id');
    res.redirect('/urls');
});

app.get("/", (req, res) => {
	res.send("Hellos!");
});

app.get("/urls.json", (req, res) => {
	res.json(urlDatabase);
});

function updateTrackingData(shortUrl, visitorId) {
	const urlObj = urlDatabase[shortUrl];
	let date = new Date();
	let timestamp = date.getTime();

	if (shortUrl === null) return 0;

	// Initialize and add timestamps.
	if ( visitorId ) {
		//Update time stamp
		// if ( typeof(urlObj.clickTimestamp) === 'undefined' ) {
		if ( !urlObj.hasOwnProperty('clickTimestamp') ) {
			console.log('intializing');
			// initialize the array and add first element
			urlObj.clickTimestamp = {
				[visitorId]: [timestamp]
			};

			// Initialize methods to get data from urlObj
			urlObj.getTotalClickCount = function(){
				let totalClicks = 0;
				for(let propKey in this.clickTimestamp) {
					totalClicks += this.clickTimestamp[propKey].length;
				}
				return totalClicks
			};
			urlObj.getUniqueVisitorCount = function() {
				let count = 0;
				for(let propKey in this.clickTimestamp) {
					count ++;
				}
				return count;
			}

		}  else {
			// push
			console.log('pushing' , timestamp);
			// console.log(urlObj.clickTimestamp[visitorId]);
			if (urlObj.clickTimestamp.hasOwnProperty(visitorId)){
				urlObj.clickTimestamp[visitorId].push(timestamp);
			}  else {
				// Hotfix for conflict
				// Intialize if weird multiaccount thing happens
				urlObj.clickTimestamp[visitorId] = [timestamp];
				// Initialize methods to get data from urlObj
				urlObj.getTotalClickCount = function(){
					let totalClicks = 0;
					for(let propKey in this.clickTimestamp) {
						totalClicks += this.clickTimestamp[propKey].length;
					}
					return totalClicks
				};
				urlObj.getUniqueVisitorCount = function() {
					let count = 0;
					for(let propKey in this.clickTimestamp) {
						count ++;
					}
					return count;
				}
			}

		}
	}
	console.log(urlObj,'<<<<<<<<<<<<<<<<<url obj');
	console.log(urlDatabase);
	console.log('')
	console.log(urlDatabase[shortUrl].getTotalClickCount() , ' TOTAL CLICK COUNT');
	console.log(urlDatabase[shortUrl].getUniqueVisitorCount() , ' UNIQUE VISITOR COUNT');

}

app.get('/track', (req, res) => {
	let visitorId = req.session.user_id? req.session.user_id : null;
	// let longUrl = req.query.longUrl;
	let shortUrl = req.query.shortUrl? req.query.shortUrl : null;
	updateTrackingData(shortUrl, visitorId);

	res.send('Track catched, redirecting to longUrl...');
});

app.get("/hello", (req, res) => {
	let templateVars = { greeting: "Hello World!" };
	res.render("hello_world", templateVars);
});

app.get('/register', ( req , res ) => {
	let templateVars = {
		urls: urlDatabase,
		username: req.session.user_id
	};
	res.render("urls_register", templateVars);
});

app.post('/register', (req, res) => {
	const userRandomId = generateRandomString();
	const newEmail        = req.body.email;
	const newPassword     = req.body.password;
	const encryptPassword = bcrypt.hashSync(newPassword, 10);
	let emailExists = getUserObj(newEmail);

	if ( (newEmail.length <= 0 || newPassword.length <= 0) ){
		res.status('400').send('Error Nothing Entered');
	} else if (emailExists) {
		res.status('400').send("Error Email Entered Exists in Database");
	}

	users[userRandomId] = {
		id: userRandomId,
		email: newEmail,
		password: encryptPassword
	};

	req.session.user_id = userRandomId;
	res.redirect('/urls');
});

app.post("/urls", (req, res) => {
	const formLongSubmission = req.body.longURL;
	const shortUrl = generateRandomString();
	const userId = req.session.user_id;

	urlDatabase[shortUrl] = {
		longUrl: formLongSubmission,
		user_id: userId
	};

	let templateVars = { urls: urlDatabase, username: req.session.user_id };
	res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
	let theUserId = req.session.user_id;

    if ( !(req.session.user_id == null) ) {
		theUserId = req.session.user_id; // Read the cookie
	}  else {
		theUserId = null;
    	return res.redirect('/login');
	}

	const templateVars = {username: theUserId};

	generateRandomString();
	res.render("urls_new", templateVars);
});

app.get("/urls", (req, res) => {
	let seshUserId = req.session.user_id;

	if (!req.session.user_id){
		seshUserId = null;
	}
	let templateVars = {
		urls: urlDatabase,
		username: seshUserId
	};
	res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
	const shortUrl = req.params.id;
	console.log(shortUrl, 'short url');
	let totalClickCount = 0;
	let uniqueVisitorCount = 0;
	console.log(urlDatabase);

	if (urlDatabase[shortUrl].hasOwnProperty('getTotalClickCount') ){
		console.log('IT HAS THE FUNCTION METHOD Click count')
		totalClickCount = urlDatabase[shortUrl].getTotalClickCount();
	}  else {
		console.log(' IT DOESN"T HAE IT');
	}

	if (urlDatabase[shortUrl].hasOwnProperty('getTotalClickCount') ){
		console.log('IT HAS THE FUNCTION METHOD Visitor')
		uniqueVisitorCount = urlDatabase[shortUrl].getUniqueVisitorCount();
	}  else {
		console.log(' IT DOESN"T HAE IT');
	}
	
	// if (typeof(urlDatabase[shortUrl].getTotalClickCount === 'function')){
	// 	console.log(typeof(urlDatabase[shortUrl].getTotalClickCount === 'function'))
	// 	totalClickCount = urlDatabase[shortUrl].getTotalClickCount();
	// }
	//
	// if (typeof(urlDatabase[shortUrl].getUniqueVisitorCount === 'function')){
	// 	uniqueVisitorCount = urlDatabase[shortUrl].getUniqueVisitorCount();
	// }


	const timePersonVisitTimeTable = urlDatabase[shortUrl].clickTimestamp;

	let templateVars = {
		shortURL: shortUrl,
		longURL: urlDatabase[req.params.id].longUrl,
        username: req.session.user_id,
		totalClicks: totalClickCount,
		totalUniques: uniqueVisitorCount,
		timeTable: timePersonVisitTimeTable,
	};
	res.render("urls_show", templateVars);
});

app.delete("/urls/:id", (req, res) => {
	console.log(req.params, 'app.del<<<<<<<<');
	delete urlDatabase[req.params.id];
	res.redirect('/urls');
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

app.put('/urls/:id', (req, res) => {
	const newUrl = req.body.updateLongUrl;
	const shortUrl = req.params.id;
	for(let shortUrlKey in urlDatabase) {
		if (shortUrlKey === shortUrl) {
			// update this long url
			urlDatabase[shortUrlKey].longUrl = newUrl;
		}
	}
	res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
	console.log(req.params, '<<<<<<<<');
  let newLongUrl = req.body.updateLongUrl;
  urlDatabase[req.params.id].longUrl = newLongUrl;
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
	let shortURL = req.params.shortURL;
	let longURL = urlDatabase[shortURL].longUrl;
	res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
	let shortUrlKey = req.params.id;
	delete urlDatabase[shortUrlKey];
	res.redirect("/urls");

});

app.listen(PORT, () => {
	console.log(`Example app listening on port ${PORT}!`);
});