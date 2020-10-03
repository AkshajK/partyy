//const { OAuth2Client } = require("google-auth-library");
const User = require("./models/user");
const socket = require("./server-socket");

// create a new OAuth client used to verify google sign-in
//    TODO: replace with your own CLIENT_ID
//const CLIENT_ID = "121479668229-t5j82jrbi9oejh7c8avada226s75bopn.apps.googleusercontent.com";
//const client = new OAuth2Client(CLIENT_ID);

// accepts a login token from the frontend, and verifies that it's legit
// only works for google
/*
function verify(token) {
  return client
    .verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    })
    .then((ticket) => ticket.getPayload());
}
*/



// gets user from DB, or makes a new account if it doesn't exist yet
function getOrCreateUser(token) {
  // the "sub" field means "subject", which is a unique identifier for each user
  return User.findOne({ cookieToken: token }).then((existingUser) => {
    if (existingUser) return existingUser;
    const animals = ["Duck", "Monkey", "Dog", "Elephant", "Dummy", "Jerry", "Tom", "Pea-Eating Duck"];
    const random = Math.floor(Math.random() * animals.length);
    const newUser = new User({
      name: "Anonymous " + animals[random],
      cookieToken: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    });

    return newUser.save();
  });
}

/*
login
Input (req.body): {cookieToken: String} or {}
Precondition: 
Socket: 
Returns: {user: User}
Description: If req.body.cookieToken, log them in as the user with that cookieToken. Else, create a new User object for them and log them in as that. Return the user object
*/
function login(req, res) {
  getOrCreateUser(req.body.cookieToken)
    .then((user) => {
      // persist user in the session
      req.session.user = user;
      res.send(user);
    })
    .catch((err) => {
      console.log(`Failed to log in: ${err}`);
      res.status(401).send({ err });
    });
}

function logout(req, res) {
  req.session.user = null;
  res.send({});
}

function populateCurrentUser(req, res, next) {
  // simply populate "req.user" for convenience
  req.user = req.session.user;
  next();
}

function ensureLoggedIn(req, res, next) {
  if (!req.user) {
    return res.status(401).send({ err: "not logged in" });
  }

  next();
}

module.exports = {
  login,
  logout,
  populateCurrentUser,
  ensureLoggedIn,
};
