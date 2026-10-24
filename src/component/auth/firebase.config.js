// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCbeXhHZC7RChw8Nnn0WJffKmMVIz4Hky8",
  authDomain: "project-managment-saas.firebaseapp.com",
  projectId: "project-managment-saas",
  storageBucket: "project-managment-saas.firebasestorage.app",
  messagingSenderId: "189486289036",
  appId: "1:189486289036:web:7e18f3d1969b9d79982ba9",
  measurementId: "G-TM194FBHSV",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export default auth;
