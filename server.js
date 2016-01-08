'use strict';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var fs = require('fs');
var bodyParser = require('body-parser');
var Git = require('nodegit');

// TODO: use advanced file system handling, e.g. fs-extra

var repoPath = __dirname + '/doc-repo';
var documentFile = __dirname + '/doc-repo/document';

function clone() {
    //clone repo if not yet done
    // if (fs.readdirSync(repoPath).length === 0) {

    // TODO: check, if repo is already there and not empty
    return Git.Clone('https://github.com/tklepzig/cn-doc-test.git', repoPath);
    // }
}

function pull() {
    var repo;

    return Git.Repository.open(repoPath).then(function(r) {
        repo = r;
        return repo.fetchAll({
            credentials: function() {
                return Git.Cred.userpassPlaintextNew('username', 'password');
            }
        });
    }).then(function() {
        repo.mergeBranches('master', 'origin/master');
    });
}

function push() {
    var repo;

    Git.Repository.open(repoPath)
        .then(function(r) {
            repo = r;
            return repo.getRemote('origin');
        }).then(function(remote) {
            return remote.push(['refs/heads/master:refs/heads/master'], {
                callbacks: {
                    credentials: function(url, userName) {
                        return Git.Cred.userpassPlaintextNew('username', 'password');
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
            // this file is in the root of the directory and doesn't need a full path
            index.addByPath('document');

            // this will write files to the index
            index.write();

            return index.writeTree();

        }).then(function(oidResult) {

            oid = oidResult;
            return Git.Reference.nameToId(repo, 'HEAD');

        }).then(function(head) {

            return repo.getCommit(head);

        }).then(function(parent) {

            var author = Git.Signature.now('Author Name', 'author@email.com');
            var committer = Git.Signature.now('Commiter Name', 'commiter@email.com');

            return repo.createCommit('HEAD', author, committer, 'Edit Document 2', oid, [parent]);
        }).then(function(commitId) {
            return console.log('New Commit: ', commitId);
        })
        .catch(function(reason) {
            console.log(reason);
        });

}

clone().then(addCommit).then(push);
pull();

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
