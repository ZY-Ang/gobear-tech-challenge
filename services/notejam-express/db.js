const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql');
const async = require('async');
const settings = require('./settings');
let db;
if (process.env.NODE_ENV !== 'production') {
  db = new sqlite3.Database(settings.db);
}

const functions = {
  createTables: function(next) {
    if (process.env.NODE_ENV === 'production') {
      const connection = mysql.createConnection({
        host: process.env.DATABASE_ENDPOINT,
        ssl: "Amazon RDS",
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        // database: process.env.DATABASE_SCHEMA
      });
      connection.connect(err => {
        if (err) throw err;
        console.log('MySQL Connected');
        async.series({
            createSchema: function(callback) {
                connection.query("CREATE SCHEMA IF NOT EXISTS " + process.env.DATABASE_SCHEMA, function(err) {
                    if (err) callback(err);
                    else callback(null);
                });
            },
            useSchema: function(callback) {
                connection.query("USE " + process.env.DATABASE_SCHEMA, function(err) {
                    if (err) callback(err);
                    else callback(null);
                });
            },
            createUsers: function(callback) {
                connection.query(`CREATE TABLE IF NOT EXISTS users(
                    id INTEGER PRIMARY KEY NOT NULL AUTO_INCREMENT,
                    email varchar(75) NOT NULL,
                    password VARCHAR(128) NOT NULL
                );`,
                    function (error, result, fields) {
                        if (error) callback(err);
                        else {
                            console.log(result);
                            callback(null);
                        }
                });
            },
            createPads: function(callback) {
                connection.query(`CREATE TABLE IF NOT EXISTS pads(
                    id INTEGER PRIMARY KEY AUTO_INCREMENT NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    user_id INTEGER NOT NULL REFERENCES users(id)
                );`,
                    function (error, result, fields) {
                        if (error) callback(err);
                        else {
                            console.log(result);
                            callback(null);
                        }
                });
            },
            createNotes: function(callback) {
                connection.query(`CREATE TABLE IF NOT EXISTS notes (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT NOT NULL,
                    pad_id INTEGER REFERENCES pads(id),
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    name VARCHAR(100) NOT NULL,
                    text text NOT NULL,
                    created_at TIMESTAMP DEFAULT current_timestamp,
                    updated_at TIMESTAMP DEFAULT current_timestamp
                );`,
                    function(error, result, fields) {
                        if (error) callback(err);
                        else {
                            console.log(result);
                            callback(null);
                        }
                });
            },
            end: function(callback) {
                connection.end(err => {
                    if (err) callback(err);
                    else {
                        console.log("MySQL Connection Terminated Successfully");
                        callback(null);
                    }
                });
            }
        }, function (err, results) {
          next();
        });
      });
    } else {
      async.series({
        createUsers: function (callback) {
          db.run("CREATE TABLE IF NOT EXISTS users (" +
              "id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL," +
              "email VARCHAR(75) NOT NULL," +
              "password VARCHAR(128) NOT NULL);", [],
              function () {
                callback(null);
              });
        },
        createPads: function (callback) {
          db.run("CREATE TABLE IF NOT EXISTS pads (" +
              "id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL," +
              "name VARCHAR(100) NOT NULL," +
              "user_id INTEGER NOT NULL REFERENCES users(id));", [],
              function () {
                callback(null);
              })
        },
        createNotes: function (callback) {
          db.run("CREATE TABLE IF NOT EXISTS notes (" +
              "id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL," +
              "pad_id INTEGER REFERENCES pads(id)," +
              "user_id INTEGER NOT NULL REFERENCES users(id)," +
              "name VARCHAR(100) NOT NULL," +
              "text text NOT NULL," +
              "created_at default current_timestamp," +
              "updated_at default current_timestamp);", [],
              function () {
                callback(null);
              });
        }
      }, function (err, results) {
        next();
      });
    }
  },

  applyFixtures: function(next) {
    this.truncateTables(function() {
      async.series([
        function(callback) {
          db.run("INSERT INTO users VALUES (1, 'user1@example.com', " +
                 "'$2a$10$mhkqpUvPPs.zoRSTiGAEKODOJMljkOY96zludIIw.Pop1UvQCTx8u')", [],
                function() { callback(null) });
        },
        function(callback) {
          db.run("INSERT INTO users VALUES (2, 'user2@example.com', " +
                 "'$2a$10$mhkqpUvPPs.zoRSTiGAEKODOJMljkOY96zludIIw.Pop1UvQCTx8u')", [],
                function() { callback(null) });

        },
        function(callback) {
          db.run("INSERT INTO pads VALUES (1, 'Pad 1', 1)", [],
                function() { callback(null) });
        },
        function(callback) {
          db.run("INSERT INTO pads VALUES (2, 'Pad 2', 1)", [],
                function() { callback(null) });
        },
        function(callback) {
          db.run("INSERT INTO notes VALUES (1, 1, 1, 'Note 1', 'Text', 1, 1)", [],
                function() { callback(null) });
        },
        function(callback) {
          db.run("INSERT INTO notes VALUES (2, 1, 1, 'Note 2', 'Text', 1, 1)", [],
                function() { callback(null) });
        }
      ], function(err, results) {
        next();
      })
    });
  },

  truncateTables: function(next) {
    async.series([
      function(callback) {
        db.run("DELETE FROM users;", [],
              function() { callback(null) });
      },
      function(callback) {
        db.run("DELETE FROM notes;", [],
              function() { callback(null) });

      },
      function(callback) {
        db.run("DELETE FROM pads;", [],
              function(result) { callback(null); });
      }
    ], function(err, results) {
      next();
    })
  }
};


if (require.main === module) {
  functions.createTables(function() {
    console.log("DB successfully initialized");
  });
}

module.exports = functions;
