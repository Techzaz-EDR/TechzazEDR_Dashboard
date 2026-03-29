export const environment = {
    production: false,
    firebase: {
        apiKey: "AIzaSyDWndJJ1YltOnmc6JIMEhAtwIdyNAC7SFY",
        authDomain: "techzazedr.firebaseapp.com",
        projectId: "techzazedr",
        storageBucket: "techzazedr.firebasestorage.app",
        messagingSenderId: "1085060204960",
        appId: "1:1085060204960:web:c17828bbf34584851ffcc5",
        measurementId: "G-P4H6BWZRWY"
    },
    apiUrl: window.location.hostname.includes('railway.app')
        ? "https://techzazedrdashboard-backend-production.up.railway.app/api/v1"
        : `http://${window.location.hostname}:8000/api/v1`
};
