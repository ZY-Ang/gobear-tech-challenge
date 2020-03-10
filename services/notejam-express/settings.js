const settings = {
  production: {
    db: "notejam.db",
    dsn: "mysql://" + process.env.DATABASE_USERNAME + ":" + process.env.DATABASE_PASSWORD + "@" + process.env.DATABASE_ENDPOINT + "/" + process.env.DATABASE_SCHEMA
  },
  development: {
    db: "notejam.db",
    dsn: "sqlite://notejam.db"
  },
  test: {
    db: "notejam_test.db",
    dsn: "sqlite://notejam_test.db"
  }
};


let env = process.env.NODE_ENV;
if (!env || !settings[env]) env = 'development';
module.exports = settings[env];
