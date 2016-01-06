var express = require('express');
var app = express();
var http = require('http').Server(app);
var fs = require('fs');
var bodyParser = require('body-parser');

try {
    fs.mkdirSync(__dirname + '/doc-repo');
} catch (ex) {
    if (ex.code !== 'EEXIST') { //throw all errors except 'directory exists already'
        throw ex;
    }
}

var git = require('simple-git')(__dirname + '/doc-repo');

if (fs.readdirSync(__dirname + '/doc-repo').length === 0) {
    git.clone('https://github.com/tklepzig/cn-doc-test.git', '.');
}


app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/load', function(request, response) {

    var data = null;
    try {
        data = fs.readFileSync(__dirname + '/doc-repo/document', 'utf8');
    } catch (ex) {
        if (ex.code === 'ENOENT') { //file not found
            data = '';
        } else {
            throw ex;
        }
    }

    response.json(data);
});

app.post('/apply', function(request, response) {
    fs.writeFileSync(__dirname + '/doc-repo/document', request.body.text);
    git.add(__dirname + '/doc-repo/document')
        .then()
        .commit('edit document')
        .then()
        .push('origin', 'master')
        .then(function() {
            return response.json(true);
        });
});

http.listen(51142, function() {
    console.log('listening on *:51142');
});
