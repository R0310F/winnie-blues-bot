const sqlite3 = require('sqlite3').verbose();

// Initialize the database
const db = new sqlite3.Database('./waitlist.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Database connected.');
        db.run(`CREATE TABLE IF NOT EXISTS waitlist
        (
            pos
            INTEGER
            NOT
            NULL,
            id
            TEXT
            NOT
            NULL
            UNIQUE,
            PRIMARY
            KEY
                (
            id
                )
            )`, (err) => {
            if (err) {
                console.error('Error creating table', err.message);
            }
        });
    }
});

// Add a user to the waitlist
function addUser(userId) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.get(`SELECT MAX(pos) as maxPos
                    FROM waitlist`, (err, row) => {
                if (err) {
                    reject(`Error finding max position: ${err.message}`);
                } else {
                    const position = row.maxPos !== null ? row.maxPos + 1 : 1;
                    db.run(`INSERT INTO waitlist (pos, id)
                            VALUES (?, ?)`, [position, userId], (err) => {
                        if (err) {
                            reject(`Error adding user to waitlist: ${err.message}`);
                        } else {
                            resolve(`You have joined the waitlist, you are #${position}.`);
                        }
                    });
                }
            });
        });
    });
}

// Remove a user from the waitlist
function removeUser(userId) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`DELETE
                    FROM waitlist
                    WHERE id = ?`, [userId], function (err) {
                if (err) {
                    reject(`Error removing user from waitlist: ${err.message}`);
                } else if (this.changes > 0) {
                    db.run(`UPDATE waitlist
                            SET pos = pos - 1
                            WHERE pos > (SELECT pos FROM waitlist WHERE id = ?)`, [userId], (err) => {
                        if (err) {
                            reject(`Error updating positions: ${err.message}`);
                        } else {
                            resolve(`User removed from waitlist: <@${userId}>`);
                        }
                    });
                } else {
                    resolve(`No user found with ID: ${userId}`);
                }
            });
        });
    });
}

// Get a single user from the waitlist
function getUser(userId) {
    return new Promise((resolve, reject) => {
        const query = `SELECT *
                       FROM waitlist
                       WHERE id = ?`;
        db.get(query, [userId], (err, row) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(row); // row will be undefined if no user is found
            }
        });
    });
}

// Get all users from the waitlist
function getAllUsers() {
    return new Promise((resolve, reject) => {
        const query = `SELECT *
                       FROM waitlist`;
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {addUser, removeUser, getUser, getAllUsers};