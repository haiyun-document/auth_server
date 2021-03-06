/*
 * Script to load test/dev data in the application.
 */

var server = require('../server')
  , model = require('../model')
  , CLB = require('nodetk/orchestration/callbacks')
  , tkfs = require('nodetk/fs')
  , fs = require('fs')
  , R = model.RFactory()
  , config = require('../lib/config_loader').get_config()

  // indexes:
  , email2user = {}
  , name2client = {}
  ;

var DEBUG = false;


var clear_collections = function(callback) {
  /* Erase all the data (delete the store files) and call callback.
   */
  var collections = [R.Client, R.Grant, R.User, R.Authorization];
  var waiter = CLB.get_waiter(collections.length, function() {
    callback && callback();
  });
  collections.forEach(function(collection) {
    collection.remove(waiter);
  });
};

var load_users = function(callback) {
  /* Load end users data in store.
   */
  var emails = [
    'pruyssen@af83.com',
    'toto@af83.com',
    'titi@titi.com',
    'ori@af83.com'
  ];

  if (config.hash_lib == "bcrypt") {
    var password = "$2a$04$DihcjQ4rOLjKtusXGcOwsO3SjbUA5oC/GLAJHBXoPhHsSODCcybDC";
  } // password = 1234 (hashed using bcrypt)
  else if (config.hash_lib == "crypto"){
    var password = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";
  } // password = 1234 (hashed using sha256)

  var users = emails.map(function(email) {
    var user =  new R.User({
      email: email,
      password: password,
      confirmed: 1,
    });
    email2user[user.email] = user;
    return user;
  });
  R.save(users, callback, function(err) {
    throw err;
  });
};


var load_clients = function(callback) {
  /* Load the client applications in store.
   */
  var clients = [
    // name, redirect_uri
    [config.oauth2_client.name, config.oauth2_client.client.redirect_uri],
    ["errornot", 'http://127.0.0.1:8888/login'],
    ["text_server", 'http://127.0.0.1:5000/oauth2/process'],
    ["test_client", 'http://127.0.0.1:7070/login/process/'],
    ["geeks", 'http://127.0.0.1:3000/oauth2/process'],
    ['trac', 'http://localhost:8080/trac_env_test/auth_server_process'],
    ['local_redishttp', 'http://localhost:3000/oauth2/process']
  ];
  clients = clients.map(function(t) {
    var client = new R.Client({
      name: t[0],
      redirect_uri: t[1],
      secret: 'some secret string'
    });
    name2client[client.name] = client;
    return client;
  });
  R.save(clients, function() {
    config.oauth2_client.client_id = name2client[config.oauth2_client.name].id;
    DEBUG && console.log('test_client id:', name2client['test_client'].id);
    callback()
  }, function(err) {
    throw err;
  });
};


var load_authorizations = function(callback) {
  /* Load authorizations in DB.
   */
  var auths = [
   // user email , client name, context, roles
    ['pruyssen@af83.com', config.oauth2_client.name,
                          config.oauth2_client.name, ['admin']],
    ['pruyssen@af83.com', 'errornot', 'errornot', ['user', 'admin']],
    ['pruyssen@af83.com', 'errornot', 'text_server', ['user', 'admin']],
    ['pruyssen@af83.com', 'errornot', 'auth_server', ['user', 'admin']],
    ['pruyssen@af83.com', 'text_server', 'auth_server', ['user', 'admin']],
    ['pruyssen@af83.com', 'text_server', 'text_server', ['user', 'admin']],
    ['pruyssen@af83.com', 'geeks', '/', ['user', 'admin']],
    ['ori@af83.com', config.oauth2_client.name,
                          config.oauth2_client.name, ['admin']],
    ['ori@af83.com', 'errornot', 'errornot', ['user', 'admin']],
    ['ori@af83.com', 'errornot', 'text_server', ['user', 'admin']],
    ['ori@af83.com', 'errornot', 'auth_server', ['user', 'admin']],
    ['ori@af83.com', 'text_server', 'auth_server', ['user', 'admin']],
    ['ori@af83.com', 'text_server', 'text_server', ['user', 'admin']],
    ['ori@af83.com', 'geeks', '/', ['user', 'admin']],
    ['ori@af83.com', 'local_redishttp', '/', ['user', 'admin']],
    ['ori@af83.com', 'local_redishttp', '/redis', ['user', 'admin']],
    ['ori@af83.com', 'local_redishttp', '/vote', ['user', 'admin']],
  ];
  auths = auths.map(function(auth) {
    return new R.Authorization({
      email: auth[0],
      client: name2client[auth[1]],
      context: auth[2],
      roles: auth[3]
    })
  });
  R.save(auths, callback, function(err) {
    throw err;
  });
};


var run = exports.run = function(callback) {
  clear_collections(function() {
    var waiter = CLB.get_waiter(2, function() {
      load_authorizations(callback);
    });
    load_users(waiter);
    load_clients(waiter);
  });
};


if(process.argv[1] == __filename) {
  DEBUG = true;
  console.log('Reset data in DB...');
  run(function() {
    process.exit()
  });
}

