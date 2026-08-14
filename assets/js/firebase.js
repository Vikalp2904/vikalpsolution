import { initializeApp } 
from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    onValue
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "XXXX",
    authDomain: "XXXX.firebaseapp.com",
    databaseURL: "https://testing-e3d18-default-rtdb.firebaseio.com/",
    projectId: "XXXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Database
const db = getDatabase(app);

// ===============================
// CONTACT FORM SUBMIT
// ===============================
const form = document.getElementById("contactForm");


if(form){

    form.addEventListener("submit", async function(e){

        e.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const message = document.getElementById("message").value;

        try {

            await push(ref(db, "contacts"), {
                name,
                email,
                message,
                createdAt: new Date().toISOString()
            });

            document.getElementById("status").innerHTML =
                "✅ Message Sent Successfully";

            form.reset();

        } catch(error){

            document.getElementById("status").innerHTML =
                "❌ " + error.message;
        }
    });
}

const contactsContainer = document.getElementById("contactsContainer");

if(contactsContainer){

    const contactsRef = ref(db, "contacts");

    onValue(contactsRef, (snapshot) => {

        contactsContainer.innerHTML = "";

        if(!snapshot.exists()){

            contactsContainer.innerHTML =
                "<p>No messages found.</p>";

            return;
        }

        const data = snapshot.val();

        Object.keys(data).reverse().forEach((key) => {

            const item = data[key];

            contactsContainer.innerHTML += `
            
            <div class="msg-card">
                <h3>${item.name}</h3>
                <p class="email">${item.email}</p>
                <p class="message">${item.message}</p>
                <span class="date">
                    ${new Date(item.createdAt).toLocaleString()}
                </span>
            </div>

            `;
        });
    });
}