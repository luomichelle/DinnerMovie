// Initialize Firebase

var userId = '';
var emailConfirmed = undefined;

function signedInDisplay() {
	$(".form-signin").html("<h6 style='color:white;'>You are signed in</h6><button type='submit' class='waves-effect waves-light red lighten-3 btn col s12' id='logout'>Log Out</button>");
}

function signedOutDisplay() {
  $(".form-signin").html('<img class="logo" src="assets/images/logo.png">' +
            '<div class="input-field">' +
            '<form>' +
            '<label class="active" for="email">Email</label>' +
            '<input id="email" type="text" class="validate" style="color:white;">' +
            '</div>' +
            '<div class="input-field col">' +
            '<label class="active" for="password">Password</label>' +
            '<input id="password" type="password" class="validate" style="color:white;">' +
            '</div>' +
            '<button type="submit" class="waves-effect waves-light red lighten-3 btn" id="login">Log In</button>' +
            '<button type="submit" class="waves-effect waves-light red lighten-3 btn" id="register">Register</button>' +
            '<button type="submit" class="waves-effect waves-light red lighten-3 btn hide" id="logout">Log Out</button>' +
            '</form>' +
            '</div>' +
            '</div>'
            );
}

function signedOutDisplayEmail() {
  $(".form-signin").html('<img class="logo" src="assets/images/logo.png">' +
            '<div class="input-field">' +
            '<form>' +
            '<label class="active" for="email">Email</label>' +
            '<input id="email" type="text" class="validate" style="color:white;">' +
            '</div>' +
            '<div class="input-field col">' +
            '<label class="active" for="password">Password</label>' +
            '<input id="password" type="password" class="validate" style="color:white;">' +
            '</div>' +
            '<button type="submit" class="waves-effect waves-light red lighten-3 btn" id="login">Log In</button>' +
            '<button type="submit" class="waves-effect waves-light red lighten-3 btn hide" id="logout">Log Out</button>' +
            '</form>' +
            '</div>' +
            '</div>'
            );
  emailConfirmed = true;
}

function emailVerifyDisplay() {
	// $(".form-signin").html("<h1>Please Verify Email to continue.</h2><p>If you've already verified your email, please click on the button below.</p><button id='email_confirmed' class='btn btn-lg btn-primary btn-block'>Email Confirmed</button>");
  $(".form-signin").html("<h2>Please Verify Email to continue.</h2><p>If you've already verified your email, please click on the button below.</p><button id='email_confirmed' type='submit' class='waves-effect waves-light red lighten-3 btn col s12'>Email Confirmed</button><button type='submit' class='waves-effect waves-light red lighten-3 btn col s12' id='logout'>Log Out</button>");
}

function appPageLoad() {
  sessionStorage.setItem("appPageLoaded", "true");
  window.location = "app.html";
}

function loginPageLoad() {
  sessionStorage.setItem("appPageLoaded", "false");
  window.location = "index.html";
}

function toggleSignIn() {
  if (firebase.auth().currentUser && emailConfirmed === undefined) {
    // [START signout]
    firebase.auth().signOut();
    // [END signout]
    loginPageLoad();
  } else {
    var email = $("#email").val();
    var password = $("#password").val();
    
    if (email.length < 4) {
      Materialize.toast('Please enter an email address.', 4000);
      return;
    }
    if (password.length < 4) {
      Materialize.toast('Please enter a password.', 4000);
      return;
    }
    // Sign in with email and pass.
    // [START authwithemail]
    firebase.auth().signInWithEmailAndPassword(email, password)
    .then(function(response) {
      appPageLoad();
    })
    .catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // [START_EXCLUDE]
      if (errorCode === 'auth/wrong-password') {
        Materialize.toast('Wrong password.', 4000);
      } else {
        Materialize.toast(errorMessage, 4000);
      }
      console.log(error);
      // [END_EXCLUDE]
    });
    // [END authwithemail]
  }
}

function reloadPage() {
	location.reload();
}
/**
 * Handles the sign up button press.
 */
function handleSignUp() {

  var email = $("#email").val();
  var password = $("#password").val();

  if (email.length < 4) {
    Materialize.toast('Please enter an email address.', 4000);
    return;
  }
  if (password.length < 4) {
    Materialize.toast('Please enter a password.', 4000);
    return;
  }

  // Sign in with email and pass.
  // [START createwithemail]
  firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // [START_EXCLUDE]
    if (errorCode == 'auth/weak-password') {
      Materialize.toast('The password is too weak.', 4000);
    } else {
      Materialize.toast(errorMessage, 4000);
    }
    console.log(error);
    // [END_EXCLUDE]
  }).then(function(result){
  	sendEmailVerification();
  });
  // [END createwithemail]
}
/**
 * Sends an email verification to the user.
 */

function sendEmailVerification() {
  // [START sendemailverification]
  firebase.auth().currentUser.sendEmailVerification().then(function() {
    // Email Verification sent!
    // [START_EXCLUDE]
    Materialize.toast('Email Verification Sent!', 4000);
    // [END_EXCLUDE]
  })
  // [END sendemailverification]
}

var initApp = function() {

	firebase.auth().onAuthStateChanged(function(user) {
	  if (user) {
	    // User is signed in.
	    $("#logout").removeClass("hide");
	    user.getToken().then(function(accessToken) {

	    	if (!user.emailVerified) {
          console.log(window.location.href);
          if (window.location.href != "https://enigmatic-gorge-23147.herokuapp.com/index.html") {
            window.location = "index.html";
          }
          emailVerifyDisplay();
        } else {
          userId = user.uid;
          db.setRestOnLoad();
          db.getMovieOnLoad();
          signedInDisplay();
        }   	


	  	});
	  } else {
	    // User is signed out.
	    signedOutDisplay();
	  }
	}, function(error) {
	  console.log(error);
	});

	$(document).on("click", "#login", toggleSignIn);
	$(document).on("click", "#logout", toggleSignIn);
	$(document).on("click", "#register", handleSignUp);
	$(document).on("click", "#email_confirmed", signedOutDisplayEmail);
}

window.onload = function() {
   initApp();
};
