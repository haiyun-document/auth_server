
exports.db = {
  host: 'localhost',
  port: 27017,
  db_name: 'auth_server_dev'
};

exports.oauth2_server = {
  authorize_url: '/oauth/authorize',
  process_login_url: '/oauth/login',
  token_url: '/oauth/token'
};

exports.oauth2_client = {
  process_login_url: '/login/process'
}

var server = exports.server = {
  base_url: "http://localhost:8080",
  login_url: '/login',
  logout_url: '/logout',
  // Skip user login to access web app:
  // Must be set to false in prod env.
  skip_auth_app: false
};

exports.auth_server = {
  // Define the client_id depending on DB:
  client_id: undefined,
  name: 'Auth server',
  redirect_uri: server.base_url + server.process_login_url
};

