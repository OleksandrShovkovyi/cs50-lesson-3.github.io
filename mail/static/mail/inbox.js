// Init Event Handlers For All Buttons
document.addEventListener('DOMContentLoaded', function() {
    // Use Buttons to Toggle Between Views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);
    // By Default, Load The Inbox
    load_mailbox('inbox');
});

// Function Template For Compose View
function compose_email() {
    // Show Compose View and Hide Other Views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#email-content-view').style.display = 'none';
    // Clear Out Composition Fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
    // Send Email
    document.querySelector('#compose-view').onsubmit = function() {
        fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: document.querySelector('#compose-recipients').value,
                subject: document.querySelector('#compose-subject').value,
                body: document.querySelector('#compose-body').value
            })
        })
        .then(response => response.json())
        .then(result => {
            console.log(result);
        });
        load_mailbox('sent');
        return false;
    };
}

// Function Template For Compose View
function reply_email(recipient, subject, timestamp, body) {
    // Show Compose View and Hide Other Views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#email-content-view').style.display = 'none';
    // Clear Out Composition Fields
    document.querySelector('#compose-recipients').value = recipient;
    if (subject.includes('Re: ')) {
        document.querySelector('#compose-subject').value = subject;
    } else {
        document.querySelector('#compose-subject').value = `Re: ${subject}`;
    };
    document.querySelector('#compose-body').innerHTML = `On ${timestamp} ${recipient} wrote: ${body}`;
    // Send Email
    document.querySelector('#compose-view').onsubmit = function() {
        fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: document.querySelector('#compose-recipients').value,
                subject: document.querySelector('#compose-subject').value,
                body: document.querySelector('#compose-body').value
            })
        })
        .then(response => response.json())
        .then(result => {
            console.log(result);
        });
        load_mailbox('sent');
        return false;
    };
}

// Function Template For Another Pages
function load_mailbox(mailbox) {
    // Show The Mailbox and Hide Other Views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-content-view').style.display = 'none';
    if (mailbox === 'sent') {
        document.querySelector('#actions').style.display = 'none';
    } else {
        document.querySelector('#actions').style.display = 'table-cell';
    };
    // Show The Mailbox Name
    document.querySelector('#main-title').innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;
    // Clear Emails Table Body
    // document.getElementById('emails-body').innerHTML = '';
    var Parent = document.getElementById('emails-body');
    while (Parent.hasChildNodes()) {
        Parent.removeChild(Parent.firstChild);
    };
    // Get Emails
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        console.log(emails);
        emails.forEach(email => populate_mailbox(mailbox, email))
    });
}

function populate_email(email) {
    // Show 'Open Email' View and Hide Other Views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-content-view').style.display = 'block';
    // Pre-Clear Target Fields
    document.querySelector('#from').innerHTML = '';
    document.querySelector('#to').innerHTML = '';
    document.querySelector('#subject').innerHTML = '';
    document.querySelector('#timestamp').innerHTML = '';
    document.querySelector('#body').innerHTML = '';
    // Fields Populate
    document.querySelector('#from').innerHTML = `<b>From:</b> ${email.sender}`;
    document.querySelector('#to').innerHTML = `<b>To:</b> ${email.recipients}`;
    document.querySelector('#subject').innerHTML = `<b>Subject:</b> ${email.subject}`;
    document.querySelector('#timestamp').innerHTML = `<b>Timestamp:</b> ${email.timestamp}`;
    document.querySelector('#body').innerHTML = email.body;
    // Add Reply Event Handler
    document.querySelector('#reply').addEventListener('click', () => reply_email(email.sender, email.subject, email.timestamp, email.body));
}

// Function For Mailbox Content Parse
function populate_mailbox(mailbox, email) {
    // Add New Table Row
    var row = document.createElement('tr');
    // Add Cells Template
    var sender = document.createElement("td");
    var subject = document.createElement("td");
    var timestamp = document.createElement("td");
    var arch = document.createElement("td");
    var arch_button =  document.createElement('button');
    arch_button.setAttribute("id", "arch-button");
    arch_button.setAttribute("class", "btn btn-sm btn-outline-warning");
    // Set Button Label
    if (mailbox === 'inbox') {
        arch_button.innerHTML = '<b>Archive</b>';
        // Add Button Event Handler
        arch_button.addEventListener('click', function() {
            // Put Email In Archive
            fetch(`/emails/${email.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    archived: true
                })
            })
            .then(load_mailbox('inbox'));
        });
    } if (mailbox === 'archive') {
        arch_button.innerHTML = '<b>Unarchive</b>';
        // Add Button Event Handler
        arch_button.addEventListener('click', function() {
            // Unarch Email
            fetch(`/emails/${email.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    archived: false
                })
            })
            .then(load_mailbox('inbox'));
        });
    };
    // Write Cells
    sender.innerHTML = email.sender;
    subject.innerHTML = email.subject;
    // Add Subject Event Handler
    subject.addEventListener('click', function() {
        get_email(email.id);
    });
    timestamp.innerHTML = email.timestamp;
    arch.appendChild(arch_button);
    // Add Cells to Row
    row.appendChild(sender);
    row.appendChild(subject);
    row.appendChild(timestamp);
    // Check Mailbox Type
    if (mailbox !== 'sent') {
        row.appendChild(arch);
    };
    // Check Email Read Status
    if (email.read === true) {
        row.style.backgroundColor = 'rgba(0,0,0,.05)';
    };
    // Append Row to Table
    document.getElementById('emails-body').appendChild(row);
}

function get_email(email_id) {
    // Mark Email As Read
    fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    });
    // Get Emails
    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
        console.log(email);
        populate_email(email);
    });
}