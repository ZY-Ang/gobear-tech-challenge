// Enable test environment
process.env.NODE_ENV = 'test';

var request = require('superagent');
var should = require('should');
require('should-http');

var db = require('../db');
var config = require('./config');
var app = require('../app');

app.listen(3001);

before(function(done) {
  db.createTables(function() {
    db.applyFixtures(done);
  });
});

describe('User', function(){

  it('can successfully sign in', function(done){
    var agent = request.agent();
    agent
    .post(config.url('/express/signin'))
      .send({email: 'user1@example.com', password: 'password' })
      .end(function(error, res){
        res.redirects.should.eql([config.url('/express'), config.url('/express/')]);
        done();
      });
  });

  describe('cant sign in', function() {
    it('with wrong credentials', function(done) {
      var agent = request.agent();
      agent
      .post(config.url('/express/signin'))
        .send({email: 'unknown@email.com', password: 'unknown' })
        .end(function(error, res){
          res.text.should.containEql('Unknown user');
          done();
        });
    });

    it('if required fields are missing', function(done){
      var agent = request.agent();
      agent
      .post(config.url('/express/signin'))
        .send({email: '', password: '' })
        .end(function(error, res){
          res.text.should.containEql('Email is required');
          res.text.should.containEql('Password is required');
          done();
        });
    });
  });

  it('can successfully sign up', function(done) {
    var agent = request.agent();
    agent
    .post(config.url('/express/signup'))
      .send({email: 'usersadfasdf@example.com', password: 'password'})
      .end(function(error, res){
        res.redirects.should.eql([config.url('/express/signin')]);
        done();
      });
  });

  describe('cant signup', function() {
    it('if email is invalid', function(done) {
      var agent = request.agent();
      agent
      .post(config.url('/express/signup'))
        .send({email: 'invalid', password: 'password' })
        .end(function(error, res){
          res.text.should.containEql('Invalid email');
          done();
        });
    });

    it('if required fields are missing', function(done) {
      var agent = request.agent();
      agent
      .post(config.url('/express/signup'))
        .send({email: '', password: '' })
        .end(function(error, res){
          res.text.should.containEql('Invalid email');
          res.text.should.containEql('Password is required');
          done();
        });
    });

    it('if user already exists', function(done) {
      var agent = request.agent();
      agent
      .post(config.url('/express/signup'))
        .send({email: 'user1@example.com', password: 'password' })
        .end(function(error, res){
          res.text.should.containEql('User with given email already exists');
          done();
        });
    });

    // @TODO implement "if passwords do not match" case
  });
})
