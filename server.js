'use strict';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var fs = require('fs');
var bodyParser = require('body-parser');
var Git = require('nodegit');
var auth = require('./auth.json');

// TODO: use advanced file system handling, e.g. fs-extra

var repoPath = __dirname + '/cn-data';
var documentFile = __dirname + '/cn-data/document-dev';

function clone() {
    // TODO: check, if repo is already there and not empty

    // if (fs.readdirSync(repoPath).length === 0) {
    return Git.Clone('https://github.com/cn-data/cn-data.git', repoPath);
    // }
}

function pull() {
    var repo;

    return Git.Repository.open(repoPath).then(function(r) {
            repo = r;
            return repo.fetchAll();
        }).then(function() {
            return repo.mergeBranches('master', 'origin/master');
        })
        /*.then(function(index) {
                if (index.hasConflicts()) {
                    console.log('Conflict time!');
                }
            })*/
        .catch(function(reason) {
            console.log(reason);
        });
}

function push() {
    var repo;

    return Git.Repository.open(repoPath)
        .then(function(r) {
            repo = r;
            return repo.getRemote('origin');
        }).then(function(remote) {
            return remote.push(['refs/heads/master:refs/heads/master'], {
                callbacks: {
                    credentials: function() {
                        return Git.Cred.userpassPlaintextNew(auth.username, auth.password);
                    }
                }
            });
        }).then(function() {
            console.log('remote Pushed!');
        })
        .catch(function(reason) {
            console.log(reason);
        });
}

function addCommit() {
    var repo, oid;


    return Git.Repository.open(repoPath)
        .then(function(r) {
            repo = r;
            return repo.openIndex();
        })
        .then(function(index) {
            index.addByPath('document-dev');
            index.write();
            return index.writeTree();

        }).then(function(oidResult) {

            oid = oidResult;
            return Git.Reference.nameToId(repo, 'HEAD');

        }).then(function(head) {

            return repo.getCommit(head);

        }).then(function(parent) {

            var author = Git.Signature.now('Dev-Author', 'author@email.com');
            var committer = Git.Signature.now('Dev-Commiter', 'commiter@email.com');

            return repo.createCommit('HEAD', author, committer, 'dev dummy commit', oid, [parent]);
        }).then(function(commitId) {
            return console.log('New Commit: ', commitId);
        })
        .catch(function(reason) {
            console.log(reason);
        });
}

clone().then(addCommit).then(pull).then(push);

// app.use(bodyParser.json()); // to support JSON-encoded bodies
// app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
//     extended: true
// }));
//
// app.get('/', function(req, res) {
//     res.sendFile(__dirname + '/index.html');
// });
//
// app.get('/load', function(request, response) {
//
//     // TODO: pull
//
//     var data = null;
//     try {
//         data = fs.readFileSync(__dirname + '/doc-repo/document', 'utf8');
//     } catch (ex) {
//         if (ex.code === 'ENOENT') { //file not found
//             data = '';
//         } else {
//             throw ex;
//         }
//     }
//
//     response.json(data);
// });
//
// app.post('/apply', function(request, response) {
//     fs.writeFileSync(__dirname + '/doc-repo/document', request.body.text);
//     // git.add(__dirname + '/doc-repo/document')
//     //     .then()
//     //     .commit('edit document')
//     //     .then()
//     //     .push('origin', 'master')
//     //     .then(function() {
//     //         return response.json(true);
//     //     });
// });
//
// http.listen(51142, function() {
//     console.log('listening on *:51142');
// });
