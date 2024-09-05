const firebase = require("firebase/app");
require("firebase/auth");
require("firebase/firestore");

// Add Firebase SDK Snippet
// databaseURL: "",
// measurementId: "",
const firebaseConfig = {
  apiKey: "AIzaSyAPpjED3wRoJQ1_RHKHu9rEth7kLPWWTLA",
  authDomain: "whms-auth-7ed4b.firebaseapp.com",
  projectId: "whms-auth-7ed4b",
  storageBucket: "whms-auth-7ed4b.appspot.com",
  messagingSenderId: "198515750686",
  appId: "1:198515750686:web:69b3755dea12a23010fb0f"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

module.exports = firebase;
